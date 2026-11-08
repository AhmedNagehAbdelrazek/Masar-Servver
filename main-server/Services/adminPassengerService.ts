// @ts-nocheck
import { Op, fn, col } from 'sequelize';
import {
  User,
  Booking,
  RideRequest,
  Complaint,
  Rating,
  Penalty,
  Notification,
  Trip,
} from '../Models';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import * as penaltyService from './penaltyService';

const PASSENGER_ROLE = 'passenger';

const ACTIVE_BUCKET = { role: PASSENGER_ROLE, status: { [Op.in]: ['active', 'warned'] } };
const SUSPENDED_BUCKET = { role: PASSENGER_ROLE, status: 'suspended' };
const BANNED_BUCKET = { role: PASSENGER_ROLE, status: 'banned' };

function dateGte(filter) {
  if (!filter || filter === 'any') return null;
  const now = new Date();
  switch (filter) {
    case 'today': {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 3600 * 1000);
    default:
      return null;
  }
}

function baseWhere(query) {
  let where;
  switch (query.accountStatus) {
    case 'active': where = { ...ACTIVE_BUCKET }; break;
    case 'suspended_temporary': where = { ...SUSPENDED_BUCKET }; break;
    case 'suspended_permanent': where = { ...BANNED_BUCKET }; break;
    // "with_violations" needs a relation check; Sequelize where on include is
    // awkward, so the list method applies it after fetching (documented).
    default: where = { role: PASSENGER_ROLE };
  }
  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.and] = [
      ...(where[Op.and] || []),
      { [Op.or]: [{ fullName: { [Op.iLike]: term } }, { phone: { [Op.iLike]: term } }] },
    ];
  }
  const gte = dateGte(query.registeredAt);
  if (gte) where.createdat = { [Op.gte]: gte };
  return where;
}

async function getPassengerOrThrow(passengerId) {
  const user = await User.findByPk(passengerId);
  if (!user || user.role !== PASSENGER_ROLE) {
    throw ApiErrors.notFound('PASSENGER_NOT_FOUND');
  }
  return user;
}

async function getStats() {
  const violationRows = await Penalty.findAll({ attributes: ['user_id'], group: ['user_id'], raw: true });
  const violationIds = violationRows.map((r) => r.user_id).filter(Boolean);
  const [total, active, suspendedTemporary, suspendedPermanent, withViolations] = await Promise.all([
    User.count({ where: { role: PASSENGER_ROLE } }),
    User.count({ where: ACTIVE_BUCKET }),
    User.count({ where: SUSPENDED_BUCKET }),
    User.count({ where: BANNED_BUCKET }),
    violationIds.length ? User.count({ where: { role: PASSENGER_ROLE, id: { [Op.in]: violationIds } } }) : 0,
  ]);
  return {
    total_passengers: total,
    active,
    suspended_temporary: suspendedTemporary,
    suspended_permanent: suspendedPermanent,
    with_violations: withViolations,
  };
}

async function listPassengers(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  let where = baseWhere(query);
  if (query.accountStatus === 'with_violations') {
    const violationRows = await Penalty.findAll({ attributes: ['user_id'], group: ['user_id'], raw: true });
    const ids = violationRows.map((r) => r.user_id).filter(Boolean);
    where = { ...where, id: { [Op.in]: ids } };
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ['id', 'fullName', 'phone', 'status', 'avgRating', 'createdat'],
    order: [['createdat', 'DESC']],
    offset,
    limit,
    distinct: true,
  });
  const ids = rows.map((u) => u.id);

  const [completed, cancelled, complaints, allBookings] = await Promise.all([
    ids.length ? Booking.findAll({ attributes: ['passengerId', [fn('COUNT', col('id')), 'count']], where: { passengerId: { [Op.in]: ids }, status: 'completed' }, group: ['passengerId'], raw: true }) : [],
    ids.length ? Booking.findAll({ attributes: ['passengerId', [fn('COUNT', col('id')), 'count']], where: { passengerId: { [Op.in]: ids }, status: 'cancelled' }, group: ['passengerId'], raw: true }) : [],
    ids.length ? Complaint.findAll({ attributes: ['accusedId', [fn('COUNT', col('id')), 'count']], where: { accusedId: { [Op.in]: ids } }, group: ['accusedId'], raw: true }) : [],
    ids.length ? Booking.findAll({ attributes: ['passengerId', [fn('COUNT', col('id')), 'count']], where: { passengerId: { [Op.in]: ids } }, group: ['passengerId'], raw: true }) : [],
  ]);
  const toMap = (arr, key) => new Map(arr.map((r) => [r[key], Number(r.count)]));
  const completedBy = toMap(completed, 'passengerId');
  const cancelledBy = toMap(cancelled, 'passengerId');
  const complaintsBy = toMap(complaints, 'accusedId');
  const bookingsBy = toMap(allBookings, 'passengerId');

  return {
    data: rows.map((u) => ({
      id: u.id,
      full_name: u.fullName,
      name: u.fullName,
      phone: maskPhone(u.phone),
      account_status: u.status,
      status: u.status,
      avg_rating: Number(u.avgRating) || 0,
      completed_bookings: completedBy.get(u.id) || 0,
      cancelled_bookings: cancelledBy.get(u.id) || 0,
      complaints_against: complaintsBy.get(u.id) || 0,
      total_bookings: bookingsBy.get(u.id) || 0,
      created_at: u.createdat,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function exportPassengers(query = {}) {
  let where = baseWhere(query);
  if (query.accountStatus === 'with_violations') {
    const violationRows = await Penalty.findAll({ attributes: ['user_id'], group: ['user_id'], raw: true });
    const ids = violationRows.map((r) => r.user_id).filter(Boolean);
    where = { ...where, id: { [Op.in]: ids } };
  }
  const rows = await User.findAll({
    where,
    attributes: ['id', 'fullName', 'phone', 'status', 'createdat'],
    order: [['createdat', 'DESC']],
    limit: 5000,
  });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = ['id,full_name,phone,account_status,created_at'];
  for (const u of rows) {
    lines.push([u.id, esc(u.fullName), esc(maskPhone(u.phone)), u.status, u.createdat ? u.createdat.toISOString() : ''].join(','));
  }
  return lines.join('\n');
}

async function getOverview(passengerId) {
  const user = await getPassengerOrThrow(passengerId);
  const [totalBookings, completedBookings, cancelledBookings, lastBooking, ratingAgg, ratingsCount] = await Promise.all([
    Booking.count({ where: { passengerId } }),
    Booking.count({ where: { passengerId, status: 'completed' } }),
    Booking.count({ where: { passengerId, status: 'cancelled' } }),
    Booking.findOne({
      where: { passengerId },
      include: [{ model: Trip, as: 'trip', attributes: ['id', 'originCity', 'destinationCity', 'departureTime'] }],
      order: [['createdat', 'DESC']],
    }),
    Rating.findOne({ attributes: [[fn('AVG', col('stars')), 'avg']], where: { raterId: passengerId } }),
    Rating.count({ where: { raterId: passengerId } }),
  ]);
  return {
    personal_info: {
      id: user.id,
      full_name: user.fullName,
      phone: maskPhone(user.phone),
      age: user.age != null ? Number(user.age) : null,
      gender: user.gender,
      city: null,
      account_status: user.status,
      registration_date: user.createdat,
      last_login: user.lastLoginAt,
    },
    booking_stats: {
      total_bookings: totalBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
    },
    last_booking: lastBooking
      ? {
        id: lastBooking.id,
        status: lastBooking.status,
        seats_booked: lastBooking.seatsBooked,
        price: Number(lastBooking.agreedFare),
        trip: lastBooking.trip,
      }
      : null,
    ratings_summary: {
      given_count: ratingsCount,
      given_avg: ratingAgg?.get('avg') ? parseFloat(ratingAgg.get('avg')) : 0,
    },
  };
}

async function getAccountLog(passengerId) {
  await getPassengerOrThrow(passengerId);
  const [penalties, complaints] = await Promise.all([
    Penalty.findAll({ where: { userId: passengerId }, order: [['startsAt', 'DESC']] }),
    Complaint.findAll({
      where: { [Op.or]: [{ reporterId: passengerId }, { accusedId: passengerId }] },
      order: [['createdat', 'DESC']],
    }),
  ]);
  const log = [
    ...penalties.map((p) => ({
      title: p.penaltyType || p.type,
      reason: p.reason,
      related_trip_id: p.tripId || null,
      date: p.startsAt,
      type: p.type,
      status: !p.endsAt || new Date(p.endsAt) > new Date() ? 'active' : 'resolved',
    })),
    ...complaints.map((c) => ({
      title: c.category,
      reason: c.description,
      related_trip_id: null,
      date: c.createdat,
      type: 'enquiry',
      status: ['open', 'reviewing'].includes(c.status) ? 'pending' : 'resolved',
      direction: c.reporterId === passengerId ? 'filed' : 'against',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return {
    summary: {
      penalties: penalties.length,
      warnings: penalties.filter((p) => p.type === 'warning').length,
      suspensions: penalties.filter((p) => p.type === 'suspension').length,
      bans: penalties.filter((p) => p.type === 'ban').length,
      complaints_against: complaints.filter((c) => c.accusedId === passengerId).length,
      complaints_filed: complaints.filter((c) => c.reporterId === passengerId).length,
    },
    log,
    rows: log,
  };
}

function bookingStatusWhere(status) {
  switch (status) {
    case 'in_progress': return 'confirmed';
    case 'upcoming': return 'pending';
    case 'canceled': return 'cancelled';
    default: return status;
  }
}

async function listBookings(passengerId, query = {}) {
  await getPassengerOrThrow(passengerId);
  const { page, limit, offset } = parsePagination(query);
  const where = { passengerId };
  if (query.status && query.status !== 'all') where.status = bookingStatusWhere(query.status);
  const gte = dateGte(query.date);
  if (gte) where.createdat = { [Op.gte]: gte };
  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: [{
      model: Trip,
      as: 'trip',
      attributes: ['id', 'originCity', 'destinationCity', 'departureTime'],
      include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
    }],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  return {
    data: rows.map((b) => ({
      id: b.id,
      reference_code: b.referenceCode,
      date_time: b.createdat,
      seats: b.seatsBooked,
      seat_price: Number(b.agreedFare),
      status: b.status,
      trip: b.trip,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function listTripRequests(passengerId, query = {}) {
  await getPassengerOrThrow(passengerId);
  const { page, limit, offset } = parsePagination(query);
  const where = { passengerId };
  if (query.status && query.status !== 'all') {
    where.status = query.status === 'upcoming' ? 'open' : query.status === 'canceled' ? 'cancelled' : query.status;
  }
  const gte = dateGte(query.date);
  if (gte) where.createdat = { [Op.gte]: gte };
  const { rows, count } = await RideRequest.findAndCountAll({
    where,
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  return {
    data: rows.map((r) => ({
      id: r.id,
      origin_city: r.originCity,
      destination_city: r.destinationCity,
      seats_needed: r.seatsNeeded,
      status: r.status,
      created_at: r.createdat,
      expires_at: r.expiresAt,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function listComplaints(passengerId, query = {}) {
  await getPassengerOrThrow(passengerId);
  const { page, limit, offset } = parsePagination(query);
  const direction = query.direction;
  const where = direction === 'filed'
    ? { reporterId: passengerId }
    : direction === 'against'
      ? { accusedId: passengerId }
      : { [Op.or]: [{ reporterId: passengerId }, { accusedId: passengerId }] };
  const { rows, count } = await Complaint.findAndCountAll({
    where,
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'fullName'] },
      { model: User, as: 'accused', attributes: ['id', 'fullName'] },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  return {
    data: rows.map((c) => ({
      id: c.id,
      complaint_no: c.id,
      direction: c.reporterId === passengerId ? 'filed' : 'against',
      other_party: c.reporterId === passengerId ? c.accused : c.reporter,
      reason: c.category,
      description: c.description,
      status: c.status,
      created_at: c.createdat,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function listRatings(passengerId, query = {}) {
  await getPassengerOrThrow(passengerId);
  const { page, limit, offset } = parsePagination(query);
  const direction = query.direction || 'given';
  const where = direction === 'given' ? { raterId: passengerId } : { rateeId: passengerId };
  const { rows, count } = await Rating.findAndCountAll({
    where,
    include: [
      { model: User, as: 'rater', attributes: ['id', 'fullName'] },
      { model: User, as: 'ratee', attributes: ['id', 'fullName'] },
      {
        model: Booking,
        as: 'booking',
        attributes: ['id'],
        include: [{ model: Trip, as: 'trip', attributes: ['id', 'originCity', 'destinationCity', 'driverId'] }],
      },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  return {
    data: rows.map((r) => ({
      id: r.id,
      direction,
      stars: r.stars,
      review: r.review,
      tags: r.tags,
      rater: r.rater,
      ratee: r.ratee,
      booking_id: r.bookingId,
      trip: r.booking?.trip || null,
      created_at: r.createdat,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function sendNotification(adminId, passengerId, dto) {
  await getPassengerOrThrow(passengerId);
  const notification = await Notification.create({
    userId: passengerId,
    type: 'ADMIN_NOTICE',
    title: dto.title,
    body: dto.body,
    data: { category: dto.type || 'general', sent_by: adminId },
    sentVia: ['in_app'],
  });
  return {
    notification: {
      id: notification.id,
      user_id: notification.userId,
      title: notification.title,
      category: dto.type || 'general',
      created_at: notification.createdat,
    },
  };
}

async function sendWarning(adminId, passengerId, dto) {
  await getPassengerOrThrow(passengerId);
  return penaltyService.issue(adminId, {
    user_id: passengerId,
    type: 'warning',
    reason: dto.reason,
    details: dto.notes || null,
  });
}

const DURATION_DAYS = { '1d': 1, '3d': 3, '7d': 7 };

async function suspendTemporary(adminId, passengerId, dto) {
  await getPassengerOrThrow(passengerId);
  const days = dto.duration === 'custom' ? dto.durationDays : DURATION_DAYS[dto.duration];
  if (!days) throw ApiErrors.validation('DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
  const endsAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  return penaltyService.issue(adminId, {
    user_id: passengerId,
    type: 'suspension',
    reason: dto.reason,
    details: dto.notes || `Temporary suspension for ${days} day(s)`,
    ends_at: endsAt,
  });
}

async function suspendPermanent(adminId, passengerId, dto) {
  await getPassengerOrThrow(passengerId);
  if (dto.confirmReviewedLog !== true) {
    throw ApiErrors.validation('CONFIRM_REVIEWED_LOG_REQUIRED');
  }
  return penaltyService.issue(adminId, {
    user_id: passengerId,
    type: 'ban',
    reason: dto.reason,
    details: dto.notes || null,
    confirm_reviewed_log: true,
  });
}

/**
 * Lift an account action (dashboard "رفع إيقاف"). Closes every open
 * suspension/ban and reactivates the account.
 */
async function applyAccountStatus(adminId, passengerId, action) {
  const user = await getPassengerOrThrow(passengerId);
  if (!['reactivate', 'unblock', 'suspend'].includes(action)) {
    throw ApiErrors.validation('INVALID_ACCOUNT_ACTION');
  }
  if (action === 'suspend') {
    await user.update({ status: 'suspended' });
  } else {
    await user.update({ status: 'active' });
    await Penalty.update(
      { endsAt: new Date() },
      { where: { userId: passengerId, type: { [Op.in]: ['suspension', 'ban'] }, endsAt: null } }
    );
  }
  return { passenger: { id: passengerId, account_status: user.status } };
}

module.exports = {
  getStats,
  listPassengers,
  exportPassengers,
  getOverview,
  getAccountLog,
  listBookings,
  listTripRequests,
  listComplaints,
  listRatings,
  sendNotification,
  sendWarning,
  suspendTemporary,
  suspendPermanent,
  applyAccountStatus,
};
export {
  getStats,
  listPassengers,
  exportPassengers,
  getOverview,
  getAccountLog,
  listBookings,
  listTripRequests,
  listComplaints,
  listRatings,
  sendNotification,
  sendWarning,
  suspendTemporary,
  suspendPermanent,
  applyAccountStatus,
};
export default module.exports;
