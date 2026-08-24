const { Trip, TripSeat } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { acquireSeatLock, checkSeatLock, releaseSeatLock } = require('../utils/seatLock');
const { TRIP_STATUS, SEAT_TYPE } = require('../config/constants');
const auditService = require('./auditService');

/**
 * Lock a seat for a passenger during booking
 */
const lockSeat = async (tripId, seatNumber, passengerId) => {
  // Verify trip exists and is published
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.status !== TRIP_STATUS.PUBLISHED) {
    throw ApiErrors.validation('TRIP_IS_NOT_AVAILABLE_FOR_BOOKING');
  }

  // Verify seat exists and is available
  const seat = await TripSeat.findOne({
    where: { tripId, seatNumber },
  });
  if (!seat) throw ApiErrors.notFound('SEAT_NOT_FOUND');
  if (seat.seatType !== SEAT_TYPE.AVAILABLE) {
    throw ApiErrors.validation('SEAT_IS_NOT_AVAILABLE_FOR_BOOKING');
  }

  // Check if already locked by someone else
  const existingLock = await checkSeatLock(tripId, seatNumber);
  if (existingLock.locked && existingLock.passengerId !== passengerId) {
    throw ApiErrors.conflict('SEAT_ALREADY_LOCKED_BY_ANOTHER_PASSENGER');
  }

  // Try to acquire lock
  const result = await acquireSeatLock(tripId, seatNumber, passengerId);
  if (!result.locked) {
    throw ApiErrors.conflict('COULD_NOT_ACQUIRE_SEAT_LOCK');
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
  releaseSeat,
};
