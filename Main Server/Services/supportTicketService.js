const { Op } = require('sequelize');
const {
  SupportTicket,
  SupportTicketMessage,
  User,
  Booking,
} = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const {
  TICKET_STATUS,
  TICKET_PRIORITY,
} = require('../config/constants');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const { generateReferenceCode } = require('../utils/referenceCode');

const STAFF_ROLES = ['admin', 'support', 'moderator'];

function isStaff(user) {
  return user && STAFF_ROLES.includes(user.role);
}

function serializeTicket(ticket, options = {}) {
  const base = {
    id: ticket.id,
    reference_code: ticket.referenceCode,
    user_id: ticket.userId,
    user_name: ticket.user ? ticket.user.fullName : null,
    category: ticket.category,
    subject: ticket.subject,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    assigned_to: ticket.assignedTo || null,
    booking_id: ticket.bookingId || null,
    trip_id: ticket.tripId || null,
    resolution_notes: ticket.resolutionNotes || null,
    created_at: ticket.createdat || ticket.createdAt,
    updated_at: ticket.updatedat || ticket.updatedAt,
  };
  if (options.includeMessages) {
    base.messages = (ticket.messages || []).map(serializeMessage);
  }
  return base;
}

function serializeMessage(message) {
  return {
    id: message.id,
    ticket_id: message.ticketId,
    sender_id: message.senderId,
    sender_name: message.sender ? message.sender.fullName : null,
    sender_role: message.sender ? message.sender.role : null,
    message: message.message,
    created_at: message.createdat || message.createdAt,
  };
}

async function uniqueTicketCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferenceCode('TKT');
    const existing = await SupportTicket.findOne({ where: { referenceCode: code } });
    if (!existing) return code;
  }
  throw ApiErrors.serverError('COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE');
}

async function notifyStaff(ticket) {
  const staff = await User.findAll({
    where: { role: { [Op.in]: STAFF_ROLES }, status: 'active' },
    attributes: ['id', 'fullName'],
  });
  await Promise.allSettled(
    staff.map((member) =>
      notificationService.sendToUser(member, 'SUPPORT_TICKET_NEW', {
        channels: ['in_app'],
        vars: {
          reference_code: ticket.referenceCode,
          subject: ticket.subject,
        },
      })
    )
  );
}

async function createTicket(user, payload) {
  const referenceCode = await uniqueTicketCode();

  if (payload.booking_id) {
    const booking = await Booking.findByPk(payload.booking_id);
    if (!booking) throw ApiErrors.notFound('REFERENCED_BOOKING_NOT_FOUND');
  }

  const ticket = await SupportTicket.create({
    userId: user.id,
    category: payload.category,
    subject: payload.subject,
    description: payload.description,
    priority: payload.priority || TICKET_PRIORITY.MEDIUM,
    status: TICKET_STATUS.OPEN,
    referenceCode,
    bookingId: payload.booking_id || null,
    tripId: payload.trip_id || null,
  });

  auditService.track({
    action: 'support_ticket.created',
    resourceType: 'support_ticket',
    resourceId: ticket.id,
    actorId: user.id,
    actorType: user.role,
    payload: { reference_code: referenceCode, category: ticket.category },
  });

  setImmediate(() => {
    notifyStaff(ticket).catch((err) => {
      console.warn('[supportTicketService] staff notification failed:', err.message);
    });
  });

  return serializeTicket(ticket);
}

async function listTickets(user, filters = {}) {
  const { status, priority } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const where = {};
  if (!isStaff(user)) {
    where.userId = user.id;
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const { rows, count } = await SupportTicket.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map((t) => serializeTicket(t)),
    pagination: buildPagination(count, page, limit),
  };
}

async function getTicket(user, ticketId) {
  const ticket = await SupportTicket.findByPk(ticketId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'fullName'] },
      {
        model: SupportTicketMessage,
        as: 'messages',
        include: [{ model: User, as: 'sender', attributes: ['id', 'fullName', 'role'] }],
      },
    ],
  });
  if (!ticket) throw ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');
  if (!isStaff(user) && ticket.userId !== user.id) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_YOUR_OWN_SUPPORT_TICKETS');
  }

  const sorted = (ticket.messages || []).sort(
    (a, b) => new Date(a.createdat || a.createdAt) - new Date(b.createdat || b.createdAt)
  );
  ticket.messages = sorted;

  return { support_ticket: serializeTicket(ticket, { includeMessages: true }) };
}

async function assertTicketExists(ticketId) {
  const ticket = await SupportTicket.findByPk(ticketId);
  if (!ticket) throw ApiErrors.notFound('SUPPORT_TICKET_NOT_FOUND');
  return ticket;
}

async function updateTicket(actorId, ticketId, payload) {
  const ticket = await assertTicketExists(ticketId);

  const updates = {};
  if (payload.assigned_to !== undefined) updates.assignedTo = payload.assigned_to;
  if (payload.priority !== undefined) updates.priority = payload.priority;
  if (payload.category !== undefined) updates.category = payload.category;
  if (payload.resolution_notes !== undefined) updates.resolutionNotes = payload.resolution_notes;

  await ticket.update(updates);

  auditService.track({
    action: 'support_ticket.updated',
    resourceType: 'support_ticket',
    resourceId: ticket.id,
    actorId,
    actorType: 'staff',
    payload: { fields: Object.keys(updates) },
  });

  return serializeTicket(ticket);
}

async function updateTicketStatus(actorId, ticketId, status) {
  const ticket = await assertTicketExists(ticketId);
  if (ticket.status === TICKET_STATUS.CLOSED && status !== TICKET_STATUS.CLOSED) {
    throw ApiErrors.conflict('CLOSED_TICKETS_CANNOT_BE_REOPENED');
  }

  await ticket.update({ status });

  auditService.track({
    action: `support_ticket.status.${status}`,
    resourceType: 'support_ticket',
    resourceId: ticket.id,
    actorId,
    actorType: 'staff',
  });

  return serializeTicket(ticket);
}

async function addMessage(user, ticketId, messageText) {
  const ticket = await assertTicketExists(ticketId);
  if (!isStaff(user) && ticket.userId !== user.id) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_REPLY_TO_YOUR_OWN_SUPPORT_TICKETS');
  }

  const message = await SupportTicketMessage.create({
    ticketId,
    senderId: user.id,
    message: messageText,
  });

  const sender = await User.findByPk(user.id, { attributes: ['id', 'fullName', 'role'] });
  message.sender = sender;

  auditService.track({
    action: 'support_ticket.message_added',
    resourceType: 'support_ticket_message',
    resourceId: message.id,
    actorId: user.id,
    actorType: user.role,
    payload: { ticket_id: ticketId },
  });

  return serializeMessage(message);
}

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  updateTicketStatus,
  addMessage,
  isStaff,
};
