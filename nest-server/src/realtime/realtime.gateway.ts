import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { forwardRef, Inject, Logger, NotFoundException, UseGuards } from '@nestjs/common';
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
import type { ChatService } from '../modules/chat/chat.service.js';
import { ChatService as ChatServiceToken } from '../modules/chat/chat.service.js';
import type { SosService } from '../modules/sos/sos.service.js';
import { SosService as SosServiceToken } from '../modules/sos/sos.service.js';
import type { NotificationsService } from '../modules/notifications/notifications.service.js';
import { NotificationsService as NotificationsServiceToken } from '../modules/notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';
import type { PresenceService } from './presence.service.js';
import { PresenceService as PresenceServiceToken } from './presence.service.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import type { TrackingService } from './tracking.service.js';
import { TrackingService as TrackingServiceToken } from './tracking.service.js';

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

// Mirrors Express utils/socketAck authError: the wire contract exposes the
// stable machine `code` through `connect_error.message`, while
// `code`/`reason` stay available server-side.
function authError(code: string, reason = 'Authentication failed.'): Error & { code: string; reason: string } {
  const err = new Error(code) as Error & { code: string; reason: string };
  err.code = code;
  err.reason = reason;
  return err;
}

const STAFF_ROLES = ['admin', 'support', 'moderator'];

// Nest-native port of Main Server/socketServer.ts + sockets/*.
// Rooms: user:{id}, role:{role}, trip:{id}, booking:{id}, support:{id}.
// Redis adapter wiring happens in main.ts bootstrap (skipped in test env).
@WebSocketGateway({
  cors: true,
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000, skipMiddlewares: false },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(forwardRef(() => TrackingServiceToken))
    private readonly tracking: TrackingService,
    @Inject(forwardRef(() => PresenceServiceToken))
    private readonly presence: PresenceService,
    @Inject(forwardRef(() => SocketRateLimiter))
    private readonly rateLimiter: SocketRateLimiter,
    @Inject(forwardRef(() => ChatServiceToken))
    private readonly chat: ChatService,
    @Inject(forwardRef(() => SosServiceToken))
    private readonly sos: SosService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly metrics: RealtimeMetricsService,
    @Inject(forwardRef(() => NotificationsServiceToken))
    private readonly notifications: NotificationsService,
  ) {}

  // Mirrors Express socketAuth middleware: authenticate the handshake token
  // at connect so user/role rooms + presence work connection-wide.
  afterInit(server: Server): void {
    server.on('connection_error', () => {
      this.metrics.recordConnectionFailure();
    });
    server.use(async (socket, next) => {
      try {
        const token =
          (socket.handshake.auth?.token as string | undefined) ??
          (socket.handshake.query?.token as string | undefined);
        if (!token) return next(authError('AUTH_REQUIRED', 'Authentication token is required.'));
        const decoded = (await this.jwt.verifyAsync(token, {
          secret: this.config.get<string>('jwt.secret'),
        })) as { id?: string; role?: string; type?: string };
        if (decoded.type !== 'access' || !decoded.id) return next(authError('INVALID_TOKEN', 'Invalid access token.'));
        if (await this.redis.getKey(`blacklist:${token}`)) return next(authError('TOKEN_REVOKED', 'Access token has been revoked.'));
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true, status: true },
        });
        if (!user) return next(authError('USER_NOT_FOUND', 'User no longer exists.'));
        if (user.status === 'banned' || user.status === 'suspended') {
          return next(authError('ACCOUNT_SUSPENDED', 'Account is banned or suspended.'));
        }
        (socket as AuthedSocket).data.user = { id: user.id, role: user.role };
        next();
      } catch (err) {
        if ((err as Error)?.name === 'TokenExpiredError') {
          return next(authError('TOKEN_EXPIRED', 'Access token has expired.'));
        }
        next(err instanceof Error ? err : authError('AUTH_FAILED', 'Authentication failed.'));
      }
    });
  }

  // Mirrors Express notificationSocket pushCount(): the unread badge is
  // pushed on every successful connection, after read, and after read_all.
  private pushCount(userId: string): void {
    void this.notifications
      .countUnread(userId)
      .then((unread_count) => {
        this.emitToUser(userId, 'notification:count', { unread_count, timestamp: Date.now() });
      })
      .catch(() => undefined);
  }

  handleConnection(client: AuthedSocket): void {
    const user = client.data.user;
    if (user) {
      this.metrics.recordConnection(user.id);
      this.metrics.recordEvent('connection');
      const recovered =
        (client as AuthedSocket & { recovered?: boolean }).recovered ??
        Boolean((client.handshake.auth as Record<string, unknown> | undefined)?.reconnecting);
      if (recovered) {
        this.metrics.recordReconnect();
        this.metrics.recordEvent('reconnect');
      }
      void client.join(`user:${user.id}`);
      void client.join(`role:${user.role}`);
      void this.presence.markOnline(user.id, user.role).catch(() => undefined);
      this.pushCount(user.id);
    }
    this.logger.debug(`socket connected ${client.id}`);
  }

  handleDisconnect(client: AuthedSocket): void {
    const user = client.data.user;
    if (user) {
      this.metrics.recordDisconnection(user.id);
      this.metrics.recordEvent('disconnection');
      this.presence.scheduleOffline(user.id, user.role);
    }
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
      if (!allowed) {
        this.metrics.recordRateLimited();
        return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      }
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
      if (!allowed) {
        this.metrics.recordRateLimited();
        return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      }
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
      this.metrics.recordEvent('chat:typing');
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
      if (!allowed) {
        this.metrics.recordRateLimited();
        return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      }
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
      if (!allowed) {
        this.metrics.recordRateLimited();
        return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      }
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

  // Port of Main Server/sockets/notificationSocket.ts: mark one/all read,
  // then push the refreshed `notification:count` badge (pushCount covers the
  // connect-time badge; the service emitCount covers REST reads).
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('notification:read')
  async notificationRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { notification_id?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const result = await this.notifications.markRead(user.id, payload?.notification_id ?? '');
      this.pushCount(user.id);
      this.metrics.recordEvent('notification:read');
      return ok({ notification_id: result.id });
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('notification:read_all')
  async notificationReadAll(@ConnectedSocket() client: AuthedSocket): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const result = await this.notifications.markAllRead(user.id);
      this.pushCount(user.id);
      this.metrics.recordEvent('notification:read_all');
      return ok(result);
    } catch (err) {
      return errorFrom(err);
    }
  }

  // Port of Main Server/sockets/enforcementSocket.ts: minimal acknowledgement.
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('enforcement:ack')
  enforcementAck(@ConnectedSocket() client: AuthedSocket): unknown {
    void client;
    this.metrics.recordEvent('enforcement:ack');
    return ok({ received: true });
  }

  private requireStaff(user: { id: string; role: string }): { status: string; code: string; message: string } | null {
    if (!STAFF_ROLES.includes(user.role)) {
      return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_AUTHORIZED_TO_PERFORM_THIS_ACTION');
    }
    return null;
  }

  // Port of Main Server/sockets/adminSocket.ts. Staff-only (admin/support/
  // moderator); everyone else gets FORBIDDEN without touching the ticket.
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('admin:ticket_assign')
  async adminTicketAssign(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { support_ticket_id?: string; agent_id?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const staffError = this.requireStaff(user);
      if (staffError) return staffError;
      const { allowed } = await this.rateLimiter.checkRateLimit('admin', 'admin', user.id);
      if (!allowed) {
        this.metrics.recordRateLimited();
        return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      }
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: payload?.support_ticket_id ?? '' },
      });
      if (!ticket) {
        throw new NotFoundException({ message: 'SUPPORT_TICKET_NOT_FOUND', code: 'SUPPORT_TICKET_NOT_FOUND' });
      }
      if (!payload?.agent_id) {
        return gatewayError('VALIDATION_FAILED', 'AGENT_ID_IS_REQUIRED');
      }
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { assignedTo: payload.agent_id },
      });
      await client.join(`support:${ticket.id}`);
      this.metrics.recordEvent('admin:ticket_assign');
      return ok({ support_ticket_id: ticket.id, assigned_to: payload.agent_id });
    } catch (err) {
      return errorFrom(err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('admin:ticket_resolve')
  async adminTicketResolve(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { support_ticket_id?: string; solution?: string },
  ): Promise<unknown> {
    try {
      const user = client.data.user as { id: string; role: string };
      const staffError = this.requireStaff(user);
      if (staffError) return staffError;
      const { allowed } = await this.rateLimiter.checkRateLimit('admin', 'admin', user.id);
      if (!allowed) {
        this.metrics.recordRateLimited();
        return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
      }
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: payload?.support_ticket_id ?? '' },
      });
      if (!ticket) {
        throw new NotFoundException({ message: 'SUPPORT_TICKET_NOT_FOUND', code: 'SUPPORT_TICKET_NOT_FOUND' });
      }
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: 'resolved',
          resolutionNotes: payload?.solution || ticket.resolutionNotes,
        },
      });
      const owner = await this.prisma.user.findUnique({
        where: { id: ticket.userId },
        select: { id: true, locale: true },
      });
      if (owner) {
        await this.notifications.sendToUser({ id: owner.id, locale: owner.locale }, 'TICKET_RESOLVED', {
          channels: ['in_app'],
          vars: { ticket: ticket.subject || 'support ticket' },
        });
      }
      void client;
      this.metrics.recordEvent('admin:ticket_resolve');
      return ok({ support_ticket_id: ticket.id, status: 'resolved' });
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

  async disconnectUserSockets(userId: string): Promise<void> {
    // Mirror Express disconnectUserSockets ordering: the client must receive
    // `force_disconnect` BEFORE the socket is torn down.
    try {
      this.server?.to(`user:${userId}`).emit('force_disconnect', { reason: 'SESSION_TERMINATED' });
    } catch {
      // best-effort
    }
    await this.disconnectUserSocketsByRoom(`user:${userId}`);
  }

  private async disconnectUserSocketsByRoom(room: string): Promise<void> {
    try {
      await this.server?.in(room).disconnectSockets();
    } catch {
      // best-effort
    }
  }
}
