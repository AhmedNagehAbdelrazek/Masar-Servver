"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messageService_1 = __importDefault(require("../Services/messageService"));
const realtimeService_1 = __importDefault(require("../Services/realtimeService"));
const realtimeMetrics_1 = __importDefault(require("../Services/realtimeMetrics"));
const presenceService_1 = __importDefault(require("../Services/presenceService"));
const socketRateLimiter_1 = require("../Services/socketRateLimiter");
const ApiError_1 = require("../utils/ApiError");
const socketAck_1 = require("../utils/socketAck");
const TYPING_THROTTLE_MS = 1500;
const chatSocket = (io, socket) => {
    const user = socket.data.user;
    const typingLast = new Map();
    socket.on('chat:join', async (payload, ack) => {
        try {
            const { booking_id, support_ticket_id } = payload || {};
            if (booking_id) {
                await messageService_1.default.assertBookingChatOpen(user, booking_id);
                socket.join(`booking:${booking_id}`);
                presenceService_1.default.getStatus(user.id)
                    .then((status) => {
                    socket.to(`booking:${booking_id}`).emit('presence:status', {
                        user_id: user.id,
                        status,
                        last_seen: new Date().toISOString(),
                        timestamp: Date.now(),
                    });
                })
                    .catch(() => { return undefined; });
                if (ack)
                    ack((0, socketAck_1.ok)({ room: `booking:${booking_id}` }));
                return;
            }
            if (support_ticket_id) {
                const member = await realtimeService_1.default.isTicketMember(user, support_ticket_id);
                if (!member)
                    throw ApiError_1.ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
                socket.join(`support:${support_ticket_id}`);
                if (ack)
                    ack((0, socketAck_1.ok)({ room: `support:${support_ticket_id}` }));
                return;
            }
            throw ApiError_1.ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('chat:leave', (payload, ack) => {
        const { booking_id, support_ticket_id } = payload || {};
        if (booking_id)
            socket.leave(`booking:${booking_id}`);
        if (support_ticket_id)
            socket.leave(`support:${support_ticket_id}`);
        if (ack)
            ack((0, socketAck_1.ok)({ left: true }));
    });
    socket.on('chat:send', async (payload, ack) => {
        try {
            const rl = await (0, socketRateLimiter_1.checkRateLimit)('chat', 'chat', user.id);
            if (!rl.allowed) {
                realtimeMetrics_1.default.recordRateLimited();
                if (ack)
                    ack((0, socketAck_1.rateLimited)());
                return;
            }
            const { booking_id, support_ticket_id, message, message_type } = payload || {};
            let result;
            if (booking_id) {
                result = await messageService_1.default.sendBookingMessage(user, {
                    bookingId: booking_id,
                    message,
                    messageType: message_type,
                });
            }
            else if (support_ticket_id) {
                result = await messageService_1.default.sendSupportMessage(user, {
                    supportTicketId: support_ticket_id,
                    message,
                });
            }
            else {
                throw ApiError_1.ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
            }
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
    socket.on('chat:typing', async (payload, ack) => {
        const { booking_id, support_ticket_id, is_typing } = payload || {};
        let room = null;
        try {
            if (booking_id) {
                await messageService_1.default.assertBookingChatOpen(user, booking_id);
                room = `booking:${booking_id}`;
            }
            else if (support_ticket_id) {
                const member = await realtimeService_1.default.isTicketMember(user, support_ticket_id);
                if (!member)
                    throw ApiError_1.ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
                room = `support:${support_ticket_id}`;
            }
            else {
                throw ApiError_1.ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
            }
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
            return;
        }
        const now = Date.now();
        const last = typingLast.get(user.id) || 0;
        typingLast.set(user.id, now);
        if (now - last < TYPING_THROTTLE_MS) {
            if (ack)
                ack((0, socketAck_1.ok)({ throttled: true }));
            return;
        }
        socket.to(room).emit('chat:typing', {
            sender_id: user.id,
            is_typing: Boolean(is_typing),
            timestamp: now,
        });
        realtimeMetrics_1.default.recordEvent('chat:typing');
        if (ack)
            ack((0, socketAck_1.ok)({ throttled: false }));
    });
    socket.on('chat:read', async (payload, ack) => {
        try {
            const rl = await (0, socketRateLimiter_1.checkRateLimit)('chat', 'read', user.id);
            if (!rl.allowed) {
                realtimeMetrics_1.default.recordRateLimited();
                if (ack)
                    ack((0, socketAck_1.rateLimited)());
                return;
            }
            const result = await messageService_1.default.markRead(user, {
                messageId: payload ? payload.message_id : undefined,
                bookingId: payload ? payload.booking_id : undefined,
                supportTicketId: payload ? payload.support_ticket_id : undefined,
            });
            if (ack)
                ack((0, socketAck_1.ok)(result));
        }
        catch (err) {
            if (ack)
                ack((0, socketAck_1.errorFromApiError)(err));
        }
    });
};
exports.default = chatSocket;
module.exports = chatSocket;
//# sourceMappingURL=chatSocket.js.map