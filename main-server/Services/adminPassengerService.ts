// @ts-nocheck
import { Op, fn, col } from 'sequelize';
import {
  User,
  Booking,
  RideRequest,
  Complaint,
  Rating,
  Penalty,
  Trip,
  PassengerProfile,
  DeletionRequest,
} from '../Models';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import * as penaltyService from './penaltyService';
import * as adminAuditService from './adminAuditService';
import notificationService from './notificationService';

const PASSENGER_ROLE = 'passenger';
const DELETION_STATUSES = ['pending', 'approved'];

const ACTIVE_BUCKET = { role: PASSENGER_ROLE, status: { [Op.in]: ['active', 'warned'] } };
const SUSPENDED_BUCKET = { role: PASSENGER_ROLE, status: 'suspended' };
const BANNED_BUCKET = { role: PASSENGER_ROLE, status: 'banned' };

// Accounts that requested/were soft-deleted are kept for history but hidden
// from the active passenger directory (mirrors the driver dashboard).
async function deletionUserIds() {
  const rows = await DeletionRequest.findAll({
    where: { status: { [Op.in]: DELETION_STATUSES } },
    attributes: ['userId'],
    raw: true,
  });
  return rows.map((row) => row.userId).filter(Boolean);
}

function notDeleted(ids) {
  return ids.length ? { id: { [Op.notIn]: ids } } : {};
}

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

function baseWhere(query, deletionIds = []) {
  let where;
  switch (query.accountStatus) {
    case 'active': where = { ...ACTIVE_BUCKET }; break;
    case 'suspended_temporary': where = { ...SUSPENDED_BUCKET }; break;
    case 'suspended_permanent': where = { ...BANNED_BUCKET }; break;
    // "with_violations" needs a relation check; Sequelize where on include is
    // awkward, so the list method applies it after fetching (documented).
    default: where = { role: PASSENGER_ROLE };
  }
  Object.assign(where, notDeleted(deletionIds));
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
  const deleted = await DeletionRequest.findOne({
    where: { userId: passengerId, status: { [Op.in]: DELETION_STATUSES } },
    attributes: ['id'],
  });
  if (deleted) throw ApiErrors.notFound('PASSENGER_NOT_FOUND');
  return user;
}

async function getStats() {
  const deletionIds = await deletionUserIds();
  const violationRows = await Penalty.findAll({ attributes: ['user_id'], group: ['user_id'], raw: true });
  const violationIds = violationRows.map((r) => r.user_id).filter(Boolean);
  const [total, active, suspendedTemporary, suspendedPermanent, withViolations] = await Promise.all([
    User.count({ where: { role: PASSENGER_ROLE, ...notDeleted(deletionIds) } }),
    User.count({ where: { ...ACTIVE_BUCKET, ...notDeleted(deletionIds) } }),
    User.count({ where: { ...SUSPENDED_BUCKET, ...notDeleted(deletionIds) } }),
    User.count({ where: { ...BANNED_BUCKET, ...notDeleted(deletionIds) } }),
    violationIds.length
      ? User.count({
        where: {
          role: PASSENGER_ROLE,
          id: {
            [Op.in]: violationIds,
            ...(deletionIds.length ? { [Op.notIn]: deletionIds } : {}),
          },
        },
      })
      : 0,
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
  const deletionIds = await deletionUserIds();
  let where = baseWhere(query, deletionIds);
  if (query.accountStatus === 'with_violations') {
    const violationRows = await Penalty.findAll({ attributes: ['user_id'], group: ['user_id'], raw: true });
    const ids = violationRows.map((r) => r.user_id).filter(Boolean);
    where = {
      ...where,
      id: {
        [Op.in]: ids,
        ...(deletionIds.length ? { [Op.notIn]: deletionIds } : {}),
      },
    };
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: [
      'id', 'fullName', 'phone', 'email', 'age', 'gender', 'status',
      'verificationStatus', 'isVerified', 'avgRating', 'createdat',
    ],
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
      phone_full: u.phone,
      email: u.email ?? null,
      age: u.age == null ? null : Number(u.age),
      gender: u.gender ?? null,
      account_status: u.status,
      status: u.status,
      verification_status: u.verificationStatus ?? null,
      is_verified: u.isVerified === true,
      avg_rating: Number(u.avgRating) || 0,
      completed_bookings: completedBy.get(u.id) || 0,
      cancelled_bookings: cancelledBy.get(u.id) || 0,
      complaints_against: complaintsBy.get(u.id) || 0,
      total_bookings: bookingsBy.get(u.id) || 0,
      created_at: u.createdAt ?? u.createdat,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function exportPassengers(query = {}) {
  const deletionIds = await deletionUserIds();
  let where = baseWhere(query, deletionIds);
  if (query.accountStatus === 'with_violations') {
    const violationRows = await Penalty.findAll({ attributes: ['user_id'], group: ['user_id'], raw: true });
    const ids = violationRows.map((r) => r.user_id).filter(Boolean);
    where = {
      ...where,
      id: {
        [Op.in]: ids,
        ...(deletionIds.length ? { [Op.notIn]: deletionIds } : {}),
      },
    };
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
  const [totalBookings, completedBookings, cancelledBookings, lastBooking, ratingAgg, ratingsCount, profile] = await Promise.all([
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
    PassengerProfile.findOne({ where: { passengerId } }),
  ]);
  return {
    personal_info: {
      id: user.id,
      full_name: user.fullName,
      phone: maskPhone(user.phone),
      phone_full: user.phone,
      email: user.email ?? null,
      age: user.age != null ? Number(user.age) : null,
      gender: user.gender,
      city: null,
      account_status: user.status,
      verification_status: user.verificationStatus ?? null,
      is_verified: user.isVerified === true,
      profile_complete: Boolean(profile && profile.nationalID && profile.homeAddress),
      national_id: profile?.nationalID ?? null,
      home_address: profile?.homeAddress ?? null,
      registration_date: user.createdAt ?? user.createdat,
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

const PASSENGER_ADMIN_ACTION_TITLES = {
  role_changed: 'تغيير دور الحساب',
  status_changed: 'تحديث حالة الحساب',
  profile_updated: 'تحديث بيانات الحساب',
  account_deleted: 'حذف الحساب',
  deletion_request_approved: 'اعتماد طلب حذف الحساب',
  deletion_request_rejected: 'رفض طلب حذف الحساب',
  standing_action: 'إجراء إداري على الحساب',
  verification_approved: 'اعتماد توثيق الحساب',
  verification_rejected: 'رفض توثيق الحساب',
};

function passengerAdminActionReason(meta) {
  if (!meta) return 'تم تنفيذ إجراء إداري من لوحة التحكم.';
  if (meta.reason) return String(meta.reason);
  const after = meta.after && typeof meta.after === 'object' ? meta.after : null;
  if (after && after.role) {
    return `تغيير الدور: ${after.role.from || '—'} ← ${after.role.to || '—'}`;
  }
  if (after && after.status) {
    return `تغيير الحالة: ${after.status.from || '—'} ← ${after.status.to || '—'}`;
  }
  if (after && typeof after === 'object') {
    const fields = Object.keys(after);
    if (fields.length) return `تحديث الحقول: ${fields.join('، ')}`;
  }
  return 'تم تنفيذ إجراء إداري من لوحة التحكم.';
}

async function getAccountLog(passengerId) {
  await getPassengerOrThrow(passengerId);
  const [penalties, complaints, adminActions, deletionRequests] = await Promise.all([
    Penalty.findAll({ where: { userId: passengerId }, order: [['startsAt', 'DESC']] }),
    Complaint.findAll({
      where: { [Op.or]: [{ reporterId: passengerId }, { accusedId: passengerId }] },
      order: [['createdat', 'DESC']],
    }),
    adminAuditService.listForUser(passengerId),
    DeletionRequest.findAll({ where: { userId: passengerId }, order: [['createdat', 'DESC']] }),
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
    ...adminActions.map((row) => {
      const meta = row.newData || {};
      const action = meta.action || row.action;
      return {
        id: row.id,
        title: PASSENGER_ADMIN_ACTION_TITLES[action] || 'إجراء إداري',
        reason: passengerAdminActionReason(meta),
        related_trip_id: null,
        date: row.createdAt ?? row.createdat,
        type: 'admin_action',
        action,
        status: 'resolved',
      };
    }),
    ...deletionRequests.map((request) => ({
      id: request.id,
      title: 'طلب حذف الحساب',
      reason: request.reason || '—',
      related_trip_id: null,
      date: request.createdAt ?? request.createdat,
      type: 'deletion_request',
      status: request.status,
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
      admin_actions: adminActions.length,
      deletion_requests: deletionRequests.length,
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
      preferred_date: r.originTime || r.arrivalDeadline || null,
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
  const bookingIds = [...new Set(rows.map((row) => row.bookingId).filter(Boolean))];
  const tripsByBooking = new Map();
  if (bookingIds.length > 0) {
    const bookings = await Booking.findAll({
      where: { id: { [Op.in]: bookingIds } },
      attributes: ['id'],
      include: [{ model: Trip, as: 'trip', attributes: ['id', 'originCity', 'destinationCity'] }],
    });
    for (const booking of bookings) {
      if (booking.trip) {
        tripsByBooking.set(booking.id, {
          id: booking.trip.id,
          route: `${booking.trip.originCity} ← ${booking.trip.destinationCity}`,
        });
      }
    }
  }
  return {
    data: rows.map((c) => ({
      id: c.id,
      complaint_no: c.id,
      direction: c.reporterId === passengerId ? 'filed' : 'against',
      other_party: c.reporterId === passengerId ? c.accused : c.reporter,
      reason: c.category,
      description: c.description,
      trip: c.bookingId ? tripsByBooking.get(c.bookingId) || null : null,
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
  const [avg, withComment] = await Promise.all([
    Rating.aggregate('stars', 'avg', { where }),
    Rating.count({ where: { ...where, review: { [Op.ne]: null } } }),
  ]);
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
    summary: {
      total: count,
      average: avg != null ? Number(avg) : 0,
      with_comment: withComment,
      without_comment: count - withComment,
    },
    pagination: buildPagination(count, page, limit),
  };
}

async function sendNotification(adminId, passengerId, dto) {
  const passenger = await getPassengerOrThrow(passengerId);
  const results = await notificationService.sendToUser(passenger, 'ADMIN_NOTICE', {
    channels: ['in_app', 'push'],
    vars: { title: dto.title, body: dto.body },
    data: { category: dto.type || 'general', sent_by: adminId },
  });
  const inApp = results?.in_app;
  const notificationId = inApp && inApp.id ? inApp.id : null;
  return {
    notification: {
      id: notificationId,
      user_id: passengerId,
      title: dto.title,
      category: dto.type || 'general',
      created_at: inApp?.createdat || inApp?.createdAt || new Date().toISOString(),
    },
    delivery: {
      in_app: Boolean(notificationId),
      push: results?.push === true,
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
    if (['suspended', 'banned'].includes(user.status)) {
      throw ApiErrors.conflict('PASSENGER_ALREADY_IN_STATE');
    }
    await penaltyService.issue(adminId, {
      user_id: passengerId,
      type: 'suspension',
      reason: 'Suspended by administrator from the dashboard',
      allow_open_suspension: true,
    });
    await user.reload();
  } else {
    await user.update({ status: 'active' });
    await Penalty.update(
      { endsAt: new Date() },
      { where: { userId: passengerId, type: { [Op.in]: ['suspension', 'ban'] }, endsAt: null } }
    );
    try {
      await notificationService.sendToUser(user, 'ACCOUNT_REACTIVATED', {
        channels: ['in_app', 'push', 'sms'],
        data: { action, source: 'admin_dashboard' },
      });
    } catch (err) {
      console.warn('[adminPassengerService] reactivation notification failed:', err.message);
    }
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
