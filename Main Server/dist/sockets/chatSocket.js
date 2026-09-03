"use strict";
const messageService = require('../Services/messageService');
const realtimeService = require('../Services/realtimeService');
const realtimeMetrics = require('../Services/realtimeMetrics');
const presenceService = require('../Services/presenceService');
const { checkRateLimit } = require('../Services/socketRateLimiter');
const { ApiErrors } = require('../utils/ApiError');
const { ok, errorFromApiError, rateLimited } = require('../utils/socketAck');
const TYPING_THROTTLE_MS = 1500;
/**
 * Booking chat (driver <-> passenger) + support ticket chat
 * (user <-> support team). Rooms: `booking:{bookingId}` and
 * `support:{supportTicketId}`. Booking chats are only joinable while the
 * booking is CONFIRMED and its trip is not completed/cancelled; membership
 * is validated on join and on every send (defense-in-depth).
 */
module.exports = (io, socket) => {
    const user = socket.data.user;
    const typingLast = new Map();
    socket.on('chat:join', async (payload, ack) => {
        try {
            const { booking_id, support_ticket_id } = payload || {};
            if (booking_id) {
                await messageService.assertBookingChatOpen(user, booking_id);
                socket.join(`booking:${booking_id}`);
                presenceService
                    .getStatus(user.id)
                    .then((status) => {
                    socket.to(`booking:${booking_id}`).emit('presence:status', {
                        user_id: user.id,
                        status,
                        last_seen: new Date().toISOString(),
                        timestamp: Date.now(),
                    });
                })
                    .catch(() => { });
                return ack ? ack(ok({ room: `booking:${booking_id}` })) : undefined;
            }
            if (support_ticket_id) {
                const member = await realtimeService.isTicketMember(user, support_ticket_id);
                if (!member)
                    throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
                socket.join(`support:${support_ticket_id}`);
                return ack ? ack(ok({ room: `support:${support_ticket_id}` })) : undefined;
            }
            throw ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
        }
        catch (err) {
            if (ack)
                ack(errorFromApiError(err));
        }
    });
    socket.on('chat:leave', (payload, ack) => {
        const { booking_id, support_ticket_id } = payload || {};
        if (booking_id)
            socket.leave(`booking:${booking_id}`);
        if (support_ticket_id)
            socket.leave(`support:${support_ticket_id}`);
        if (ack)
            ack(ok({ left: true }));
    });
    socket.on('chat:send', async (payload, ack) => {
        try {
            const rl = await checkRateLimit('chat', 'chat', user.id);
            if (!rl.allowed) {
                realtimeMetrics.recordRateLimited();
                return ack ? ack(rateLimited()) : undefined;
            }
            const { booking_id, support_ticket_id, message, message_type } = payload || {};
            const result = booking_id
                ? await messageService.sendBookingMessage(user, {
                    bookingId: booking_id,
                    message,
                    messageType: message_type,
                })
                : support_ticket_id
                    ? await messageService.sendSupportMessage(user, {
                        supportTicketId: support_ticket_id,
                        message,
                    })
                    : (() => {
                        throw ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
                    })();
            return ack ? ack(ok(result)) : undefined;
        }
        catch (err) {
            if (ack)
                ack(errorFromApiError(err));
        }
    });
    socket.on('chat:typing', async (payload, ack) => {
        const { booking_id, support_ticket_id, is_typing } = payload || {};
        let room = null;
        try {
            if (booking_id) {
                await messageService.assertBookingChatOpen(user, booking_id);
                room = `booking:${booking_id}`;
            }
            else if (support_ticket_id) {
                const member = await realtimeService.isTicketMember(user, support_ticket_id);
                if (!member)
                    throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
                room = `support:${support_ticket_id}`;
            }
            else {
                throw ApiErrors.validation('PROVIDE_BOOKING_ID_OR_SUPPORT_TICKET_ID');
            }
        }
        catch (err) {
            if (ack)
                ack(errorFromApiError(err));
            return;
        }
        const now = Date.now();
        const last = typingLast.get(user.id) || 0;
        typingLast.set(user.id, now);
        if (now - last < TYPING_THROTTLE_MS) {
            if (ack)
                ack(ok({ throttled: true }));
            return;
        }
        socket.to(room).emit('chat:typing', {
            sender_id: user.id,
            is_typing: !!is_typing,
            timestamp: now,
        });
        realtimeMetrics.recordEvent('chat:typing');
        if (ack)
            ack(ok({ throttled: false }));
    });
    socket.on('chat:read', async (payload, ack) => {
        try {
            const rl = await checkRateLimit('chat', 'read', user.id);
            if (!rl.allowed) {
                realtimeMetrics.recordRateLimited();
                return ack ? ack(rateLimited()) : undefined;
            }
            const result = await messageService.markRead(user, {
                messageId: payload ? payload.message_id : undefined,
                bookingId: payload ? payload.booking_id : undefined,
                supportTicketId: payload ? payload.support_ticket_id : undefined,
            });
            return ack ? ack(ok(result)) : undefined;
        }
        catch (err) {
            if (ack)
                ack(errorFromApiError(err));
        }
    });
};
//# sourceMappingURL=chatSocket.js.map