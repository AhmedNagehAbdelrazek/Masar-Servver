const { Trip, TripSeat } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { acquireSeatLock, checkSeatLock, releaseSeatLock } = require('../utils/seatLock');
const { TRIP_STATUS, SEAT_TYPE } = require('../config/constants');

/**
 * Lock a seat for a passenger during booking
 */
const lockSeat = async (tripId, seatNumber, passengerId) => {
  // Verify trip exists and is published
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.status !== TRIP_STATUS.PUBLISHED) {
    throw ApiErrors.validation('Trip is not available for booking');
  }

  // Verify seat exists and is available
  const seat = await TripSeat.findOne({
    where: { tripId, seatNumber },
  });
  if (!seat) throw ApiErrors.notFound('Seat not found');
  if (seat.seatType !== SEAT_TYPE.AVAILABLE) {
    throw ApiErrors.validation('Seat is not available for booking');
  }

  // Check if already locked by someone else
  const existingLock = await checkSeatLock(tripId, seatNumber);
  if (existingLock.locked && existingLock.passengerId !== passengerId) {
    throw ApiErrors.conflict('Seat already locked by another passenger');
  }

  // Try to acquire lock
  const result = await acquireSeatLock(tripId, seatNumber, passengerId);
  if (!result.locked) {
    throw ApiErrors.conflict('Could not acquire seat lock');
  }

  return {
    lock_id: `${tripId}:${seatNumber}`,
    seat_number: seatNumber,
    expires_in: 300,
    message: 'Seat locked for 5 minutes',
  };
};

/**
 * Release a seat lock
 */
const releaseSeat = async (tripId, seatNumber, passengerId) => {
  const existingLock = await checkSeatLock(tripId, seatNumber);
  if (!existingLock.locked) {
    throw ApiErrors.notFound('Seat lock expired or does not exist');
  }
  if (existingLock.passengerId !== passengerId) {
    throw ApiErrors.forbidden('Cannot release lock held by another passenger');
  }

  const released = await releaseSeatLock(tripId, seatNumber);
  if (!released) {
    throw ApiErrors.notFound('Seat lock expired or does not exist');
  }

  return { message: 'Seat lock released' };
};

module.exports = {
  lockSeat,
  releaseSeat,
};
