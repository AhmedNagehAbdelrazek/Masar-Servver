"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_TRIP_STATUSES = void 0;
exports.updateLocation = updateLocation;
exports.startTracking = startTracking;
exports.stopTracking = stopTracking;
exports.getLatest = getLatest;
exports.getHistory = getHistory;
// @ts-nocheck
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const realtimeService_1 = __importDefault(require("./realtimeService"));
const realtimeMetrics_1 = __importDefault(require("./realtimeMetrics"));
const constants_1 = require("../config/constants");
const ACTIVE_TRIP_STATUSES = [constants_1.TRIP_STATUS.IN_PROGRESS, constants_1.TRIP_STATUS.ONGOING];
exports.ACTIVE_TRIP_STATUSES = ACTIVE_TRIP_STATUSES;
function serialize(point) {
    return {
        trip_id: point.tripId,
        driver_lat: Number(point.lat),
        driver_lng: Number(point.lng),
        speed: point.speed !== null && point.speed !== undefined ? Number(point.speed) : null,
        heading: point.heading !== null && point.heading !== undefined ? Number(point.heading) : null,
        status: 'en_route',
        eta_minutes: null,
        timestamp: point.createdat ? point.createdat.toISOString() : new Date().toISOString(),
    };
}
/**
 * Great-circle distance in km (Haversine) — used for a simple ETA estimate.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
async function assertDriverOfActiveTrip(user, tripId) {
    if (!tripId)
        throw ApiError_1.ApiErrors.validation('TRIP_ID_IS_REQUIRED');
    const trip = await Models_1.Trip.findByPk(tripId, {
        attributes: ['id', 'driverId', 'status', 'destinationLat', 'destinationLng'],
    });
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.driverId !== user.id)
        throw ApiError_1.ApiErrors.forbidden('ONLY_THE_TRIP_DRIVER_CAN_SHARE_TRACKING');
    if (!ACTIVE_TRIP_STATUSES.includes(trip.status)) {
        throw ApiError_1.ApiErrors.conflict('TRACKING_IS_ONLY_AVAILABLE_FOR_ACTIVE_TRIPS');
    }
    return trip;
}
async function updateLocation(user, payload) {
    const { tripId, lat, lng, speed, heading } = payload || {};
    if (lat === undefined || lng === undefined) {
        throw ApiError_1.ApiErrors.validation('LAT_AND_LNG_ARE_REQUIRED');
    }
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
        throw ApiError_1.ApiErrors.validation('LAT_AND_LNG_MUST_BE_NUMBERS');
    }
    const trip = await assertDriverOfActiveTrip(user, tripId);
    const point = await Models_1.TripLocation.create({
        tripId,
        driverId: user.id,
        lat,
        lng,
        speed: speed !== undefined ? speed : null,
        heading: heading !== undefined ? heading : null,
    });
    let etaMinutes = null;
    if (trip.destinationLat !== null &&
        trip.destinationLat !== undefined &&
        trip.destinationLng !== null &&
        trip.destinationLng !== undefined &&
        speed > 0) {
        const distKm = haversineKm(Number(lat), Number(lng), Number(trip.destinationLat), Number(trip.destinationLng));
        etaMinutes = Math.max(0, Math.round((distKm / Number(speed)) * 60));
    }
    const out = {
        trip_id: tripId,
        driver_lat: Number(lat),
        driver_lng: Number(lng),
        eta_minutes: etaMinutes,
        status: 'en_route',
        timestamp: point.createdat ? point.createdat.toISOString() : new Date().toISOString(),
    };
    realtimeService_1.default.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    realtimeMetrics_1.default.recordEvent('tracking:update');
    realtimeMetrics_1.default.recordDelivery();
    return out;
}
async function startTracking(user, tripId) {
    await assertDriverOfActiveTrip(user, tripId);
    const out = {
        trip_id: tripId,
        driver_lat: null,
        driver_lng: null,
        eta_minutes: null,
        status: 'en_route',
        timestamp: new Date().toISOString(),
    };
    realtimeService_1.default.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    realtimeMetrics_1.default.recordEvent('tracking:start');
    return out;
}
async function stopTracking(user, tripId) {
    await assertDriverOfActiveTrip(user, tripId);
    const out = {
        trip_id: tripId,
        driver_lat: null,
        driver_lng: null,
        eta_minutes: null,
        status: 'stopped',
        timestamp: new Date().toISOString(),
    };
    realtimeService_1.default.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    realtimeMetrics_1.default.recordEvent('tracking:stop');
    return out;
}
async function assertTripMember(user, tripId) {
    const member = await realtimeService_1.default.isTripMember(user, tripId);
    if (!member)
        throw ApiError_1.ApiErrors.forbidden('YOU_ARE_NOT_A_MEMBER_OF_THIS_TRIP');
}
async function getLatest(user, tripId) {
    if (!tripId)
        throw ApiError_1.ApiErrors.validation('TRIP_ID_IS_REQUIRED');
    await assertTripMember(user, tripId);
    const point = await Models_1.TripLocation.findOne({
        where: { tripId },
        order: [['createdat', 'DESC']],
    });
    return point ? serialize(point) : null;
}
async function getHistory(user, tripId, { limit = 50 } = {}) {
    if (!tripId)
        throw ApiError_1.ApiErrors.validation('TRIP_ID_IS_REQUIRED');
    await assertTripMember(user, tripId);
    const n = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const rows = await Models_1.TripLocation.findAll({
        where: { tripId },
        order: [['createdat', 'DESC']],
        limit: n,
    });
    return rows.map(serialize).reverse();
}
module.exports = {
    updateLocation,
    startTracking,
    stopTracking,
    getLatest,
    getHistory,
    ACTIVE_TRIP_STATUSES,
};
exports.default = module.exports;
//# sourceMappingURL=trackingService.js.map