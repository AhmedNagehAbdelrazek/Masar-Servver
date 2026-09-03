"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_SOS_STATUSES = exports.ESCALATION_AFTER_MS = exports.RE_ALERT_INTERVAL_MS = void 0;
exports.trigger = trigger;
exports.listAdmin = listAdmin;
exports.acknowledge = acknowledge;
exports.resolve = resolve;
exports.runEscalation = runEscalation;
exports.findActiveForUser = findActiveForUser;
exports.serialize = serialize;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const pagination_1 = require("../utils/pagination");
const realtimeService_1 = __importDefault(require("./realtimeService"));
const realtimeMetrics_1 = __importDefault(require("./realtimeMetrics"));
const auditService_1 = __importDefault(require("./auditService"));
const constants_1 = require("../config/constants");
const ACTIVE_SOS_STATUSES = [constants_1.SOS_STATUS.PENDING, constants_1.SOS_STATUS.ACKNOWLEDGED];
exports.ACTIVE_SOS_STATUSES = ACTIVE_SOS_STATUSES;
const ACTIVE_TRIP_STATUSES = [constants_1.TRIP_STATUS.IN_PROGRESS, constants_1.TRIP_STATUS.ONGOING];
const RE_ALERT_INTERVAL_MS = 60 * 1000;
exports.RE_ALERT_INTERVAL_MS = RE_ALERT_INTERVAL_MS;
const ESCALATION_AFTER_MS = 5 * 60 * 1000;
exports.ESCALATION_AFTER_MS = ESCALATION_AFTER_MS;
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
    return Models_1.SosEvent.findOne({
        where: { userId, status: { [sequelize_1.Op.in]: ACTIVE_SOS_STATUSES } },
        order: [['createdat', 'DESC']],
    });
}
async function alertPayload(event) {
    const user = await Models_1.User.findByPk(event.userId, { attributes: ['id', 'fullName'] });
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
    const { tripId, lat, lng, urgency = constants_1.SOS_URGENCY.HIGH } = payload || {};
    if (!tripId)
        throw ApiError_1.ApiErrors.validation('TRIP_ID_IS_REQUIRED_FOR_SOS');
    if (lat === undefined || lng === undefined) {
        throw ApiError_1.ApiErrors.validation('LAT_AND_LNG_ARE_REQUIRED');
    }
    const member = await realtimeService_1.default.isTripMember(user, tripId);
    if (!member)
        throw ApiError_1.ApiErrors.forbidden('YOU_ARE_NOT_A_PARTICIPANT_OF_THIS_TRIP');
    const trip = await Models_1.Trip.findByPk(tripId, { attributes: ['id', 'status'] });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) {
        throw ApiError_1.ApiErrors.conflict('SOS_IS_ONLY_AVAILABLE_DURING_AN_ACTIVE_TRIP');
    }
    const active = await findActiveForUser(user.id);
    if (active) {
        return { sos_event_id: active.id, reused: true };
    }
    const event = await Models_1.SosEvent.create({
        userId: user.id,
        tripId,
        lat,
        lng,
        urgency,
        status: constants_1.SOS_STATUS.PENDING,
        escalationLevel: 0,
        lastAlertAt: new Date(),
    });
    const payloadOut = await alertPayload(event);
    realtimeService_1.default.emitToUser(user.id, 'sos:ack', {
        status: 'received',
        sos_event_id: event.id,
        assigned_support_id: null,
        timestamp: Date.now(),
    });
    realtimeService_1.default.emitToRole(constants_1.ROLES.ADMIN, 'sos:alert', payloadOut);
    realtimeService_1.default.emitToRole(constants_1.ROLES.ADMIN, 'admin:sos_alert', payloadOut);
    realtimeMetrics_1.default.recordEvent('sos:alert');
    realtimeMetrics_1.default.recordDelivery();
    return { sos_event_id: event.id, reused: false };
}
async function listAdmin(actor, { status, page, limit } = {}) {
    const where = {};
    if (status && constants_1.SOS_STATUS[status.toUpperCase()]) {
        where.status = status.toLowerCase();
    }
    const { page: p, limit: l, offset } = (0, pagination_1.parsePagination)({ page, limit });
    const { rows, count } = await Models_1.SosEvent.findAndCountAll({
        where,
        include: [{ model: Models_1.User, as: 'user', attributes: ['id', 'fullName'], required: false }],
        order: [['createdat', 'DESC']],
        offset,
        limit: l,
    });
    return {
        data: rows.map((r) => serialize(r, r.user)),
        pagination: (0, pagination_1.buildPagination)(count, p, l),
    };
}
async function acknowledge(actor, sosId) {
    const event = await Models_1.SosEvent.findByPk(sosId);
    if (!event)
        throw ApiError_1.ApiErrors.notFound('SOS_EVENT_NOT_FOUND');
    if (event.status === constants_1.SOS_STATUS.RESOLVED || event.status === constants_1.SOS_STATUS.CANCELLED) {
        throw ApiError_1.ApiErrors.conflict('SOS_EVENT_IS_ALREADY_CLOSED');
    }
    if (event.status !== constants_1.SOS_STATUS.ACKNOWLEDGED) {
        await event.update({
            status: constants_1.SOS_STATUS.ACKNOWLEDGED,
            acknowledgedBy: actor.id,
            acknowledgedAt: new Date(),
        });
    }
    auditService_1.default.track({
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
    const event = await Models_1.SosEvent.findByPk(sosId);
    if (!event)
        throw ApiError_1.ApiErrors.notFound('SOS_EVENT_NOT_FOUND');
    if (event.status === constants_1.SOS_STATUS.RESOLVED || event.status === constants_1.SOS_STATUS.CANCELLED) {
        throw ApiError_1.ApiErrors.conflict('SOS_EVENT_IS_ALREADY_CLOSED');
    }
    const resolvedAt = new Date();
    await event.update({
        status: constants_1.SOS_STATUS.RESOLVED,
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
    realtimeService_1.default.emitToUser(event.userId, 'sos:resolved', out);
    realtimeService_1.default.emitToRole(constants_1.ROLES.ADMIN, 'sos:resolved', out);
    realtimeMetrics_1.default.recordEvent('sos:resolved');
    auditService_1.default.track({
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
    const events = await Models_1.SosEvent.findAll({
        where: { status: { [sequelize_1.Op.in]: ACTIVE_SOS_STATUSES } },
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
            realtimeService_1.default.emitToRole(constants_1.ROLES.ADMIN, 'sos:alert', payloadOut);
            realtimeService_1.default.emitToRole(constants_1.ROLES.ADMIN, 'admin:sos_alert', payloadOut);
            realtimeMetrics_1.default.recordEvent('sos:realert');
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
exports.default = module.exports;
//# sourceMappingURL=sosService.js.map