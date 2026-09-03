"use strict";
const { Op } = require('sequelize');
const { Message, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { sanitizeMessage } = require('../utils/sanitize');
const { BOOKING_STATUS, TRIP_STATUS } = require('../config/constants');
const realtimeService = require('./realtimeService');
const realtimeMetrics = require('./realtimeMetrics');
/**
 * Booking chat (driver <-> passenger) + support ticket chat persistence and
 * realtime broadcast. Messages are persisted BEFORE broadcast so nothing is
 * lost for offline clients (persistence-before-broadcast, R5).
 *
 * Chat concepts:
 * - Booking chat: room `booking:{bookingId}`. Exists only while the passenger
 *   has a booking on the trip. Live participation requires a CONFIRMED
 *   booking AND a trip that is not completed/cancelled; history stays
 *   readable afterwards (read-only).
 * - Support chat: room `support:{supportTicketId}` between a user and the
 *   support team over the lifetime of the app (passengers and drivers alike).
 */
function serialize(row) {
    return {
        id: row.id,
        sender_id: row.senderId,
        sender_name: row.sender ? row.sender.fullName : null,
        message: row.message,
        message_type: row.messageType,
        booking_id: row.bookingId || null,
        support_ticket_id: row.supportTicketId || null,
        is_read: row.isRead,
        read_at: row.readAt ? row.readAt.toISOString() : null,
        created_at: row.createdat ? row.createdat.toISOString() : null,
    };
}
async function findMessageWithSender(id) {
    return Message.findByPk(id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'fullName'] }],
    });
}
/**
 * Loads the booking chat parties and enforces that the chat is open:
 * the booking must be CONFIRMED and its trip must not be completed or
 * cancelled. Returns { booking, trip }; throws ApiErrors otherwise.
 */
async function assertBookingChatOpen(user, bookingId) {
    const { member, booking, trip } = await realtimeService.getBookingChatContext(user, bookingId);
    if (!booking)
        throw ApiErrors.notFound('BOOKING_NOT_FOUND');
    if (!member)
        throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_BOOKING_CHAT');
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
        throw ApiErrors.forbidden('BOOKING_CHAT_REQUIRES_A_CONFIRMED_BOOKING');
    }
    if (!trip || [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED].includes(trip.status)) {
        throw ApiErrors.forbidden('BOOKING_CHAT_IS_CLOSED_BECAUSE_THE_TRIP_IS_COMPLETED_OR');
    }
    return { booking, trip };
}
/**
 * chat:send for a booking room. Sender must be the booking's passenger or
 * the booking trip's driver, with a CONFIRMED booking on an active trip.
 */
async function sendBookingMessage(user, payload) {
    const { bookingId, message } = payload || {};
    if (!bookingId)
        throw ApiErrors.validation('BOOKING_ID_IS_REQUIRED_FOR_BOOKING_CHAT');
    if (!message || !String(message).trim())
        throw ApiErrors.validation('MESSAGE_IS_REQUIRED');
    await assertBookingChatOpen(user, bookingId);
    const clean = sanitizeMessage(message);
    if (!clean)
        throw ApiErrors.validation('MESSAGE_IS_EMPTY_AFTER_SANITIZATION');
    const created = await Message.create({
        senderId: user.id,
        bookingId,
        message: clean,
        messageType: (payload.messageType === 'system' ? 'system' : 'text'),
    });
    const row = await findMessageWithSender(created.id);
    const out = {
        id: row.id,
        sender_id: row.senderId,
        sender_name: row.sender ? row.sender.fullName : null,
        message: row.message,
        message_type: row.messageType,
        booking_id: row.bookingId,
        support_ticket_id: null,
        created_at: row.createdat ? row.createdat.toISOString() : null,
        timestamp: Date.now(),
    };
    realtimeService.emitToRoom(`booking:${bookingId}`, 'chat:receive', out);
    realtimeMetrics.recordEvent('chat:receive');
    realtimeMetrics.recordDelivery();
    return { id: row.id, created_at: out.created_at };
}
/**
 * chat:send for a support ticket room. Sender must be the ticket owner or a
 * support/admin/moderator agent. Available over the whole lifetime of the
 * app for both passengers and drivers.
 */
async function sendSupportMessage(user, payload) {
    const { supportTicketId, message } = payload || {};
    if (!supportTicketId)
        throw ApiErrors.validation('SUPPORT_TICKET_ID_IS_REQUIRED_FOR_SUPPORT_CHAT');
    if (!message || !String(message).trim())
        throw ApiErrors.validation('MESSAGE_IS_REQUIRED');
    const member = await realtimeService.isTicketMember(user, supportTicketId);
    if (!member)
        throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
    const clean = sanitizeMessage(message);
    if (!clean)
        throw ApiErrors.validation('MESSAGE_IS_EMPTY_AFTER_SANITIZATION');
    const created = await Message.create({
        senderId: user.id,
        supportTicketId,
        message: clean,
        messageType: 'text',
    });
    const row = await findMessageWithSender(created.id);
    const out = {
        id: row.id,
        sender_id: row.senderId,
        sender_name: row.sender ? row.sender.fullName : null,
        message: row.message,
        message_type: row.messageType,
        booking_id: null,
        support_ticket_id: row.supportTicketId,
        created_at: row.createdat ? row.createdat.toISOString() : null,
        timestamp: Date.now(),
    };
    realtimeService.emitToRoom(`support:${supportTicketId}`, 'chat:receive', out);
    realtimeMetrics.recordEvent('chat:receive');
    realtimeMetrics.recordDelivery();
    return { id: row.id, created_at: out.created_at };
}
/**
 * chat:read — mark one message or the whole chat read, then broadcast
 * chat:read_ack to the room. Booking-chat reads follow the open-chat rules
 * (CONFIRMED booking + active trip).
 */
async function markRead(user, payload) {
    const { messageId, bookingId, supportTicketId } = payload || {};
    const readAt = new Date();
    if (messageId) {
        const message = await Message.findByPk(messageId);
        if (!message)
            throw ApiErrors.notFound('MESSAGE_NOT_FOUND');
        if (message.senderId === user.id) {
            throw ApiErrors.forbidden('YOU_CANNOT_MARK_YOUR_OWN_MESSAGE_AS_READ');
        }
        let room;
        if (message.bookingId) {
            await assertBookingChatOpen(user, message.bookingId);
            room = `booking:${message.bookingId}`;
        }
        else if (message.supportTicketId) {
            const member = await realtimeService.isTicketMember(user, message.supportTicketId);
            if (!member)
                throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_CONVERSATION');
            room = `support:${message.supportTicketId}`;
        }
        else {
            throw ApiErrors.notFound('MESSAGE_NOT_FOUND');
        }
        await message.update({ isRead: true, readAt });
        realtimeService.emitToRoom(room, 'chat:read_ack', {
            message_id: message.id,
            booking_id: message.bookingId,
            support_ticket_id: message.supportTicketId,
            read_by: user.id,
            read_at: readAt.toISOString(),
            timestamp: Date.now(),
        });
        realtimeMetrics.recordEvent('chat:read_ack');
        return { message_id: message.id };
    }
    if (bookingId) {
        await assertBookingChatOpen(user, bookingId);
        await Message.update({ isRead: true, readAt }, { where: { bookingId, senderId: { [Op.ne]: user.id }, isRead: false } });
        realtimeService.emitToRoom(`booking:${bookingId}`, 'chat:read_ack', {
            message_id: null,
            booking_id: bookingId,
            support_ticket_id: null,
            read_by: user.id,
            read_at: readAt.toISOString(),
            timestamp: Date.now(),
        });
        realtimeMetrics.recordEvent('chat:read_ack');
        return { booking_id: bookingId };
    }
    if (supportTicketId) {
        const member = await realtimeService.isTicketMember(user, supportTicketId);
        if (!member)
            throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
        await Message.update({ isRead: true, readAt }, { where: { supportTicketId, senderId: { [Op.ne]: user.id }, isRead: false } });
        realtimeService.emitToRoom(`support:${supportTicketId}`, 'chat:read_ack', {
            message_id: null,
            booking_id: null,
            support_ticket_id: supportTicketId,
            read_by: user.id,
            read_at: readAt.toISOString(),
            timestamp: Date.now(),
        });
        realtimeMetrics.recordEvent('chat:read_ack');
        return { support_ticket_id: supportTicketId };
    }
    throw ApiErrors.validation('PROVIDE_MESSAGE_ID_BOOKING_ID_OR_SUPPORT_TICKET_ID');
}
/**
 * Paginated booking chat history (REST + offline retrieval). Cursor via
 * before_id (orders on createdat). Membership-only — history stays readable
 * after the trip completes or is cancelled (read-only archive).
 */
async function listBookingMessages(user, { bookingId, page, limit, beforeId } = {}) {
    if (!bookingId)
        throw ApiErrors.validation('BOOKING_ID_IS_REQUIRED');
    const { member, booking } = await realtimeService.getBookingChatContext(user, bookingId);
    if (!booking)
        throw ApiErrors.notFound('BOOKING_NOT_FOUND');
    if (!member)
        throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_BOOKING_CHAT');
    const { page: p, limit: l, offset } = parsePagination({ page, limit });
    const where = { bookingId };
    if (beforeId) {
        const before = await Message.findByPk(beforeId, { attributes: ['id', 'bookingId', 'createdat'] });
        if (!before || before.bookingId !== bookingId)
            throw ApiErrors.badRequest('INVALID_BEFORE_ID');
        where.createdat = { [Op.lt]: before.createdat };
    }
    const { rows, count } = await Message.findAndCountAll({
        where,
        include: [{ model: User, as: 'sender', attributes: ['id', 'fullName'] }],
        order: [['createdat', 'DESC']],
        offset,
        limit: l,
    });
    return { data: rows.map(serialize), pagination: buildPagination(count, p, l) };
}
/**
 * Paginated support ticket chat history.
 */
async function listSupportMessages(user, { supportTicketId, page, limit, beforeId } = {}) {
    if (!supportTicketId)
        throw ApiErrors.validation('SUPPORT_TICKET_ID_IS_REQUIRED');
    const member = await realtimeService.isTicketMember(user, supportTicketId);
    if (!member)
        throw ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_SUPPORT_TICKET');
    const { page: p, limit: l, offset } = parsePagination({ page, limit });
    const where = { supportTicketId };
    if (beforeId) {
        const before = await Message.findByPk(beforeId, {
            attributes: ['id', 'supportTicketId', 'createdat'],
        });
        if (!before || before.supportTicketId !== supportTicketId) {
            throw ApiErrors.badRequest('INVALID_BEFORE_ID');
        }
        where.createdat = { [Op.lt]: before.createdat };
    }
    const { rows, count } = await Message.findAndCountAll({
        where,
        include: [{ model: User, as: 'sender', attributes: ['id', 'fullName'] }],
        order: [['createdat', 'DESC']],
        offset,
        limit: l,
    });
    return { data: rows.map(serialize), pagination: buildPagination(count, p, l) };
}
module.exports = {
    sendBookingMessage,
    sendSupportMessage,
    markRead,
    listBookingMessages,
    listSupportMessages,
    assertBookingChatOpen,
    serialize,
};
//# sourceMappingURL=messageService.js.map