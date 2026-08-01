const { Op } = require('sequelize');
const { Booking, Trip, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { maskPhone } = require('../utils/masking');

function serializeListRow(booking) {
  return {
    id: booking.id,
    passenger_name: booking.passenger ? booking.passenger.fullName : null,
    passenger_phone: maskPhone(booking.passenger ? booking.passenger.phone : null),
    seats_booked: booking.seatsBooked,
    agreed_fare: Number(booking.agreedFare),
    status: booking.status,
    reference_code: booking.referenceCode,
    booking_created_at: booking.createdat || booking.createdAt,
    trip_id: booking.tripId,
    dropoff_place: booking.dropoffPlace,
  };
}

function serializeDetail(booking) {
  return {
    id: booking.id,
    passenger_name: booking.passenger ? booking.passenger.fullName : null,
    passenger_phone: maskPhone(booking.passenger ? booking.passenger.phone : null),
    seats_booked: booking.seatsBooked,
    seat_number: booking.seatNumber,
    agreed_fare: Number(booking.agreedFare),
    status: booking.status,
    payment_status: booking.paymentStatus,
    reference_code: booking.referenceCode,
    cancellation_reason: booking.cancellationReason,
    cancelled_at: booking.cancelledAt,
    dropoff_place: booking.dropoffPlace,
    trip: booking.trip
      ? {
          id: booking.trip.id,
          origin_city: booking.trip.originCity,
          destination_city: booking.trip.destinationCity,
          departure_time: booking.trip.departureTime,
        }
      : null,
  };
}

/**
 * List bookings on the driver's own trips (contract D3). Bookings from other
 * drivers' trips are filtered silently — never returned.
 */
async function listForDriver(driverId, filters = {}) {
  const { status, date_from, date_to } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const bookingWhere = {};
  if (status) bookingWhere.status = status;
  if (date_from || date_to) {
    bookingWhere.createdat = {};
    if (date_from) bookingWhere.createdat[Op.gte] = new Date(date_from);
    if (date_to) bookingWhere.createdat[Op.lte] = new Date(new Date(date_to).setHours(23, 59, 59, 999));
  }

  const { rows, count } = await Booking.findAndCountAll({
    where: bookingWhere,
    include: [
      { model: Trip, as: 'trip', where: { driverId }, attributes: ['id'] },
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map(serializeListRow),
    pagination: buildPagination(count, page, limit),
  };
}

/**
 * Get a single booking on the driver's own trip (contract D4).
 */
async function getForDriver(driverId, bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Trip, as: 'trip', attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'departureTime'] },
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] },
    ],
  });
  if (!booking) throw ApiErrors.notFound('Booking not found');
  if (!booking.trip || booking.trip.driverId !== driverId) {
    throw ApiErrors.forbidden('You can only view bookings on your own trips');
  }

  return { booking: serializeDetail(booking) };
}

module.exports = { listForDriver, getForDriver };
