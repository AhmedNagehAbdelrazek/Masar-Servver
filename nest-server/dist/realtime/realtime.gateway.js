var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RealtimeGateway_1;
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { forwardRef, Inject, Logger, UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard.js';
import { ChatService } from '../modules/chat/chat.service.js';
import { SosService } from '../modules/sos/sos.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { PresenceService } from './presence.service.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import { TrackingService } from './tracking.service.js';
const TYPING_THROTTLE_MS = 1500;
function ok(data) {
    return { status: 'ok', data };
}
function gatewayError(code, message) {
    return { status: 'error', code, message };
}
function errorFrom(err) {
    const e = err;
    const body = typeof e?.getResponse === 'function' ? e.getResponse() : null;
    return {
        status: 'error',
        code: body?.code ?? e?.code ?? 'INTERNAL_ERROR',
        message: body?.message ?? e?.message ?? 'Internal error',
    };
}
let RealtimeGateway = RealtimeGateway_1 = class RealtimeGateway {
    tracking;
    presence;
    rateLimiter;
    chat;
    sos;
    jwt;
    config;
    redis;
    prisma;
    logger = new Logger(RealtimeGateway_1.name);
    server;
    constructor(tracking, presence, rateLimiter, chat, sos, jwt, config, redis, prisma) {
        this.tracking = tracking;
        this.presence = presence;
        this.rateLimiter = rateLimiter;
        this.chat = chat;
        this.sos = sos;
        this.jwt = jwt;
        this.config = config;
        this.redis = redis;
        this.prisma = prisma;
    }
    afterInit(server) {
        server.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token ??
                    socket.handshake.query?.token;
                if (!token)
                    return next(new Error('AUTH_REQUIRED'));
                const decoded = (await this.jwt.verifyAsync(token, {
                    secret: this.config.get('jwt.secret'),
                }));
                if (decoded.type !== 'access' || !decoded.id)
                    return next(new Error('INVALID_TOKEN'));
                if (await this.redis.getKey(`blacklist:${token}`))
                    return next(new Error('TOKEN_REVOKED'));
                const user = await this.prisma.user.findUnique({
                    where: { id: decoded.id },
                    select: { id: true, role: true, status: true },
                });
                if (!user)
                    return next(new Error('USER_NOT_FOUND'));
                if (user.status === 'banned' || user.status === 'suspended') {
                    return next(new Error('ACCOUNT_SUSPENDED'));
                }
                socket.data.user = { id: user.id, role: user.role };
                next();
            }
            catch (err) {
                next(err instanceof Error ? err : new Error('AUTH_FAILED'));
            }
        });
    }
    handleConnection(client) {
        const user = client.data.user;
        if (user) {
            void client.join(`user:${user.id}`);
            void client.join(`role:${user.role}`);
            void this.presence.markOnline(user.id, user.role).catch(() => undefined);
        }
        this.logger.debug(`socket connected ${client.id}`);
    }
    handleDisconnect(client) {
        const user = client.data.user;
        if (user)
            this.presence.scheduleOffline(user.id, user.role);
        this.logger.debug(`socket disconnected ${client.id}`);
    }
    async trackingJoin(client, payload) {
        try {
            const user = client.data.user;
            const member = await this.tracking.isTripMember(user, payload.trip_id);
            if (!member) {
                return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP');
            }
            if (!(await this.tracking.isTripActive(payload.trip_id))) {
                return gatewayError('TRACKING_CONFLICT', 'TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS');
            }
            await client.join(`trip:${payload.trip_id}`);
            return ok({ room: `trip:${payload.trip_id}` });
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async trackingStart(client, payload) {
        try {
            const user = client.data.user;
            return ok(await this.tracking.startTracking(user, payload.trip_id));
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async trackingLocation(client, payload) {
        try {
            const user = client.data.user;
            const { allowed } = await this.rateLimiter.checkRateLimit('tracking', 'location', user.id);
            if (!allowed)
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            return ok(await this.tracking.updateLocation(user, payload));
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async trackingStop(client, payload) {
        try {
            const user = client.data.user;
            return ok(await this.tracking.stopTracking(user, payload.trip_id));
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async presenceHeartbeat(client) {
        try {
            const user = client.data.user;
            await this.presence.markOnline(user.id, user.role);
            return ok({ status: 'online' });
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async chatJoin(client, payload) {
        try {
            const user = client.data.user;
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
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    chatLeave(client, payload) {
        const { booking_id, support_ticket_id } = payload ?? {};
        if (booking_id)
            void client.leave(`booking:${booking_id}`);
        if (support_ticket_id)
            void client.leave(`support:${support_ticket_id}`);
        return ok({ left: true });
    }
    async chatSend(client, payload) {
        try {
            const user = client.data.user;
            const { allowed } = await this.rateLimiter.checkRateLimit('chat', 'chat', user.id);
            if (!allowed)
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            const { booking_id, support_ticket_id, message, message_type } = payload ?? {};
            if (booking_id) {
                return ok(await this.chat.sendBookingMessage(user, {
                    bookingId: booking_id,
                    message,
                    messageType: message_type,
                }));
            }
            if (support_ticket_id) {
                return ok(await this.chat.sendSupportMessage(user, {
                    supportTicketId: support_ticket_id,
                    message,
                }));
            }
            return gatewayError('VALIDATION_FAILED', 'PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async chatTyping(client, payload) {
        try {
            const user = client.data.user;
            const { booking_id, support_ticket_id, is_typing } = payload ?? {};
            let room;
            if (booking_id) {
                await this.chat.assertBookingChatOpen(user, booking_id);
                room = `booking:${booking_id}`;
            }
            else if (support_ticket_id) {
                const member = await this.chat.isTicketMember(user, support_ticket_id);
                if (!member) {
                    return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
                }
                room = `support:${support_ticket_id}`;
            }
            else {
                return gatewayError('VALIDATION_FAILED', 'PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
            }
            const now = Date.now();
            if (!client.data.typingLast)
                client.data.typingLast = new Map();
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
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async chatRead(client, payload) {
        try {
            const user = client.data.user;
            const { allowed } = await this.rateLimiter.checkRateLimit('chat', 'read', user.id);
            if (!allowed)
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            return ok(await this.chat.markRead(user, {
                messageId: payload?.message_id,
                bookingId: payload?.booking_id,
                supportTicketId: payload?.support_ticket_id,
            }));
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async sosTrigger(client, payload) {
        try {
            const user = client.data.user;
            void client;
            const active = await this.sos.findActiveForUser(user.id);
            if (active) {
                return ok({ sos_event_id: active.id, reused: true });
            }
            const { allowed } = await this.rateLimiter.checkRateLimit('sos', 'sos', user.id);
            if (!allowed)
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            return ok(await this.sos.trigger(user, {
                tripId: payload?.trip_id,
                lat: payload?.lat,
                lng: payload?.lng,
                urgency: payload?.urgency,
            }));
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    emitToUser(userId, event, data) {
        this.server?.to(`user:${userId}`).emit(event, data);
    }
    emitToRole(role, event, data) {
        this.server?.to(`role:${role}`).emit(event, data);
    }
    emitToRoom(room, event, data) {
        this.server?.to(room).emit(event, data);
    }
    async disconnectUserSockets(_userId) {
        await this.disconnectUserSocketsByRoom(`user:${_userId}`);
    }
    async disconnectUserSocketsByRoom(room) {
        try {
            await this.server?.in(room).disconnectSockets();
        }
        catch {
        }
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('tracking:join'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "trackingJoin", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('tracking:start'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "trackingStart", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('tracking:location'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "trackingLocation", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('tracking:stop'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "trackingStop", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('presence:heartbeat'),
    __param(0, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "presenceHeartbeat", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('chat:join'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "chatJoin", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('chat:leave'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], RealtimeGateway.prototype, "chatLeave", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('chat:send'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "chatSend", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('chat:typing'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "chatTyping", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('chat:read'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "chatRead", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('sos:trigger'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "sosTrigger", null);
RealtimeGateway = RealtimeGateway_1 = __decorate([
    WebSocketGateway({ cors: true, connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 } }),
    __param(0, Inject(forwardRef(() => TrackingService))),
    __param(1, Inject(forwardRef(() => PresenceService))),
    __param(2, Inject(forwardRef(() => SocketRateLimiter))),
    __param(3, Inject(forwardRef(() => ChatService))),
    __param(4, Inject(forwardRef(() => SosService))),
    __metadata("design:paramtypes", [TrackingService,
        PresenceService,
        SocketRateLimiter,
        ChatService,
        SosService,
        JwtService,
        ConfigService,
        RedisService,
        PrismaService])
], RealtimeGateway);
export { RealtimeGateway };
//# sourceMappingURL=realtime.gateway.js.map