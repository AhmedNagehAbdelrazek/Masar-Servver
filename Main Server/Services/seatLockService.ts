// @ts-nocheck
import { Trip, TripSeat } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { acquireSeatLock, checkSeatLock, releaseSeatLock } from '../utils/seatLock';
import { TRIP_STATUS, SEAT_TYPE } from '../config/constants';
import auditService from './auditService';

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

/**
 * Lock multiple seats atomically (all-or-nothing): if any seat is unavailable
 * or locked by someone else, nothing is locked and a 409 is thrown. On a
 * mid-loop acquire failure, already-acquired locks are rolled back.
 */
const lockSeats = async (tripId, seatNumbers, passengerId) => {
  const numbers = [...new Set((Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers]).map(Number))];
  if (numbers.length === 0 || numbers.some((n) => !Number.isInteger(n) || n < 1)) {
    throw ApiErrors.validation('SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS');
  }

  // Verify trip exists and is published
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.status !== TRIP_STATUS.PUBLISHED) {
    throw ApiErrors.validation('TRIP_IS_NOT_AVAILABLE_FOR_BOOKING');
  }

  // Verify every seat exists and is available
  const { Op } = require('sequelize');
  const rows = await TripSeat.findAll({
    where: { tripId, seatNumber: { [Op.in]: numbers } },
  });
  if (rows.length !== numbers.length) throw ApiErrors.notFound('SEAT_NOT_FOUND');
  for (const seat of rows) {
    if (seat.seatType !== SEAT_TYPE.AVAILABLE) {
      throw ApiErrors.validation('SEAT_IS_NOT_AVAILABLE_FOR_BOOKING');
    }
  }

  // Verify none is locked by someone else
  for (const n of numbers) {
    const existingLock = await checkSeatLock(tripId, n);
    if (existingLock.locked && existingLock.passengerId !== passengerId) {
      throw ApiErrors.conflict('SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER');
    }
  }

  // Acquire all; roll back on any failure
  const acquired = [];
  for (const n of numbers) {
    const result = await acquireSeatLock(tripId, n, passengerId);
    if (!result.locked) {
      for (const done of acquired) {
        try {
          await releaseSeatLock(tripId, done);
        } catch (_err) {
          // best-effort rollback
        }
      }
      throw ApiErrors.conflict('COULD_NOT_ACQUIRE_SEAT_LOCK');
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

/**
 * Audit a seat-lock mutation with the trip as the resource.
 */
function trackSeatMutation({ action, passengerId, tripId, seatNumber, payload = {} }) {
  auditService.track({
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
  const existingLock = await checkSeatLock(tripId, seatNumber);
  if (!existingLock.locked) {
    throw ApiErrors.notFound('SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST');
  }
  if (existingLock.passengerId !== passengerId) {
    throw ApiErrors.forbidden('CANNOT_RELEASE_LOCK_HELD_BY_ANOTHER_PASSENGER');
  }

  const released = await releaseSeatLock(tripId, seatNumber);
  if (!released) {
    throw ApiErrors.notFound('SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST');
  }

  trackSeatMutation({
    action: 'trip.seat.released',
    passengerId,
    tripId,
    seatNumber,
  });

  return { message: 'SEAT_LOCK_RELEASED' };
};

module.exports = {
  lockSeat,
  lockSeats,
  releaseSeat,
};
export { lockSeat, lockSeats, releaseSeat };
export default module.exports;