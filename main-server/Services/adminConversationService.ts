// @ts-nocheck
import { Op, fn, col } from 'sequelize';
import {
  Booking,
  Message,
  Penalty,
  SupportTicket,
  Trip,
  User,
  Complaint,
} from '../Models';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import * as penaltyService from './penaltyService';
import { daysAgo, percentChange } from '../utils/statChange';

const ACTIVE_WINDOW_MS = 7 * 24 * 3600 * 1000;
const TEMP_DURATION_DAYS = { '1d': 1, '3d': 3, '7d': 7 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dateGte(filter) {
  if (!filter || filter === 'any') return null;
  const now = Date.now();
  switch (filter) {
    case 'today': {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case 'week': return new Date(now - 7 * 24 * 3600 * 1000);
    case 'month': return new Date(now - 30 * 24 * 3600 * 1000);
    case 'year': return new Date(now - 365 * 24 * 3600 * 1000);
    default: return null;
  }
}

function serializeMessage(row) {
  return {
    id: row.id,
    sender_id: row.senderId,
    sender_name: row.sender ? row.sender.fullName : null,
    message: row.message,
    message_type: row.messageType,
    booking_id: row.bookingId,
    support_ticket_id: row.supportTicketId,
    is_read: row.isRead,
    read_at: row.readAt ? new Date(row.readAt).toISOString() : null,
    created_at: row.createdat ? new Date(row.createdat).toISOString() : null,
  };
}

async function getStats() {
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const cutoff = daysAgo(7);
  const [tripGroups, adminCount, tripActive, adminActive, tripGroupsBefore, adminCountBefore] = await Promise.all([
    Message.findAll({ attributes: ['booking_id'], where: { bookingId: { [Op.ne]: null } }, group: ['booking_id'], raw: true }),
    SupportTicket.count(),
    Message.findAll({ attributes: ['booking_id'], where: { bookingId: { [Op.ne]: null }, createdat: { [Op.gte]: since } }, group: ['booking_id'], raw: true }),
    Message.findAll({ attributes: ['support_ticket_id'], where: { supportTicketId: { [Op.ne]: null }, createdat: { [Op.gte]: since } }, group: ['support_ticket_id'], raw: true }),
    Message.findAll({ attributes: ['booking_id'], where: { bookingId: { [Op.ne]: null }, createdat: { [Op.lte]: cutoff } }, group: ['booking_id'], raw: true }),
    SupportTicket.count({ where: { createdat: { [Op.lte]: cutoff } } }),
  ]);
  const total = tripGroups.length + adminCount;
  const totalBefore = tripGroupsBefore.length + adminCountBefore;
  return {
    total_conversations: total,
    trip_conversations: tripGroups.length,
    admin_conversations: adminCount,
    active: tripActive.length + adminActive.length,
    changes: {
      total_conversations: percentChange(total, totalBefore),
      trip_conversations: percentChange(tripGroups.length, tripGroupsBefore.length),
      admin_conversations: percentChange(adminCount, adminCountBefore),
    },
  };
}

async function listTripConversations(query, page, limit, offset) {
  let bookingIds;
  if (query.search) {
    const term = `%${query.search}%`;
    const bookings = await Booking.findAll({
      attributes: ['id'],
      include: [
        { model: User, as: 'passenger', attributes: [], required: false },
        { model: Trip, as: 'trip', attributes: ['id'], include: [{ model: User, as: 'driver', attributes: [], required: false }], required: false },
      ],
      where: {
        [Op.or]: [
          { '$passenger.full_name$': { [Op.iLike]: term } },
          { '$passenger.phone$': { [Op.iLike]: term } },
          { '$trip.driver.full_name$': { [Op.iLike]: term } },
          ...(UUID_RE.test(query.search) ? [{ '$trip.id$': query.search }] : []),
        ],
      },
      limit: 500,
      subQuery: false,
    });
    bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length === 0) return { data: [], pagination: buildPagination(0, page, limit) };
  }

  const gte = dateGte(query.date);
  const where = { bookingId: { [Op.ne]: null } };
  if (bookingIds) where.bookingId = { [Op.in]: bookingIds };
  if (gte) where.createdat = { [Op.gte]: gte };

  const groups = await Message.findAll({
    attributes: ['bookingId', [fn('MAX', col('createdat')), 'last_at']],
    where,
    group: ['bookingId'],
    order: [[fn('MAX', col('createdat')), 'DESC']],
    raw: true,
  });
  const count = groups.length;
  const slice = groups.slice(offset, offset + limit);
  const data = [];
  for (const g of slice) {
    if (!g.bookingId) continue;
    const [booking, last] = await Promise.all([
      Booking.findByPk(g.bookingId, {
        include: [
          { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] },
          {
            model: Trip,
            as: 'trip',
            attributes: ['id', 'originCity', 'destinationCity', 'status'],
            include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone'] }],
          },
        ],
      }),
      Message.findOne({ where: { bookingId: g.bookingId }, include: [{ model: User, as: 'sender', attributes: ['fullName'] }], order: [['createdat', 'DESC']] }),
    ]);
    if (!booking) continue;
    data.push({
      booking_id: booking.id,
      trip_no: booking.trip?.id || booking.tripId,
      driver: booking.trip?.driver
        ? { ...booking.trip.driver.toJSON(), phone: maskPhone(booking.trip.driver.phone) }
        : null,
      passenger: booking.passenger
        ? { ...booking.passenger.toJSON(), phone: maskPhone(booking.passenger.phone) }
        : null,
      route: booking.trip ? `${booking.trip.originCity} ← ${booking.trip.destinationCity}` : null,
      last_message: last ? last.message : null,
      last_message_at: last ? last.createdat : null,
      trip_status: booking.trip?.status || null,
    });
  }
  return { data, pagination: buildPagination(count, page, limit) };
}

async function listAdminConversations(query, page, limit, offset) {
  const where = {};
  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [
      { '$user.full_name$': { [Op.iLike]: term } },
      { subject: { [Op.iLike]: term } },
    ];
  }
  const gte = dateGte(query.date);
  if (gte) where.updatedat = { [Op.gte]: gte };

  const { rows, count } = await SupportTicket.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'phone'], required: Boolean(query.search) }],
    order: [['updatedat', 'DESC']],
    offset,
    limit,
    distinct: true,
  });
  const data = [];
  for (const t of rows) {
    const last = await Message.findOne({ where: { supportTicketId: t.id }, order: [['createdat', 'DESC']] });
    data.push({
      ticket_id: t.id,
      user: t.user ? { ...t.user.toJSON(), phone: maskPhone(t.user.phone) } : null,
      subject: t.subject,
      category: t.category,
      status: t.status,
      trip_id: t.tripId,
      last_message: last ? last.message : null,
      last_message_at: last ? last.createdat : t.updatedat,
    });
  }
  return { data, pagination: buildPagination(count, page, limit) };
}

async function listConversations(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  if ((query.type || 'trip') === 'admin') return listAdminConversations(query, page, limit, offset);
  return listTripConversations(query, page, limit, offset);
}

async function getTripThread(bookingId, query = {}) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'createdat'] },
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'departureTime', 'status'],
        include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating', 'createdat'] }],
      },
    ],
  });
  if (!booking || !booking.trip) throw ApiErrors.notFound('BOOKING_NOT_FOUND');

  const { page: p, limit: l, offset } = parsePagination(query);
  const where = { bookingId };
  if (query.before_id) {
    const before = await Message.findByPk(query.before_id, { attributes: ['id', 'bookingId', 'createdat'] });
    if (!before || before.bookingId !== bookingId) throw ApiErrors.badRequest('INVALID_BEFORE_ID');
    where.createdat = { [Op.lt]: before.createdat };
  }
  const [rows, count, penalties] = await Promise.all([
    Message.findAll({
      where,
      include: [{ model: User, as: 'sender', attributes: ['fullName'] }],
      order: [['createdat', 'DESC']],
      offset,
      limit: l,
    }),
    Message.count({ where: { bookingId } }),
    Penalty.findAll({
      where: { userId: { [Op.in]: [booking.passengerId, booking.trip.driverId] } },
      include: [{ model: Complaint, as: 'complaint', attributes: ['id', 'category'] }],
      order: [['startsAt', 'DESC']],
      limit: 5,
    }),
  ]);

  return {
    trip: {
      id: booking.trip.id,
      route: `${booking.trip.originCity} ← ${booking.trip.destinationCity}`,
      departure_time: booking.trip.departureTime,
      status: booking.trip.status,
      booking_id: booking.id,
    },
    driver: booking.trip.driver
      ? {
        ...booking.trip.driver.toJSON(),
        phone: maskPhone(booking.trip.driver.phone),
        avg_rating: Number(booking.trip.driver.avgRating) || 0,
      }
      : null,
    passenger: booking.passenger
      ? { ...booking.passenger.toJSON(), phone: maskPhone(booking.passenger.phone) }
      : null,
    penalty_action: {
      passenger_id: booking.passengerId,
      driver_id: booking.trip.driverId,
    },
    related_actions: penalties.map((pen) => ({
      id: pen.id,
      type: pen.type,
      reason: pen.reason,
      user_id: pen.userId,
      complaint: pen.complaint,
      starts_at: pen.startsAt,
    })),
    thread: {
      data: rows.map(serializeMessage),
      pagination: buildPagination(count, p, l),
    },
  };
}

async function penalize(adminId, bookingId, dto) {
  const booking = await Booking.findByPk(bookingId, { include: [{ model: Trip, as: 'trip', attributes: ['driverId'] }] });
  if (!booking || !booking.trip) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
  const passengerId = booking.passengerId;
  const driverId = booking.trip.driverId;
  if (dto.target_user_id !== passengerId && dto.target_user_id !== driverId) {
    throw ApiErrors.forbidden('TARGET_MUST_BE_A_PARTY_OF_THE_BOOKING');
  }
  if (dto.kind === 'temporary') {
    const days = dto.duration === 'custom' ? dto.durationDays : dto.duration != null ? TEMP_DURATION_DAYS[dto.duration] : undefined;
    if (!days) throw ApiErrors.validation('DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
    return penaltyService.issue(adminId, {
      user_id: dto.target_user_id,
      type: 'suspension',
      reason: dto.reason,
      details: dto.notes || `Temporary suspension for ${days} day(s)`,
      ends_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
    });
  }
  if (dto.kind === 'permanent') {
    if (dto.confirmReviewedLog !== true) throw ApiErrors.validation('CONFIRM_REVIEWED_LOG_REQUIRED');
    return penaltyService.issue(adminId, {
      user_id: dto.target_user_id,
      type: 'ban',
      reason: dto.reason,
      details: dto.notes || null,
      confirm_reviewed_log: true,
    });
  }
  return penaltyService.issue(adminId, {
    user_id: dto.target_user_id,
    type: 'warning',
    reason: dto.reason,
    details: dto.notes || null,
  });
}

module.exports = { getStats, listConversations, getTripThread, penalize };
export { getStats, listConversations, getTripThread, penalize };
export default module.exports;
