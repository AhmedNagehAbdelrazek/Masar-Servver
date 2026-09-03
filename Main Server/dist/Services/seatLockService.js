"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseSeat = exports.lockSeat = void 0;
// @ts-nocheck
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const seatLock_1 = require("../utils/seatLock");
const constants_1 = require("../config/constants");
const auditService_1 = __importDefault(require("./auditService"));
/**
 * Lock a seat for a passenger during booking
 */
const lockSeat = async (tripId, seatNumber, passengerId) => {
    // Verify trip exists and is published
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.status !== constants_1.TRIP_STATUS.PUBLISHED) {
        throw ApiError_1.ApiErrors.validation('TRIP_IS_NOT_AVAILABLE_FOR_BOOKING');
    }
    // Verify seat exists and is available
    const seat = await Models_1.TripSeat.findOne({
        where: { tripId, seatNumber },
    });
    if (!seat)
        throw ApiError_1.ApiErrors.notFound('SEAT_NOT_FOUND');
    if (seat.seatType !== constants_1.SEAT_TYPE.AVAILABLE) {
        throw ApiError_1.ApiErrors.validation('SEAT_IS_NOT_AVAILABLE_FOR_BOOKING');
    }
    // Check if already locked by someone else
    const existingLock = await (0, seatLock_1.checkSeatLock)(tripId, seatNumber);
    if (existingLock.locked && existingLock.passengerId !== passengerId) {
        throw ApiError_1.ApiErrors.conflict('SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER');
    }
    // Try to acquire lock
    const result = await (0, seatLock_1.acquireSeatLock)(tripId, seatNumber, passengerId);
    if (!result.locked) {
        throw ApiError_1.ApiErrors.conflict('COULD_NOT_ACQUIRE_SEAT_LOCK');
    }
    trackSeatMutation({
        action: 'trip.seat.locked',
        passengerId,
        tripId,
        seatNumber,
    });
    return {
        lock_id: `${tripId}:${seatNumber}`,
        seat_number: seatNumber,
        expires_in: 300,
        message: 'SEAT_LOCKED_FIVE_MINUTES',
    };
};
exports.lockSeat = lockSeat;
/**
 * Audit a seat-lock mutation with the trip as the resource.
 */
function trackSeatMutation({ action, passengerId, tripId, seatNumber, payload = {} }) {
    auditService_1.default.track({
        action,
        resourceType: 'trip',
        resourceId: tripId,
        resourceLabel: `seat ${seatNumber}`,
        actorId: passengerId,
        actorType: 'passenger',
        payload: { seat_number: seatNumber, ...payload },
    });
}
/**
 * Release a seat lock
 */
const releaseSeat = async (tripId, seatNumber, passengerId) => {
    const existingLock = await (0, seatLock_1.checkSeatLock)(tripId, seatNumber);
    if (!existingLock.locked) {
        throw ApiError_1.ApiErrors.notFound('SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST');
    }
    if (existingLock.passengerId !== passengerId) {
        throw ApiError_1.ApiErrors.forbidden('CANNOT_RELEASE_LOCK_HELD_BY_ANOTHER_PASSENGER');
    }
    const released = await (0, seatLock_1.releaseSeatLock)(tripId, seatNumber);
    if (!released) {
        throw ApiError_1.ApiErrors.notFound('SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST');
    }
    trackSeatMutation({
        action: 'trip.seat.released',
        passengerId,
        tripId,
        seatNumber,
    });
    return { message: 'SEAT_LOCK_RELEASED' };
};
exports.releaseSeat = releaseSeat;
module.exports = {
    lockSeat,
    releaseSeat,
};
exports.default = module.exports;
//# sourceMappingURL=seatLockService.js.map