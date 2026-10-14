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
import { forwardRef, Inject, Logger, NotFoundException, UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard.js';
import { ChatService as ChatServiceToken } from '../modules/chat/chat.service.js';
import { SosService as SosServiceToken } from '../modules/sos/sos.service.js';
import { NotificationsService as NotificationsServiceToken } from '../modules/notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';
import { PresenceService as PresenceServiceToken } from './presence.service.js';
import { SocketRateLimiter } from './socket-rate-limiter.service.js';
import { TrackingService as TrackingServiceToken } from './tracking.service.js';
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
function authError(code, reason = 'Authentication failed.') {
    const err = new Error(code);
    err.code = code;
    err.reason = reason;
    return err;
}
const STAFF_ROLES = ['admin', 'support', 'moderator'];
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
    metrics;
    notifications;
    logger = new Logger(RealtimeGateway_1.name);
    server;
    constructor(tracking, presence, rateLimiter, chat, sos, jwt, config, redis, prisma, metrics, notifications) {
        this.tracking = tracking;
        this.presence = presence;
        this.rateLimiter = rateLimiter;
        this.chat = chat;
        this.sos = sos;
        this.jwt = jwt;
        this.config = config;
        this.redis = redis;
        this.prisma = prisma;
        this.metrics = metrics;
        this.notifications = notifications;
    }
    afterInit(server) {
        server.on('connection_error', () => {
            this.metrics.recordConnectionFailure();
        });
        server.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token ??
                    socket.handshake.query?.token;
                if (!token)
                    return next(authError('AUTH_REQUIRED', 'Authentication token is required.'));
                const decoded = (await this.jwt.verifyAsync(token, {
                    secret: this.config.get('jwt.secret'),
                }));
                if (decoded.type !== 'access' || !decoded.id)
                    return next(authError('INVALID_TOKEN', 'Invalid access token.'));
                if (await this.redis.getKey(`blacklist:${token}`))
                    return next(authError('TOKEN_REVOKED', 'Access token has been revoked.'));
                const user = await this.prisma.user.findUnique({
                    where: { id: decoded.id },
                    select: { id: true, role: true, status: true },
                });
                if (!user)
                    return next(authError('USER_NOT_FOUND', 'User no longer exists.'));
                if (user.status === 'banned' || user.status === 'suspended') {
                    return next(authError('ACCOUNT_SUSPENDED', 'Account is banned or suspended.'));
                }
                socket.data.user = { id: user.id, role: user.role };
                next();
            }
            catch (err) {
                if (err?.name === 'TokenExpiredError') {
                    return next(authError('TOKEN_EXPIRED', 'Access token has expired.'));
                }
                next(err instanceof Error ? err : authError('AUTH_FAILED', 'Authentication failed.'));
            }
        });
    }
    pushCount(userId) {
        void this.notifications
            .countUnread(userId)
            .then((unread_count) => {
            this.emitToUser(userId, 'notification:count', { unread_count, timestamp: Date.now() });
        })
            .catch(() => undefined);
    }
    handleConnection(client) {
        const user = client.data.user;
        if (user) {
            this.metrics.recordConnection(user.id);
            this.metrics.recordEvent('connection');
            const recovered = client.recovered ??
                Boolean(client.handshake.auth?.reconnecting);
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
    handleDisconnect(client) {
        const user = client.data.user;
        if (user) {
            this.metrics.recordDisconnection(user.id);
            this.metrics.recordEvent('disconnection');
            this.presence.scheduleOffline(user.id, user.role);
        }
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
            if (!allowed) {
                this.metrics.recordRateLimited();
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            }
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
            if (!allowed) {
                this.metrics.recordRateLimited();
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            }
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
            this.metrics.recordEvent('chat:typing');
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
            if (!allowed) {
                this.metrics.recordRateLimited();
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            }
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
            if (!allowed) {
                this.metrics.recordRateLimited();
                return gatewayError('RATE_LIMITED', 'Rate limit exceeded');
            }
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
    async notificationRead(client, payload) {
        try {
            const user = client.data.user;
            const result = await this.notifications.markRead(user.id, payload?.notification_id ?? '');
            this.pushCount(user.id);
            this.metrics.recordEvent('notification:read');
            return ok({ notification_id: result.id });
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async notificationReadAll(client) {
        try {
            const user = client.data.user;
            const result = await this.notifications.markAllRead(user.id);
            this.pushCount(user.id);
            this.metrics.recordEvent('notification:read_all');
            return ok(result);
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    enforcementAck(client) {
        void client;
        this.metrics.recordEvent('enforcement:ack');
        return ok({ received: true });
    }
    requireStaff(user) {
        if (!STAFF_ROLES.includes(user.role)) {
            return gatewayError('FORBIDDEN', 'YOU_ARE_NOT_AUTHORIZED_TO_PERFORM_THIS_ACTION');
        }
        return null;
    }
    async adminTicketAssign(client, payload) {
        try {
            const user = client.data.user;
            const staffError = this.requireStaff(user);
            if (staffError)
                return staffError;
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
        }
        catch (err) {
            return errorFrom(err);
        }
    }
    async adminTicketResolve(client, payload) {
        try {
            const user = client.data.user;
            const staffError = this.requireStaff(user);
            if (staffError)
                return staffError;
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
    async disconnectUserSockets(userId) {
        try {
            this.server?.to(`user:${userId}`).emit('force_disconnect', { reason: 'SESSION_TERMINATED' });
        }
        catch {
        }
        await this.disconnectUserSocketsByRoom(`user:${userId}`);
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
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('notification:read'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "notificationRead", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('notification:read_all'),
    __param(0, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "notificationReadAll", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('enforcement:ack'),
    __param(0, ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RealtimeGateway.prototype, "enforcementAck", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('admin:ticket_assign'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "adminTicketAssign", null);
__decorate([
    UseGuards(WsJwtGuard),
    SubscribeMessage('admin:ticket_resolve'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RealtimeGateway.prototype, "adminTicketResolve", null);
RealtimeGateway = RealtimeGateway_1 = __decorate([
    WebSocketGateway({
        cors: true,
        connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000, skipMiddlewares: false },
    }),
    __param(0, Inject(forwardRef(() => TrackingServiceToken))),
    __param(1, Inject(forwardRef(() => PresenceServiceToken))),
    __param(2, Inject(forwardRef(() => SocketRateLimiter))),
    __param(3, Inject(forwardRef(() => ChatServiceToken))),
    __param(4, Inject(forwardRef(() => SosServiceToken))),
    __param(10, Inject(forwardRef(() => NotificationsServiceToken))),
    __metadata("design:paramtypes", [Function, Function, SocketRateLimiter, Function, Function, JwtService,
        ConfigService,
        RedisService,
        PrismaService,
        RealtimeMetricsService, Function])
], RealtimeGateway);
export { RealtimeGateway };
//# sourceMappingURL=realtime.gateway.js.map