const { Op } = require('sequelize');
const { Message, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { sanitizeMessage } = require('../utils/sanitize');
const realtimeService = require('./realtimeService');
const realtimeMetrics = require('./realtimeMetrics');

/**
 * Trip + support chat persistence and realtime broadcast. Messages are
 * persisted BEFORE broadcast so nothing is lost for offline clients
 * (persistence-before-broadcast, R5).
 */

function serialize(row) {
  return {
    id: row.id,
    sender_id: row.senderId,
    sender_name: row.sender ? row.sender.fullName : null,
    message: row.message,
    message_type: row.messageType,
    trip_id: row.tripId || null,
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
 * chat:send for a trip room. Sender must be a confirmed trip participant.
 */
async function sendTripMessage(user, payload) {
  const { tripId, message } = payload || {};
  if (!tripId) throw ApiErrors.validation('trip_id is required for trip chat');
  if (!message || !String(message).trim()) throw ApiErrors.validation('message is required');

  const member = await realtimeService.isTripMember(user, tripId);
  if (!member) throw ApiErrors.forbidden('You are not a member of this trip');

  const clean = sanitizeMessage(message);
  if (!clean) throw ApiErrors.validation('message is empty after sanitization');

  const created = await Message.create({
    senderId: user.id,
    tripId,
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
    trip_id: row.tripId,
    support_ticket_id: null,
    created_at: row.createdat ? row.createdat.toISOString() : null,
    timestamp: Date.now(),
  };

  realtimeService.emitToRoom(`trip:${tripId}`, 'chat:receive', out);
  realtimeMetrics.recordEvent('chat:receive');
  realtimeMetrics.recordDelivery();

  return { id: row.id, created_at: out.created_at };
}

/**
 * chat:send for a support ticket room. Sender must be the ticket owner or a
 * support/admin/moderator agent.
 */
async function sendSupportMessage(user, payload) {
  const { supportTicketId, message } = payload || {};
  if (!supportTicketId) throw ApiErrors.validation('support_ticket_id is required for support chat');
  if (!message || !String(message).trim()) throw ApiErrors.validation('message is required');

  const member = await realtimeService.isTicketMember(user, supportTicketId);
  if (!member) throw ApiErrors.forbidden('You are not a member of this support ticket');

  const clean = sanitizeMessage(message);
  if (!clean) throw ApiErrors.validation('message is empty after sanitization');

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
    trip_id: null,
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
 * chat:read_ack to the room.
 */
async function markRead(user, payload) {
  const { messageId, tripId, supportTicketId } = payload || {};
  const readAt = new Date();

  if (messageId) {
    const message = await Message.findByPk(messageId);
    if (!message) throw ApiErrors.notFound('Message not found');
    if (message.senderId === user.id) {
      throw ApiErrors.forbidden('You cannot mark your own message as read');
    }
    const room = message.tripId ? `trip:${message.tripId}` : `support:${message.supportTicketId}`;
    const member = message.tripId
      ? await realtimeService.isTripMember(user, message.tripId)
      : await realtimeService.isTicketMember(user, message.supportTicketId);
    if (!member) throw ApiErrors.forbidden('You are not a member of this conversation');

    await message.update({ isRead: true, readAt });
    realtimeService.emitToRoom(room, 'chat:read_ack', {
      message_id: message.id,
      trip_id: message.tripId,
      support_ticket_id: message.supportTicketId,
      read_by: user.id,
      read_at: readAt.toISOString(),
      timestamp: Date.now(),
    });
    realtimeMetrics.recordEvent('chat:read_ack');
    return { message_id: message.id };
  }

  if (tripId) {
    const member = await realtimeService.isTripMember(user, tripId);
    if (!member) throw ApiErrors.forbidden('You are not a member of this trip');
    await Message.update(
      { isRead: true, readAt },
      { where: { tripId, senderId: { [Op.ne]: user.id }, isRead: false } }
    );
    realtimeService.emitToRoom(`trip:${tripId}`, 'chat:read_ack', {
      message_id: null,
      trip_id: tripId,
      support_ticket_id: null,
      read_by: user.id,
      read_at: readAt.toISOString(),
      timestamp: Date.now(),
    });
    realtimeMetrics.recordEvent('chat:read_ack');
    return { trip_id: tripId };
  }

  if (supportTicketId) {
    const member = await realtimeService.isTicketMember(user, supportTicketId);
    if (!member) throw ApiErrors.forbidden('You are not a member of this support ticket');
    await Message.update(
      { isRead: true, readAt },
      { where: { supportTicketId, senderId: { [Op.ne]: user.id }, isRead: false } }
    );
    realtimeService.emitToRoom(`support:${supportTicketId}`, 'chat:read_ack', {
      message_id: null,
      trip_id: null,
      support_ticket_id: supportTicketId,
      read_by: user.id,
      read_at: readAt.toISOString(),
      timestamp: Date.now(),
    });
    realtimeMetrics.recordEvent('chat:read_ack');
    return { support_ticket_id: supportTicketId };
  }

  throw ApiErrors.validation('Provide message_id, trip_id or support_ticket_id');
}

/**
 * Paginated trip chat history (REST + offline retrieval). Cursor via
 * before_id (orders on createdat).
 */
async function listTripMessages(user, { tripId, page, limit, beforeId } = {}) {
  if (!tripId) throw ApiErrors.validation('trip_id is required');
  const member = await realtimeService.isTripMember(user, tripId);
  if (!member) throw ApiErrors.forbidden('You are not a member of this trip');

  const { page: p, limit: l, offset } = parsePagination({ page, limit });
  const where = { tripId };
  if (beforeId) {
    const before = await Message.findByPk(beforeId, { attributes: ['id', 'tripId', 'createdat'] });
    if (!before || before.tripId !== tripId) throw ApiErrors.badRequest('Invalid before_id');
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
  if (!supportTicketId) throw ApiErrors.validation('support_ticket_id is required');
  const member = await realtimeService.isTicketMember(user, supportTicketId);
  if (!member) throw ApiErrors.forbidden('You are not a member of this support ticket');

  const { page: p, limit: l, offset } = parsePagination({ page, limit });
  const where = { supportTicketId };
  if (beforeId) {
    const before = await Message.findByPk(beforeId, {
      attributes: ['id', 'supportTicketId', 'createdat'],
    });
    if (!before || before.supportTicketId !== supportTicketId) {
      throw ApiErrors.badRequest('Invalid before_id');
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
  sendTripMessage,
  sendSupportMessage,
  markRead,
  listTripMessages,
  listSupportMessages,
  serialize,
};
