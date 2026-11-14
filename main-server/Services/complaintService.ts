// @ts-nocheck
import { Op } from 'sequelize';
import { Booking, Complaint, Penalty, Rating, Trip, User, AuditLog } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { COMPLAINT_STATUS, BOOKING_STATUS, TRIP_STATUS } from '../config/constants';
import { parsePagination, buildPagination } from '../utils/pagination';
import { maskPhone } from '../utils/masking';
import * as penaltyService from './penaltyService';
import auditService from './auditService';
import { daysAgo, percentChange } from '../utils/statChange';

function serializeCreate(complaint) {
  return {
    id: complaint.id,
    accused_id: complaint.accusedId,
    category: complaint.category,
    status: complaint.status,
    created_at: complaint.createdat || complaint.createdAt,
  };
}

function serializeAdmin(complaint, lastAction = null) {
  return {
    id: complaint.id,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    last_action: lastAction,
    reporter_name: complaint.reporter ? complaint.reporter.fullName : null,
    accused_name: complaint.accused ? complaint.accused.fullName : null,
    booking_id: complaint.bookingId,
    evidence_urls: complaint.evidenceUrls,
    created_at: complaint.createdat || complaint.createdAt,
  };
}

// The dashboard presents the complaint status as "the last action taken on it".
// Merge the audit trail and penalty rows into one ordered list per complaint so
// lists and the detail page can render that without another round trip.
function emptyLastAction() {
  return { event: 'filed', at: null, by: null, reason: null, action: null, note: null };
}

function newestOf(current, candidate) {
  if (!current || !current.at) return candidate;
  return new Date(candidate.at).getTime() >= new Date(current.at).getTime() ? candidate : current;
}

async function loadLastActions(complaintIds) {
  const map = new Map();
  if (!complaintIds.length) return map;
  const [logs, penalties] = await Promise.all([
    AuditLog.findAll({
      where: { tableName: 'complaints', recordId: { [Op.in]: complaintIds } },
      order: [['createdat', 'ASC']],
    }),
    Penalty.findAll({
      where: { complaintId: { [Op.in]: complaintIds } },
      order: [['startsAt', 'ASC']],
    }),
  ]);

  for (const id of complaintIds) map.set(id, emptyLastAction());
  for (const entry of logs) {
    const data = entry.newData || {};
    map.set(entry.recordId, newestOf(map.get(entry.recordId), {
      event: data.action_type ? 'penalty' : (data.event || 'updated'),
      at: entry.createdat,
      by: entry.performedBy ? { id: entry.performedBy, name: null } : null,
      reason: data.reason || null,
      action: data.action_type || null,
      note: data.note || null,
    }));
  }
  for (const row of penalties) {
    map.set(row.complaintId, newestOf(map.get(row.complaintId), {
      event: 'penalty',
      at: row.startsAt,
      by: row.issuedBy ? { id: row.issuedBy, name: null } : null,
      reason: row.reason || null,
      action: row.type,
      note: null,
    }));
  }
  return map;
}

function serializeDriver(complaint, direction) {
  return {
    id: complaint.id,
    category: complaint.category,
    description: complaint.description,
    status: complaint.status,
    direction,
    other_party:
      direction === 'filed'
        ? (complaint.accused ? complaint.accused.fullName : null)
        : (complaint.reporter ? complaint.reporter.fullName : null),
    evidence_urls: complaint.evidenceUrls,
    created_at: complaint.createdat || complaint.createdAt,
  };
}

/**
 * File a complaint (contract S1). Idempotent: skips creation when an open
 * complaint already matches the same reporter/accused/booking/category.
 */
async function create(reporterId, data) {
  const accused = await User.findByPk(data.accused_id);
  if (!accused) throw ApiErrors.notFound('ACCUSED_USER_NOT_FOUND');

  const existing = await Complaint.findOne({
    where: {
      reporterId,
      accusedId: data.accused_id,
      bookingId: data.booking_id || null,
      category: data.category,
      status: COMPLAINT_STATUS.OPEN,
    },
  });
  if (existing) {
    return { complaint: serializeCreate(existing), already_filed: true };
  }

  // Driver no-show complaints are tied to a completed booking. The passenger
  // must be the booking passenger and must not have been confirmed as riding.
  if (data.booking_id && data.category === 'no_show') {
    const booking = await Booking.findByPk(data.booking_id, {
      include: [{ model: Trip, as: 'trip', attributes: ['id', 'driverId', 'status'] }],
    });
    if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
    if (booking.trip && booking.trip.driverId === reporterId) {
      if (booking.passengerId !== data.accused_id) {
        throw ApiErrors.validation('ACCUSED_USER_MUST_BE_THE_BOOKING_PASSENGER');
      }
      if (booking.trip.status !== TRIP_STATUS.COMPLETED) {
        throw ApiErrors.custom(
          'TRIP_MUST_BE_COMPLETED_BEFORE_REPORTING_A_NO_SHOW',
          409,
          'TRIP_NOT_COMPLETED'
        );
      }
      const notOnTrip = booking.driverConfirmedOnTrip === false
        || booking.status === BOOKING_STATUS.NO_SHOW;
      if (!notOnTrip) {
        throw ApiErrors.custom(
          'PASSENGER_IS_NOT_MARKED_AS_NO_SHOW',
          409,
          'PASSENGER_IS_NOT_MARKED_AS_NO_SHOW'
        );
      }
    }
  }

  const complaint = await Complaint.create({
    bookingId: data.booking_id || null,
    reporterId,
    accusedId: data.accused_id,
    category: data.category,
    description: data.description,
    evidenceUrls: data.evidence_urls || [],
    status: COMPLAINT_STATUS.OPEN,
  });

  auditService.track({
    action: 'complaint.filed',
    resourceType: 'complaint',
    resourceId: complaint.id,
    actorId: reporterId,
    actorType: 'user',
    payload: {
      accused_id: data.accused_id,
      category: data.category,
      booking_id: data.booking_id || null,
    },
  });

  return { complaint: serializeCreate(complaint), already_filed: false };
}

/**
 * Driver view of complaints filed by or against them (contract D8).
 */
async function listForDriver(userId, filters = {}) {
  const { direction, status } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const where = {};
  if (direction === 'filed') where.reporterId = userId;
  else if (direction === 'against') where.accusedId = userId;
  else where[Op.or] = [{ reporterId: userId }, { accusedId: userId }];
  if (status) where.status = status;

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
    data: rows.map((c) => {
      const dir = c.reporterId === userId ? 'filed' : 'against';
      return serializeDriver(c, dir);
    }),
    pagination: buildPagination(count, page, limit),
  };
}

/**
 * Admin list of all complaints (contract A9).
 */
async function listAdmin(filters = {}) {
  const { status, category } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

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

  const lastActions = await loadLastActions(rows.map((row) => row.id));

  return {
    data: rows.map((row) => {
      const lastAction = lastActions.get(row.id) || emptyLastAction();
      if (!lastAction.at) {
        lastAction.at = row.createdat;
        lastAction.by = row.reporter ? { id: row.reporter.id, name: row.reporter.fullName } : null;
      }
      return serializeAdmin(row, lastAction);
    }),
    pagination: buildPagination(count, page, limit),
  };
}

/**
 * Admin complaint cards: total / open / reviewing / resolved / dismissed.
 */
async function getStats() {
  const [total, open, reviewing, resolved, dismissed] = await Promise.all([
    Complaint.count(),
    Complaint.count({ where: { status: COMPLAINT_STATUS.OPEN } }),
    Complaint.count({ where: { status: COMPLAINT_STATUS.REVIEWING } }),
    Complaint.count({ where: { status: COMPLAINT_STATUS.RESOLVED } }),
    Complaint.count({ where: { status: COMPLAINT_STATUS.DISMISSED } }),
  ]);
  const totalBefore = await Complaint.count({ where: { createdat: { [Op.lte]: daysAgo(7) } } });
  return {
    total_complaints: total,
    open,
    reviewing,
    resolved,
    dismissed,
    changes: {
      total_complaints: percentChange(total, totalBefore),
    },
  };
}

/**
 * Persist a complaint workflow event for the ticket timeline. AuditLog already
 * exists in both schemas, so reopening/resolving does not need a migration.
 */
async function recordComplaintEvent(complaintId, actorId, event, payload = {}) {
  try {
    await AuditLog.create({
      tableName: 'complaints',
      recordId: complaintId,
      action: 'UPDATE',
      newData: { event, ...payload },
      performedBy: actorId || null,
    });
  } catch (err) {
    console.warn('[complaintService] complaint event log failed:', err.message);
  }
}

/**
 * Admin complaint dossier: parties, linked trip, evidence, penalty and log.
 */
async function getDetail(complaintId) {
  const complaint = await Complaint.findByPk(complaintId, {
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'fullName', 'role', 'phone', 'createdat'] },
      {
        model: User,
        as: 'accused',
        attributes: ['id', 'fullName', 'role', 'phone', 'status', 'avgRating', 'createdat'],
      },
    ],
  });
  if (!complaint) throw ApiErrors.notFound('COMPLAINT_NOT_FOUND');

  const [booking, penalties, auditLogs] = await Promise.all([
    complaint.bookingId
      ? Booking.findByPk(complaint.bookingId, {
        include: [{
          model: Trip,
          as: 'trip',
          attributes: ['id', 'originCity', 'destinationCity', 'departureTime', 'totalSeats', 'availableSeats', 'farePerSeat', 'status'],
        }],
      })
      : null,
    Penalty.findAll({ where: { complaintId }, order: [['startsAt', 'DESC']] }),
    AuditLog.findAll({
      where: { tableName: 'complaints', recordId: complaintId },
      order: [['createdat', 'ASC']],
    }),
  ]);
  const penalty = penalties[0] || null;

  const actorIds = [...new Set([
    ...penalties.map((p) => p.issuedBy).filter(Boolean),
    ...auditLogs.map((entry) => entry.performedBy).filter(Boolean),
    complaint.resolvedBy,
  ].filter(Boolean))];
  const actors = actorIds.length
    ? await User.findAll({ where: { id: { [Op.in]: actorIds } }, attributes: ['id', 'fullName'] })
    : [];
  const actorById = new Map(actors.map((user) => [user.id, { id: user.id, name: user.fullName }]));
  const [reviewer, ratingsCount] = await Promise.all([
    complaint.resolvedBy ? User.findByPk(complaint.resolvedBy, { attributes: ['id', 'fullName'] }) : null,
    complaint.accusedId ? Rating.count({ where: { rateeId: complaint.accusedId } }) : 0,
  ]);

  const loggedPenaltyIds = new Set(
    auditLogs.map((entry) => (entry.newData || {}).penalty_id).filter(Boolean)
  );

  const history = [
    {
      event: 'filed',
      at: complaint.createdat,
      by: complaint.reporter ? { id: complaint.reporter.id, name: complaint.reporter.fullName } : null,
    },
    ...auditLogs.map((entry) => {
      const data = entry.newData || {};
      return {
        event: data.action_type ? 'penalty' : (data.event || 'updated'),
        at: entry.createdat,
        by: entry.performedBy ? actorById.get(entry.performedBy) || { id: entry.performedBy, name: null } : null,
        reason: data.reason || null,
        action: data.action_type || null,
        penalty_id: data.penalty_id || null,
        note: data.note || null,
      };
    }),
    ...penalties
      .filter((row) => !loggedPenaltyIds.has(row.id))
      .map((row) => ({
        event: 'penalty',
        at: row.startsAt,
        by: row.issuedBy ? actorById.get(row.issuedBy) || { id: row.issuedBy, name: null } : null,
        reason: row.reason,
        action: row.type,
        penalty_id: row.id,
        ends_at: row.endsAt,
      })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const lastEvent = history.length ? history[history.length - 1] : null;
  // A penalty is recorded as `resolved` in the audit log; the action type is
  // what the dashboard shows as the status, so surface it as a penalty event.
  const lastAction = lastEvent && lastEvent.event === 'resolved' && lastEvent.action
    ? { ...lastEvent, event: 'penalty' }
    : lastEvent;

  const log = [{ event: 'filed', at: complaint.createdat }];
  if (complaint.resolvedAt) {
    if (complaint.status === COMPLAINT_STATUS.REVIEWING || complaint.updatedat < complaint.resolvedAt) {
      log.push({ event: 'reviewing', at: complaint.updatedat });
    }
    log.push({ event: 'decided', at: complaint.resolvedAt, status: complaint.status });
  } else if (complaint.status === COMPLAINT_STATUS.REVIEWING) {
    log.push({ event: 'reviewing', at: complaint.updatedat });
  }

  return {
    complaint: {
      id: complaint.id,
      category: complaint.category,
      description: complaint.description,
      evidence_urls: complaint.evidenceUrls,
      status: complaint.status,
      resolution: complaint.resolution,
      created_at: complaint.createdat,
    },
    reporter: complaint.reporter
      ? { ...complaint.reporter.toJSON(), phone: maskPhone(complaint.reporter.phone) }
      : null,
    accused: complaint.accused
      ? {
        ...complaint.accused.toJSON(),
        phone: maskPhone(complaint.accused.phone),
        avg_rating: Number(complaint.accused.avgRating) || 0,
        ratings_count: ratingsCount,
      }
      : null,
    trip: booking?.trip
      ? {
        id: booking.trip.id,
        route: `${booking.trip.originCity} ← ${booking.trip.destinationCity}`,
        departure_time: booking.trip.departureTime,
        seats_booked: booking.seatsBooked,
        total_seats: Number(booking.trip.totalSeats),
        available_seats: Number(booking.trip.availableSeats),
        seat_price: Number(booking.trip.farePerSeat),
        status: booking.trip.status,
        booking_id: booking.id,
      }
      : null,
    penalty_action: complaint.accused
      ? { accused_id: complaint.accused.id, accused_status: complaint.accused.status }
      : null,
    review_result: complaint.resolvedAt != null
      ? {
        reviewed_by: reviewer,
        ended_at: complaint.resolvedAt,
        action: penalty
          ? {
            id: penalty.id,
            type: penalty.type,
            reason: penalty.reason,
            executed_by: penalty.issuedBy
              ? actorById.get(penalty.issuedBy) || { id: penalty.issuedBy, name: null }
              : null,
            executed_at: penalty.startsAt,
            ends_at: penalty.endsAt,
            active: !penalty.endsAt || new Date(penalty.endsAt) > new Date(),
          }
          : null,
      }
      : null,
    history,
    last_action: lastAction,
    log,
  };
}

async function penalize(adminId, complaintId, dto) {
  const complaint = await Complaint.findByPk(complaintId);
  if (!complaint) throw ApiErrors.notFound('COMPLAINT_NOT_FOUND');
  if (complaint.status === COMPLAINT_STATUS.DISMISSED) {
    throw ApiErrors.conflict('COMPLAINT_ALREADY_CLOSED');
  }

  let result;
  if (dto.kind === 'temporary') {
    const days = dto.durationDays != null
      ? Number(dto.durationDays)
      : dto.duration === 'custom'
        ? Number(dto.durationDays)
        : dto.duration != null
          ? ({ '1d': 1, '3d': 3, '7d': 7 })[dto.duration]
          : undefined;
    if (!days) throw ApiErrors.validation('DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
    result = await penaltyService.issue(adminId, {
      user_id: complaint.accusedId,
      type: 'suspension',
      reason: dto.reason,
      details: dto.notes || `Temporary suspension for ${days} day(s)`,
      complaint_id: complaintId,
      ends_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
    });
  } else if (dto.kind === 'permanent') {
    if (dto.confirmReviewedLog !== true) throw ApiErrors.validation('CONFIRM_REVIEWED_LOG_REQUIRED');
    result = await penaltyService.issue(adminId, {
      user_id: complaint.accusedId,
      type: 'ban',
      reason: dto.reason,
      details: dto.notes || null,
      complaint_id: complaintId,
      confirm_reviewed_log: true,
    });
  } else {
    result = await penaltyService.issue(adminId, {
      user_id: complaint.accusedId,
      type: 'warning',
      reason: dto.reason,
      details: dto.notes || null,
      complaint_id: complaintId,
    });
  }

  // An enforcement action is recorded on the ticket but does not close it:
  // the admin can issue another action (e.g. warning then suspension) before
  // explicitly closing the complaint.
  await complaint.update({
    status: COMPLAINT_STATUS.REVIEWING,
    resolution: null,
    resolvedBy: null,
    resolvedAt: null,
  });
  await recordComplaintEvent(complaintId, adminId, 'penalty', {
    reason: dto.reason,
    action_type: result?.penalty?.type || dto.kind,
    penalty_id: result?.penalty?.id || null,
    note: dto.notes || null,
  });

  return {
    ...result,
    complaint: {
      id: complaint.id,
      status: complaint.status,
      resolution: complaint.resolution,
      resolved_by: complaint.resolvedBy,
      resolved_at: complaint.resolvedAt,
    },
  };
}

/**
 * Admin resolve/dismiss a complaint (contract A10).
 */
async function resolve(adminId, complaintId, data) {
  const complaint = await Complaint.findByPk(complaintId);
  if (!complaint) throw ApiErrors.notFound('COMPLAINT_NOT_FOUND');

  const fields = { status: data.status };
  if (data.status === COMPLAINT_STATUS.RESOLVED) {
    fields.resolution = data.resolution;
    fields.resolvedBy = adminId;
    fields.resolvedAt = new Date();
  }
  if (data.status === COMPLAINT_STATUS.DISMISSED) {
    fields.resolution = data.resolution || 'Complaint dismissed';
    fields.resolvedBy = adminId;
    fields.resolvedAt = new Date();
  }

  await complaint.update(fields);
  if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.DISMISSED].includes(data.status)) {
    await recordComplaintEvent(complaintId, adminId, data.status === COMPLAINT_STATUS.DISMISSED ? 'dismissed' : 'resolved', {
      reason: fields.resolution || data.resolution || null,
    });
  } else if (data.status === COMPLAINT_STATUS.REVIEWING) {
    await recordComplaintEvent(complaintId, adminId, 'reviewing', {
      reason: data.resolution || null,
    });
  }

  return {
    complaint: {
      id: complaint.id,
      status: complaint.status,
      resolution: complaint.resolution,
      resolved_by: complaint.resolvedBy,
      resolved_at: complaint.resolvedAt,
    },
  };
}

/**
 * Reopen a decided ticket. The previous resolution stays in the event history;
 * the current row goes back to reviewing so the admin can act again.
 */
async function reopen(adminId, complaintId, reason) {
  const complaint = await Complaint.findByPk(complaintId);
  if (!complaint) throw ApiErrors.notFound('COMPLAINT_NOT_FOUND');
  if (![COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.DISMISSED].includes(complaint.status)) {
    throw ApiErrors.conflict('COMPLAINT_IS_NOT_RESOLVED');
  }

  const previousStatus = complaint.status;
  await complaint.update({
    status: COMPLAINT_STATUS.REVIEWING,
    resolution: null,
    resolvedBy: null,
    resolvedAt: null,
  });
  await recordComplaintEvent(complaintId, adminId, 'reopened', {
    reason: reason || 'Reopened by administrator',
    previous_status: previousStatus,
  });

  return {
    complaint: {
      id: complaint.id,
      status: complaint.status,
      resolution: complaint.resolution,
      resolved_by: complaint.resolvedBy,
      resolved_at: complaint.resolvedAt,
    },
  };
}

/**
 * Close a complaint without a penalty. Closing is a decision: the row moves to
 * `dismissed` and the event trail records who closed it, when, and why.
 */
async function close(adminId, complaintId, data = {}) {
  const complaint = await Complaint.findByPk(complaintId);
  if (!complaint) throw ApiErrors.notFound('COMPLAINT_NOT_FOUND');
  if ([COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.DISMISSED].includes(complaint.status)) {
    throw ApiErrors.conflict('COMPLAINT_ALREADY_CLOSED');
  }

  const reason = String(data.reason || data.resolution || '').trim() || 'Closed by administrator';
  const note = data.notes != null ? String(data.notes).trim() || null : null;
  const closedAt = new Date();
  await complaint.update({
    status: COMPLAINT_STATUS.DISMISSED,
    resolution: reason,
    resolvedBy: adminId,
    resolvedAt: closedAt,
  });
  await recordComplaintEvent(complaintId, adminId, 'dismissed', {
    reason,
    note,
    source: 'admin_close',
  });

  return {
    complaint: {
      id: complaint.id,
      status: complaint.status,
      resolution: complaint.resolution,
      resolved_by: complaint.resolvedBy,
      resolved_at: complaint.resolvedAt,
    },
  };
}

module.exports = { create, listForDriver, listAdmin, getStats, getDetail, penalize, resolve, close, reopen };
export { create, listForDriver, listAdmin, getStats, getDetail, penalize, resolve, close, reopen };
export default module.exports;