import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { forwardRef, Inject, Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard.js';
import { ChatService } from '../modules/chat/chat.service.js';
import { SosService } from '../modules/sos/sos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { PresenceService } from './presence.service.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import { TrackingService } from './tracking.service.js';

type AuthedSocket = Socket & {
  data: { user?: { id: string; role: string }; typingLast?: Map<string, number> };
};

const TYPING_THROTTLE_MS = 1500;

function ok(data: unknown): { status: string; data: unknown } {
  return { status: 'ok', data };
}

function gatewayError(code: string, message: string): { status: string; code: string; message: string } {
  return { status: 'error', code, message };
}

function errorFrom(err: unknown): { status: string; code: string; message: string } {
  const e = err as { getResponse?: () => unknown; code?: string; message?: string };
  const body = typeof e?.getResponse === 'function' ? (e.getResponse() as { code?: string; message?: string }) : null;
  return {
    status: 'error',
    code: body?.code ?? e?.code ?? 'INTERNAL_ERROR',
    message: body?.message ?? e?.message ?? 'Internal error',
  };
}

// Nest-native port of Main Server/socketServer.ts + sockets/*.
// Rooms: user:{id}, role:{role}, trip:{id}, booking:{id}, support:{id}.
// Redis adapter wiring happens in main.ts bootstrap (skipped in test env).
@WebSocketGateway({ cors: true, connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 } })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => TrackingService))
    private readonly tracking: TrackingService,
    @Inject(forwardRef(() => PresenceService))
    private readonly presence: PresenceService,
    @Inject(forwardRef(() => SocketRateLimiter))
    private readonly rateLimiter: SocketRateLimiter,
    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
    @Inject(forwardRef(() => SosService))
    private readonly sos: SosService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // Mirrors Express socketAuth middleware: authenticate the handshake token
  // at connect so user/role rooms + presence work connection-wide.
  afterInit(server: Server): void {
    server.use(async (socket, next) => {
      try {
        const token =
          (socket.handshake.auth?.token as string | undefined) ??
          (socket.handshake.query?.token as string | undefined);
        if (!token) return next(new Error('AUTH_REQUIRED'));
        const decoded = (await this.jwt.verifyAsync(token, {
          secret: this.config.get<string>('jwt.secret'),
        })) as { id?: string; role?: string; type?: string };
        if (decoded.type !== 'access' || !decoded.id) return next(new Error('INVALID_TOKEN'));
        if (await this.redis.getKey(`blacklist:${token}`)) return next(new Error('TOKEN_REVOKED'));
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true, status: true },
        });
        if (!user) return next(new Error('USER_NOT_FOUND'));
        if (user.status === 'banned' || user.status === 'suspended') {
          return next(new Error('ACCOUNT_SUSPENDED'));
        }
        (socket as AuthedSocket).data.user = { id: user.id, role: user.role };
        next();
      } catch (err) {
        next(err instanceof Error ? err : new Error('AUTH_FAILED'));
      }
    });
  }

  handleConnection(client: AuthedSocket): void {
    const user = client.data.user;
    if (user) {
      void client.join(`user:${user.id}`);
      void client.join(`role:${user.role}`);
      void this.presence.markOnline(user.id, user.role).catch(() => undefined);
    }
    this.logger.debug(`socket connected ${client.id}`);
  }

  handleDisconnect(client: AuthedSocket): void {
    const user = client.data.user;
    if (user) this.presence.scheduleOffline(user.id, user.role);
    this.logger.debug(`socket disconnected ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('tracking:join')
  async trackingJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { trip_id: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const member = await this.tracking.isTripMember(user, payload.trip_id);
      if (!member) {
        return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP');
      }
      if (!(await this.tracking.isTripActive(payload.trip_id))) {
        return gatewayError('TRACKING_CONFLICT', 'TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS');
      }
      await client.join(`trip:${payload.trip_id}`);
      return ok({ room: `trip:${payload.trip_id}` });
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('tracking:start')
  async trackingStart(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { trip_id: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      return ok(await this.tracking.startTracking(user, payload.trip_id));
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('tracking:location')
  async trackingLocation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const { allowed } = await this.rateLimiter.checkRateLimit('tracking', 'location', user.id);
      if (!allowed) return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      return ok(await this.tracking.updateLocation(user, payload as never));
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('tracking:stop')
  async trackingStop(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { trip_id: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      return ok(await this.tracking.stopTracking(user, payload.trip_id));
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('presence:heartbeat')
  async presenceHeartbeat(
    @ConnectedSocket() client: AuthedSocket,
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      await this.presence.markOnline(user.id, user.role);
      return ok({ status: 'online' });
    } catch (err) {
      return errorFrom(err);
    }
  }

  // Port of Main Server/sockets/chatSocket.ts: booking + support-ticket chat.
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chat:join')
  async chatJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { booking_id?: string; support_ticket_id?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const { booking_id, support_ticket_id } = payload ?? {};
      if (booking_id) {
        await this.chat.assertBookingChatOpen(user, booking_id);
        await client.join(`booking:${booking_id}`);
        this.presence
          .getStatus(user.id)
          .then((status) => {
            client.to(`booking:${booking_id}`).emit('presence:status', {
              user_id: user.id,
              status,
              last_seen: new Date().toISOString(),
              timestamp: Date.now(),
            });
          })
          .catch(() => undefined);
        return ok({ room: `booking:${booking_id}` });
      }
      if (support_ticket_id) {
        const member = await this.chat.isTicketMember(user, support_ticket_id);
        if (!member) {
          return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        }
        await client.join(`support:${support_ticket_id}`);
        return ok({ room: `support:${support_ticket_id}` });
      }
      return gatewayError('VALIDATION_FAILED', 'PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chat:leave')
  chatLeave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { booking_id?: string; support_ticket_id?: string },
  ): unknown {
    const { booking_id, support_ticket_id } = payload ?? {};
    if (booking_id) void client.leave(`booking:${booking_id}`);
    if (support_ticket_id) void client.leave(`support:${support_ticket_id}`);
    return ok({ left: true });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chat:send')
  async chatSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { booking_id?: string; support_ticket_id?: string; message?: string; message_type?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const { allowed } = await this.rateLimiter.checkRateLimit('chat', 'chat', user.id);
      if (!allowed) return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      const { booking_id, support_ticket_id, message, message_type } = payload ?? {};
      if (booking_id) {
        return ok(
          await this.chat.sendBookingMessage(user, {
            bookingId: booking_id,
            message,
            messageType: message_type,
          }),
        );
      }
      if (support_ticket_id) {
        return ok(
          await this.chat.sendSupportMessage(user, {
            supportTicketId: support_ticket_id,
            message,
          }),
        );
      }
      return gatewayError('VALIDATION_FAILED', 'PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chat:typing')
  async chatTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { booking_id?: string; support_ticket_id?: string; is_typing?: boolean },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const { booking_id, support_ticket_id, is_typing } = payload ?? {};
      let room: string;
      if (booking_id) {
        await this.chat.assertBookingChatOpen(user, booking_id);
        room = `booking:${booking_id}`;
      } else if (support_ticket_id) {
        const member = await this.chat.isTicketMember(user, support_ticket_id);
        if (!member) {
          return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        }
        room = `support:${support_ticket_id}`;
      } else {
        return gatewayError('VALIDATION_FAILED', 'PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
      }

      const now = Date.now();
      if (!client.data.typingLast) client.data.typingLast = new Map<string, number>();
      const last = client.data.typingLast.get(user.id) ?? 0;
      client.data.typingLast.set(user.id, now);
      if (now - last < TYPING_THROTTLE_MS) {
        return ok({ throttled: true });
      }
      client.to(room).emit('chat:typing', {
        sender_id: user.id,
        is_typing: Boolean(is_typing),
        timestamp: now,
      });
      return ok({ throttled: false });
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('chat:read')
  async chatRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { message_id?: string; booking_id?: string; support_ticket_id?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const { allowed } = await this.rateLimiter.checkRateLimit('chat', 'read', user.id);
      if (!allowed) return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      return ok(
        await this.chat.markRead(user, {
          messageId: payload?.message_id,
          bookingId: payload?.booking_id,
          supportTicketId: payload?.support_ticket_id,
        }),
      );
    } catch (err) {
      return errorFrom(err);
    }
  }

  // Port of Main Server/sockets/sosSocket.ts. Repeat triggers reuse the
  // active event without consuming rate limit.
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sos:trigger')
  async sosTrigger(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { trip_id?: string; lat?: number; lng?: number; urgency?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      void client;
      const active = await this.sos.findActiveForUser(user.id);
      if (active) {
        return ok({ sos_event_id: active.id, reused: true });
      }
      const { allowed } = await this.rateLimiter.checkRateLimit('sos', 'sos', user.id);
      if (!allowed) return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      return ok(
        await this.sos.trigger(user, {
          tripId: payload?.trip_id,
          lat: payload?.lat,
          lng: payload?.lng,
          urgency: payload?.urgency,
        }),
      );
    } catch (err) {
      return errorFrom(err);
    }
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: unknown): void {
    this.server?.to(`role:${role}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.server?.to(room).emit(event, data);
  }

  async disconnectUserSockets(_userId: string): Promise<void> {
    await this.disconnectUserSocketsByRoom(`user:${_userId}`);
  }

  private async disconnectUserSocketsByRoom(room: string): Promise<void> {
    try {
      await this.server?.in(room).disconnectSockets();
    } catch {
      // best-effort
    }
  }
}
