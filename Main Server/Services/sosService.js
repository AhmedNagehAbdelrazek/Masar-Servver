const { Op } = require('sequelize');
const { SosEvent, User, Trip } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const realtimeService = require('./realtimeService');
const realtimeMetrics = require('./realtimeMetrics');
const auditService = require('./auditService');
const { SOS_STATUS, SOS_URGENCY, TRIP_STATUS, ROLES } = require('../config/constants');

const ACTIVE_SOS_STATUSES = [SOS_STATUS.PENDING, SOS_STATUS.ACKNOWLEDGED];
const ACTIVE_TRIP_STATUSES = [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING];
const RE_ALERT_INTERVAL_MS = 60 * 1000;
const ESCALATION_AFTER_MS = 5 * 60 * 1000;

function serialize(event, user = null) {
  return {
    id: event.id,
    user_id: event.userId,
    user_name: user ? user.fullName : null,
    trip_id: event.tripId,
    booking_id: event.bookingId || null,
    lat: Number(event.lat),
    lng: Number(event.lng),
    urgency: event.urgency,
    escalation_level: event.escalationLevel,
    status: event.status,
    triggered_at: event.createdat ? event.createdat.toISOString() : null,
  };
}

async function findActiveForUser(userId) {
  return SosEvent.findOne({
    where: { userId, status: { [Op.in]: ACTIVE_SOS_STATUSES } },
    order: [['createdat', 'DESC']],
  });
}

async function alertPayload(event) {
  const user = await User.findByPk(event.userId, { attributes: ['id', 'fullName'] });
  return {
    sos_event_id: event.id,
    user_id: event.userId,
    user_name: user ? user.fullName : null,
    trip_id: event.tripId,
    lat: Number(event.lat),
    lng: Number(event.lng),
    urgency: event.urgency,
    escalation_level: event.escalationLevel,
    triggered_at: event.createdat ? event.createdat.toISOString() : null,
    timestamp: Date.now(),
  };
}

/**
 * sos:trigger — creates (or reuses) an active SOS event for the trip and
 * broadcasts the alert to the admin room. Trip context is required and the
 * sender must be a confirmed participant of an active trip.
 */
async function trigger(user, payload) {
  const { tripId, lat, lng, urgency = SOS_URGENCY.HIGH } = payload || {};
  if (!tripId) throw ApiErrors.validation('trip_id is required for SOS');
  if (lat === undefined || lng === undefined) {
    throw ApiErrors.validation('lat and lng are required');
  }

  const member = await realtimeService.isTripMember(user, tripId);
  if (!member) throw ApiErrors.forbidden('You are not a participant of this trip');

  const trip = await Trip.findByPk(tripId, { attributes: ['id', 'status'] });
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) {
    throw ApiErrors.conflict('SOS is only available during an active trip');
  }

  const active = await findActiveForUser(user.id);
  if (active) {
    return { sos_event_id: active.id, reused: true };
  }

  const event = await SosEvent.create({
    userId: user.id,
    tripId,
    lat,
    lng,
    urgency,
    status: SOS_STATUS.PENDING,
    escalationLevel: 0,
    lastAlertAt: new Date(),
  });

  const payloadOut = await alertPayload(event);
  realtimeService.emitToUser(user.id, 'sos:ack', {
    status: 'received',
    sos_event_id: event.id,
    assigned_support_id: null,
    timestamp: Date.now(),
  });
  realtimeService.emitToRole(ROLES.ADMIN, 'sos:alert', payloadOut);
  realtimeService.emitToRole(ROLES.ADMIN, 'admin:sos_alert', payloadOut);
  realtimeMetrics.recordEvent('sos:alert');
  realtimeMetrics.recordDelivery();

  return { sos_event_id: event.id, reused: false };
}

async function listAdmin(actor, { status, page, limit } = {}) {
  const where = {};
  if (status && SOS_STATUS[status.toUpperCase()]) {
    where.status = status.toLowerCase();
  }
  const { page: p, limit: l, offset } = parsePagination({ page, limit });

  const { rows, count } = await SosEvent.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName'], required: false }],
    order: [['createdat', 'DESC']],
    offset,
    limit: l,
  });

  return {
    data: rows.map((r) => serialize(r, r.user)),
    pagination: buildPagination(count, p, l),
  };
}

async function acknowledge(actor, sosId) {
  const event = await SosEvent.findByPk(sosId);
  if (!event) throw ApiErrors.notFound('SOS event not found');
  if (event.status === SOS_STATUS.RESOLVED || event.status === SOS_STATUS.CANCELLED) {
    throw ApiErrors.conflict('SOS event is already closed');
  }
  if (event.status !== SOS_STATUS.ACKNOWLEDGED) {
    await event.update({
      status: SOS_STATUS.ACKNOWLEDGED,
      acknowledgedBy: actor.id,
      acknowledgedAt: new Date(),
    });
  }
  auditService.track({
    action: 'sos.acknowledge',
    resourceType: 'sos_event',
    resourceId: event.id,
    resourceLabel: 'sos_acknowledge',
    actorId: actor.id,
    payload: { tripId: event.tripId },
  });
  return { sos_event: serialize(event) };
}

async function resolve(actor, sosId, resolutionNote) {
  const event = await SosEvent.findByPk(sosId);
  if (!event) throw ApiErrors.notFound('SOS event not found');
  if (event.status === SOS_STATUS.RESOLVED || event.status === SOS_STATUS.CANCELLED) {
    throw ApiErrors.conflict('SOS event is already closed');
  }

  const resolvedAt = new Date();
  await event.update({
    status: SOS_STATUS.RESOLVED,
    resolvedBy: actor.id,
    resolutionNote: resolutionNote || null,
    resolvedAt,
  });

  const out = {
    sos_event_id: event.id,
    resolution: resolutionNote || 'Resolved',
    resolved_by: actor.id,
    resolved_at: resolvedAt.toISOString(),
    timestamp: Date.now(),
  };
  realtimeService.emitToUser(event.userId, 'sos:resolved', out);
  realtimeService.emitToRole(ROLES.ADMIN, 'sos:resolved', out);
  realtimeMetrics.recordEvent('sos:resolved');

  auditService.track({
    action: 'sos.resolve',
    resourceType: 'sos_event',
    resourceId: event.id,
    resourceLabel: 'sos_resolve',
    actorId: actor.id,
    payload: { tripId: event.tripId, resolutionNote },
  });

  return { sos_event: serialize(event) };
}

/**
 * Called by the escalation job every 60s: re-alerts unresolved events and
 * bumps escalation to high priority after 5 minutes.
 */
async function runEscalation() {
  const now = Date.now();
  const events = await SosEvent.findAll({
    where: { status: { [Op.in]: ACTIVE_SOS_STATUSES } },
  });

  let alerted = 0;
  let escalated = 0;
  for (const event of events) {
    const createdAt = event.createdat ? new Date(event.createdat).getTime() : now;
    let changed = false;

    if (event.escalationLevel === 0 && now - createdAt >= ESCALATION_AFTER_MS) {
      event.escalationLevel = 1;
      changed = true;
      escalated += 1;
    }

    const lastAlert = event.lastAlertAt ? new Date(event.lastAlertAt).getTime() : 0;
    if (now - lastAlert >= RE_ALERT_INTERVAL_MS) {
      event.lastAlertAt = new Date();
      changed = true;
      alerted += 1;
    }

    if (changed) {
      await event.save();
    }

    if (now - lastAlert >= RE_ALERT_INTERVAL_MS || event.escalationLevel === 1) {
      const payloadOut = await alertPayload(event);
      realtimeService.emitToRole(ROLES.ADMIN, 'sos:alert', payloadOut);
      realtimeService.emitToRole(ROLES.ADMIN, 'admin:sos_alert', payloadOut);
      realtimeMetrics.recordEvent('sos:realert');
    }
  }
  return { alerted, escalated };
}

module.exports = {
  trigger,
  listAdmin,
  acknowledge,
  resolve,
  runEscalation,
  findActiveForUser,
  serialize,
  RE_ALERT_INTERVAL_MS,
  ESCALATION_AFTER_MS,
  ACTIVE_SOS_STATUSES,
};
