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
const notificationService_1 = __importDefault(require("./notificationService"));
const constants_1 = require("../config/constants");
const maps_1 = __importDefault(require("../config/maps"));
const redis_1 = require("../config/redis");
const redisKeys_1 = require("../utils/redisKeys");
const geo_1 = require("./geo");
// spec 013 (O6): tracking-eligible = in_progress ONLY. ongoing no longer opens rooms.
const ACTIVE_TRIP_STATUSES = [constants_1.TRIP_STATUS.IN_PROGRESS];
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
/* geo.haversineKm is used for the straight-line ETA estimate (O9). */
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
    // : batch and single share one ingester. Cap 60, skip stale/old
    // silently inside batches (offline replay), reject them on single sends.
    const batch = Array.isArray(payload && payload.points) ? payload.points.slice(0, maps_1.default.trackingBatchMaxPoints) : null;
    if (batch) {
        const kept = [];
        for (const p of batch) {
            try {
                kept.push(await ingestPoint(user, { tripId: payload.tripId || payload.trip_id, ...p }));
            }
            catch (_err) {
                // skip bad/stale points inside a batch
            }
        }
        return { trip_id: payload.tripId || payload.trip_id, received: batch.length, stored: kept.filter(Boolean).length };
    }
    return ingestPoint(user, payload);
}
function pointAgeMs(recordedAt) {
    if (!recordedAt)
        return 0;
    const t = new Date(recordedAt).getTime();
    if (Number.isNaN(t))
        return 0;
    return Date.now() - t;
}
async function ingestPoint(user, payload) {
    const tripId = payload && (payload.tripId || payload.trip_id);
    const { lat, lng, speed, heading } = payload || {};
    if (lat === undefined || lng === undefined) {
        throw ApiError_1.ApiErrors.validation('LAT_AND_LNG_ARE_REQUIRED');
    }
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
        throw ApiError_1.ApiErrors.validation('LAT_AND_LNG_MUST_BE_NUMBERS');
    }
    const ageMs = pointAgeMs(payload && (payload.recorded_at || payload.recordedAt));
    if (ageMs > maps_1.default.trackingMaxPointAgeSeconds * 1000) {
        throw ApiError_1.ApiErrors.custom('LOCATION_POINT_TOO_OLD', 422, 'LOCATION_POINT_TOO_OLD');
    }
    const trip = await assertDriverOfActiveTrip(user, tripId);
    // persist-before-broadcast (SSOT 8)
    const point = await Models_1.TripLocation.create({
        tripId,
        driverId: user.id,
        lat,
        lng,
        speed: speed !== undefined ? speed : null,
        heading: heading !== undefined ? heading : null,
        occurrenceDate: (payload && (payload.occurrence_date || payload.occurrenceDate)) || null,
    });
    const speedNum = Number(speed);
    const out = {
        trip_id: tripId,
        driver_lat: Number(lat),
        driver_lng: Number(lng),
        eta_minutes: null,
        status: 'en_route',
        timestamp: point.createdat ? point.createdat.toISOString() : new Date().toISOString(),
    };
    // Next pickup: first confirmed booking still awaiting boarding, in route order.
    const upcoming = await Models_1.Booking.findAll({
        where: { tripId, status: constants_1.BOOKING_STATUS.CONFIRMED },
        include: [{ model: Models_1.User, as: 'passenger', attributes: ['id', 'fullName'] }],
        order: [['pickupOrder', 'ASC']],
    });
    const pending = upcoming.filter((b) => ![constants_1.PICKUP_STATUS.PICKED_UP, constants_1.PICKUP_STATUS.MISSED].includes(b.pickupStatus));
    const next = pending[0] || null;
    if (next && next.pickupLat != null && speedNum > 0) {
        const distKm = (0, geo_1.haversineKm)(Number(lat), Number(lng), Number(next.pickupLat), Number(next.pickupLng));
        out.eta_minutes = Math.max(0, Math.round((distKm / speedNum) * 60));
    }
    else if (trip.destinationLat !== null &&
        trip.destinationLat !== undefined &&
        trip.destinationLng !== null &&
        trip.destinationLng !== undefined &&
        speedNum > 0) {
        const distKm = (0, geo_1.haversineKm)(Number(lat), Number(lng), Number(trip.destinationLat), Number(trip.destinationLng));
        out.eta_minutes = Math.max(0, Math.round((distKm / speedNum) * 60));
    }
    realtimeService_1.default.emitToRoom(`trip:${tripId}`, 'tracking:update', out);
    realtimeMetrics_1.default.recordEvent('tracking:update');
    realtimeMetrics_1.default.recordDelivery();
    // Driver guidance + per-passenger filtered ETA + once-per-booking proximity.
    try {
        await fanOut(user, trip, { lat: Number(lat), lng: Number(lng), speed: speedNum }, pending, next);
    }
    catch (err) {
        console.warn('[trackingService] fan-out failed:', err.message);
    }
    return out;
}
// : N small passenger rooms, not one payload per socket — the room
// fan-out stays O(passengers), and each passenger only ever sees their own ETA.
async function fanOut(driver, trip, pos, pending, next) {
    const remaining = pending.length;
    if (next && next.passenger) {
        realtimeService_1.default.emitToUser(driver.id, 'tracking:next_pickup', {
            trip_id: trip.id,
            booking_id: next.id,
            label: next.pickupLabel || next.pickupPlace || null,
            distance_m: next.pickupLat != null ? Math.round((0, geo_1.haversineM)(pos.lat, pos.lng, Number(next.pickupLat), Number(next.pickupLng))) : null,
            eta_minutes: null,
            remaining_count: remaining,
        });
    }
    for (const b of pending) {
        if (b.pickupLat == null || b.pickupLng == null || !b.passenger)
            continue;
        const distM = (0, geo_1.haversineM)(pos.lat, pos.lng, Number(b.pickupLat), Number(b.pickupLng));
        let eta = null;
        if (pos.speed > 0)
            eta = Math.max(0, Math.round(((distM / 1000) / pos.speed) * 60));
        realtimeService_1.default.emitToUser(b.passenger.id, 'tracking:update', {
            trip_id: trip.id,
            driver_lat: pos.lat,
            driver_lng: pos.lng,
            eta_minutes: eta,
            status: 'en_route',
            timestamp: new Date().toISOString(),
        });
        await proximityOnce(trip, b, distM);
    }
}
async function proximityOnce(trip, booking, distM) {
    const fire = async (kind, threshold, template, vars) => {
        if (distM > threshold)
            return;
        const key = redisKeys_1.REDIS_KEYS.PROXIMITY(booking.id, kind);
        let seen = null;
        try {
            seen = await (0, redis_1.getKey)(key);
        }
        catch {
            // redis offline — still notify, just possibly twice
        }
        if (seen)
            return;
        try {
            await (0, redis_1.setKey)(key, '1');
        }
        catch {
            // ignore
        }
        realtimeService_1.default.emitToUser(booking.passenger.id, 'tracking:proximity', { trip_id: trip.id, booking_id: booking.id, state: kind });
        try {
            await notificationService_1.default.sendToUser(booking.passenger, template, { channels: ['in_app', 'push'], vars, data: { trip_id: trip.id, booking_id: booking.id } });
        }
        catch (err) {
            console.warn('[trackingService] proximity notification failed:', err.message);
        }
    };
    await fire('near', maps_1.default.proximityNearMeters, 'DRIVER_NEARBY', { distance_m: Math.round(distM) });
    await fire('arrived', maps_1.default.proximityArrivedMeters, 'DRIVER_ARRIVED', {});
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
async function getHistory(user, tripId, { limit = 50, occurrenceDate = null } = {}) {
    if (!tripId)
        throw ApiError_1.ApiErrors.validation('TRIP_ID_IS_REQUIRED');
    await assertTripMember(user, tripId);
    const n = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const where = { tripId };
    if (occurrenceDate)
        where.occurrenceDate = occurrenceDate;
    const rows = await Models_1.TripLocation.findAll({
        where,
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