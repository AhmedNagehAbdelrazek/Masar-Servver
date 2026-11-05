"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseSeat = exports.lockSeats = exports.lockSeat = void 0;
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
    const result = await lockSeats(tripId, [seatNumber], passengerId);
    return {
        lock_id: result.lock_ids[0],
        seat_number: result.seat_numbers[0],
        expires_in: result.expires_in,
        message: 'SEAT_LOCKED_FIVE_MINUTES',
    };
};
exports.lockSeat = lockSeat;
/**
 * Lock multiple seats atomically (all-or-nothing): if any seat is unavailable
 * or locked by someone else, nothing is locked and a 409 is thrown. On a
 * mid-loop acquire failure, already-acquired locks are rolled back.
 */
const lockSeats = async (tripId, seatNumbers, passengerId) => {
    const numbers = [...new Set((Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers]).map(Number))];
    if (numbers.length === 0 || numbers.some((n) => !Number.isInteger(n) || n < 1)) {
        throw ApiError_1.ApiErrors.validation('SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS');
    }
    // Verify trip exists and is published
    const trip = await Models_1.Trip.findByPk(tripId);
    if (!trip)
        throw ApiError_1.ApiErrors.notFound('TRIP_NOT_FOUND');
    if (trip.status !== constants_1.TRIP_STATUS.PUBLISHED) {
        throw ApiError_1.ApiErrors.validation('TRIP_IS_NOT_AVAILABLE_FOR_BOOKING');
    }
    // Verify every seat exists and is available
    const { Op } = require('sequelize');
    const rows = await Models_1.TripSeat.findAll({
        where: { tripId, seatNumber: { [Op.in]: numbers } },
    });
    if (rows.length !== numbers.length)
        throw ApiError_1.ApiErrors.notFound('SEAT_NOT_FOUND');
    for (const seat of rows) {
        if (seat.seatType !== constants_1.SEAT_TYPE.AVAILABLE) {
            throw ApiError_1.ApiErrors.validation('SEAT_IS_NOT_AVAILABLE_FOR_BOOKING');
        }
    }
    // Verify none is locked by someone else
    for (const n of numbers) {
        const existingLock = await (0, seatLock_1.checkSeatLock)(tripId, n);
        if (existingLock.locked && existingLock.passengerId !== passengerId) {
            throw ApiError_1.ApiErrors.conflict('SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER');
        }
    }
    // Acquire all; roll back on any failure
    const acquired = [];
    for (const n of numbers) {
        const result = await (0, seatLock_1.acquireSeatLock)(tripId, n, passengerId);
        if (!result.locked) {
            for (const done of acquired) {
                try {
                    await (0, seatLock_1.releaseSeatLock)(tripId, done);
                }
                catch (_err) {
                    // best-effort rollback
                }
            }
            throw ApiError_1.ApiErrors.conflict('COULD_NOT_ACQUIRE_SEAT_LOCK');
        }
        acquired.push(n);
    }
    trackSeatMutation({
        action: 'trip.seats.locked',
        passengerId,
        tripId,
        seatNumber: numbers.join(','),
    });
    return {
        lock_ids: numbers.map((n) => `${tripId}:${n}`),
        seat_numbers: numbers,
        expires_in: 300,
        message: 'SEATS_LOCKED_FIVE_MINUTES',
    };
};
exports.lockSeats = lockSeats;
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
    lockSeats,
    releaseSeat,
};
exports.default = module.exports;
//# sourceMappingURL=seatLockService.js.map