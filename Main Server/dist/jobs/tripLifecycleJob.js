"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTripLifecycle = runTripLifecycle;
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const tripService = __importStar(require("../Services/tripService"));
const notificationService_1 = __importDefault(require("../Services/notificationService"));
const homeService_1 = __importDefault(require("../Services/homeService"));
const auditService_1 = __importDefault(require("../Services/auditService"));
const seatLock_1 = require("../utils/seatLock");
const { completeTrip } = tripService;
// Trips that were started but never finished.
const STARTED_STATUSES = [constants_1.TRIP_STATUS.IN_PROGRESS, constants_1.TRIP_STATUS.ONGOING];
// Trips that never left the station.
const UNOPERATED_STATUSES = [constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL];
/**
 * Closes out stale trips whose assumed end
 * (departure + TRIP_DURATION_HOURS + TRIP_LIFECYCLE_GRACE_HOURS) is in the past.
 *
 * - Started trips (in_progress/ongoing) are auto-completed through the normal
 *   completeTrip flow (commission, bookings, notifications included).
 * - Never-operated trips (published/full) are marked cancelled and their
 *   CONFIRMED/PENDING bookings become NO_SHOW — the driver never showed up.
 *
 * Recurring series are excluded: their stored departureTime is the first
 * occurrence only, so per-occurrence ageing does not apply.
 * Everything is idempotent — only non-terminal statuses are touched.
 */
async function runTripLifecycle(context) {
    const result = { autoCompleted: [], expiredUnoperated: [], noShowBookings: 0, errors: [] };
    // NOTE: the scheduler invokes tasks as taskFn(context), so the first
    // argument is NOT a Date — always derive "now" internally.
    const now = context instanceof Date ? context : new Date();
    const cutoff = new Date(now.getTime() - (constants_1.TRIP_DURATION_HOURS + constants_1.TRIP_LIFECYCLE_GRACE_HOURS) * 60 * 60 * 1000);
    const stale = await Models_1.Trip.findAll({
        where: {
            isRecurring: false,
            departureTime: { [sequelize_1.Op.lte]: cutoff },
            status: { [sequelize_1.Op.in]: [...STARTED_STATUSES, ...UNOPERATED_STATUSES] },
        },
        attributes: ['id', 'driverId', 'status', 'departureTime'],
    });
    for (const trip of stale) {
        try {
            if (STARTED_STATUSES.includes(trip.status)) {
                await completeTrip(trip.driverId, trip.id);
                result.autoCompleted.push(trip.id);
                auditService_1.default.track({
                    action: 'trip.auto_completed',
                    resourceType: 'trip',
                    resourceId: trip.id,
                    actorId: trip.driverId,
                    actorType: 'system',
                    payload: { status: trip.status },
                });
            }
            else {
                result.noShowBookings += await expireUnoperatedTrip(trip);
                result.expiredUnoperated.push(trip.id);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.warn(`[tripLifecycleJob] trip ${trip.id} close-out failed:`, message);
            result.errors.push({ tripId: trip.id, message });
        }
    }
    if (stale.length > 0) {
        console.log(`[tripLifecycleJob] closed ${result.autoCompleted.length} completed + ${result.expiredUnoperated.length} unoperated (${result.noShowBookings} no-show bookings), ${result.errors.length} error(s)`);
    }
    return result;
}
async function expireUnoperatedTrip(trip) {
    await trip.update({ status: constants_1.TRIP_STATUS.CANCELLED });
    const bookings = await Models_1.Booking.findAll({
        where: { tripId: trip.id, status: { [sequelize_1.Op.in]: [constants_1.BOOKING_STATUS.CONFIRMED, constants_1.BOOKING_STATUS.PENDING] } },
    });
    for (const booking of bookings) {
        await booking.update({ status: constants_1.BOOKING_STATUS.NO_SHOW });
    }
    // Release any lingering seat locks so they never outlive the trip.
    try {
        const rows = await Models_1.TripSeat.findAll({
            where: { tripId: trip.id },
            attributes: ['seatNumber'],
        });
        for (const row of rows) {
            try {
                await (0, seatLock_1.releaseSeatLock)(trip.id, row.seatNumber);
            }
            catch {
                // best-effort per seat
            }
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[tripLifecycleJob] lock release failed for trip ${trip.id}:`, message);
    }
    try {
        await notificationService_1.default.notifyConfirmedPassengers([trip.id], 'TRIP_CANCELLED', { data: { trip_id: trip.id } });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[tripLifecycleJob] passenger notification failed:', message);
    }
    try {
        await homeService_1.default.invalidateHomeForTrip(trip.id, trip.driverId);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[tripLifecycleJob] home cache invalidation failed:', message);
    }
    auditService_1.default.track({
        action: 'trip.expired_unoperated',
        resourceType: 'trip',
        resourceId: trip.id,
        actorId: trip.driverId,
        actorType: 'system',
        payload: { no_show_bookings: bookings.length },
    });
    return bookings.length;
}
exports.default = { runTripLifecycle };
module.exports = { runTripLifecycle };
//# sourceMappingURL=tripLifecycleJob.js.map