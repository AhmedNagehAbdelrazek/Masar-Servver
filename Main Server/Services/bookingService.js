const { Op } = require('sequelize');
const { Booking, Trip, User, TripSeat, sequelize } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { maskPhone } = require('../utils/masking');
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  TRIP_STATUS,
  SEAT_TYPE,
  USER_STATUS,
} = require('../config/constants');
const { checkSeatLock, releaseSeatLock } = require('../utils/seatLock');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const { generateReferenceCode } = require('../utils/referenceCode');

function serializeListRow(booking) {
  return {
    id: booking.id,
    passenger_name: booking.passenger ? booking.passenger.fullName : null,
    passenger_phone: maskPhone(booking.passenger ? booking.passenger.phone : null),
    passenger_rating: booking.passenger ? Number(booking.passenger.avgRating) || 0 : null,
    seats_booked: booking.seatsBooked,
    agreed_fare: Number(booking.agreedFare),
    status: booking.status,
    reference_code: booking.referenceCode,
    booking_created_at: booking.createdat || booking.createdAt,
    trip_id: booking.tripId,
    trip: booking.trip
      ? {
          origin: booking.trip.originCity,
          destination: booking.trip.destinationCity,
          price: Number(booking.trip.farePerSeat),
        }
      : null,
    dropoff_place: booking.dropoffPlace,
  };
}

function serializeDetail(booking) {
  return {
    id: booking.id,
    passenger_name: booking.passenger ? booking.passenger.fullName : null,
    passenger_phone: maskPhone(booking.passenger ? booking.passenger.phone : null),
    passenger_rating: booking.passenger ? Number(booking.passenger.avgRating) || 0 : null,
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
          origin: booking.trip.originCity,
          destination: booking.trip.destinationCity,
          price: Number(booking.trip.farePerSeat),
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
      { model: Trip, as: 'trip', where: { driverId }, attributes: ['id', 'originCity', 'destinationCity', 'farePerSeat'] },
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'avgRating'] },
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
      { model: Trip, as: 'trip', attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'farePerSeat'] },
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'avgRating'] },
    ],
  });
  if (!booking) throw ApiErrors.notFound('Booking not found');
  if (!booking.trip || booking.trip.driverId !== driverId) {
    throw ApiErrors.forbidden('You can only view bookings on your own trips');
  }

  return { booking: serializeDetail(booking) };
}

// ===== PASSENGER-SIDE BOOKING FLOW (spec 009 US1) =====

async function uniqueBookingCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferenceCode('MSR');
    const existing = await Booking.findOne({ where: { referenceCode: code } });
    if (!existing) return code;
  }
  throw ApiErrors.serverError('Could not generate a unique reference code');
}

async function notifyDriver(trip, template, vars) {
  const driver = await User.findByPk(trip.driverId);
  if (driver) {
    await notificationService.sendToUser(driver, template, { channels: ['in_app', 'push'], vars });
  }
}

async function createBooking(passengerId, payload) {
  const { trip_id, seat_number, seats = 1, agreed_fare, dropoff_place, dropoff_deadline } = payload;

  const user = await User.findByPk(passengerId);
  if (!user) throw ApiErrors.notFound('User not found');
  if ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
    throw ApiErrors.forbidden('Account is suspended. You cannot book trips.');
  }

  const trip = await Trip.findByPk(trip_id);
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('Trip is already ongoing or completed');
  }

  if (Number(agreed_fare) !== Number(trip.farePerSeat)) {
    throw ApiErrors.validation('agreed_fare does not match the current trip fare');
  }

  const lockStatus = await checkSeatLock(trip_id, seat_number);
  if (!lockStatus.locked || lockStatus.passengerId !== passengerId) {
    throw ApiErrors.custom('Seat lock expired or not held', 404, 'SEAT_LOCK_EXPIRED');
  }

  const seat = await TripSeat.findOne({ where: { tripId: trip_id, seatNumber: seat_number } });
  if (!seat) throw ApiErrors.notFound('Seat not found on this trip');
  if (seat.seatType !== SEAT_TYPE.AVAILABLE) {
    throw ApiErrors.conflict('Seat already booked');
  }

  const referenceCode = await uniqueBookingCode();

  const booking = await sequelize.transaction(async (t) => {
    const freshTrip = await Trip.findByPk(trip_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(freshTrip.status)) {
      throw ApiErrors.conflict('Trip is already ongoing or completed');
    }

    const row = await Booking.create(
      {
        tripId: trip_id,
        passengerId,
        seatNumber: seat_number,
        seatsBooked: seats,
        agreedFare: agreed_fare,
        currency: 'JOD',
        dropoffPlace: dropoff_place || null,
        dropoffDeadline: dropoff_deadline ? new Date(dropoff_deadline) : null,
        status: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        referenceCode,
        cancelledBy: null,
      },
      { transaction: t }
    );

    const remainingSeats = freshTrip.availableSeats - seats;
    if (remainingSeats < 0) throw ApiErrors.conflict('Not enough available seats');

    freshTrip.availableSeats = remainingSeats;
    if (remainingSeats === 0 && freshTrip.status === TRIP_STATUS.PUBLISHED) {
      freshTrip.status = TRIP_STATUS.FULL;
    }
    await freshTrip.save({ transaction: t });

    seat.seatType = SEAT_TYPE.UNAVAILABLE;
    await seat.save({ transaction: t });

    return row;
  });

  auditService.track({
    action: 'booking.created',
    resourceType: 'booking',
    resourceId: booking.id,
    actorId: passengerId,
    actorType: 'passenger',
    payload: { trip_id, seat_number, reference_code: booking.referenceCode },
  });

  const routeLabel = `${trip.originCity} - ${trip.destinationCity}`;
  await Promise.allSettled([
    notificationService.sendToUser(user, 'BOOKING_CONFIRMED_PASSENGER', {
      channels: ['in_app', 'push'],
      vars: {
        reference_code: booking.referenceCode,
        origin: trip.originCity,
        destination: trip.destinationCity,
      },
    }),
    notifyDriver(trip, 'BOOKING_CONFIRMED_DRIVER', {
      passenger: user.fullName,
      seat_number: seat_number,
      route: routeLabel,
    }),
  ]);

  const fullTrip = await Trip.findByPk(trip_id, {
    include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating'] }],
  });
  return serializePassengerDetail(booking, fullTrip, user);
}

function serializePassengerDetail(booking, trip, passenger) {
  return {
    id: booking.id,
    reference_code: booking.referenceCode,
    status: booking.status,
    payment_status: booking.paymentStatus,
    seats_booked: booking.seatsBooked,
    seat_number: booking.seatNumber,
    agreed_fare: Number(booking.agreedFare),
    currency: booking.currency,
    dropoff_place: booking.dropoffPlace,
    dropoff_deadline: booking.dropoffDeadline,
    cancellation_reason: booking.cancellationReason,
    cancelled_at: booking.cancelledAt,
    completed_at: booking.completedAt,
    booking_created_at: booking.createdat || booking.createdAt,
    trip: trip
      ? {
          origin: trip.originCity,
          destination: trip.destinationCity,
          price: Number(trip.farePerSeat),
        }
      : null,
    driver:
      trip && trip.driver
        ? {
            id: trip.driver.id,
            full_name: trip.driver.fullName,
            phone_masked: maskPhone(trip.driver.phone),
            rating: Number(trip.driver.avgRating) || 0,
          }
        : null,
    passenger: passenger
      ? { id: passenger.id, full_name: passenger.fullName }
      : null,
  };
}

async function listForPassenger(passengerId, filters = {}) {
  const { status, trip_id } = filters;
  const { page, limit, offset } = parsePagination(filters);

  const where = { passengerId };
  if (status) where.status = status;
  if (trip_id) where.tripId = trip_id;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: [
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'farePerSeat'],
        include: [
          { model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating'] },
        ],
      },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map((b) => serializePassengerDetail(b, b.trip, null)),
    pagination: buildPagination(count, page, limit),
  };
}

async function getForPassenger(passengerId, bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'farePerSeat'],
        include: [
          { model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating'] },
        ],
      },
      { model: User, as: 'passenger', attributes: ['id', 'fullName'] },
    ],
  });
  if (!booking) throw ApiErrors.notFound('Booking not found');
  if (booking.passengerId !== passengerId) {
    throw ApiErrors.forbidden('You can only view your own bookings');
  }

  return { booking: serializePassengerDetail(booking, booking.trip, booking.passenger) };
}

async function cancelBooking(passengerId, bookingId) {
  const user = await User.findByPk(passengerId);
  if (!user) throw ApiErrors.notFound('User not found');

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'departureTime', 'availableSeats', 'status'],
      },
    ],
  });
  if (!booking) throw ApiErrors.notFound('Booking not found');
  if (booking.passengerId !== passengerId) {
    throw ApiErrors.forbidden('You can only cancel your own bookings');
  }
  if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
    throw ApiErrors.conflict('Booking is already completed or cancelled');
  }

  const departureTime = new Date(booking.trip.departureTime).getTime();
  const hoursUntilDeparture = (departureTime - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilDeparture < 1) {
    throw ApiErrors.custom(
      'Cancellations are allowed up to one hour before departure.',
      409,
      'CANCELLATION_WINDOW_CLOSED'
    );
  }

  await sequelize.transaction(async (t) => {
    await booking.update(
      {
        status: BOOKING_STATUS.CANCELLED,
        cancellationReason: 'cancelled_by_passenger',
        cancelledAt: new Date(),
        cancelledBy: passengerId,
      },
      { transaction: t }
    );

    const freshTrip = await Trip.findByPk(booking.tripId, { transaction: t, lock: t.LOCK.UPDATE });
    freshTrip.availableSeats += booking.seatsBooked;
    if (
      freshTrip.status === TRIP_STATUS.FULL &&
      freshTrip.availableSeats > 0 &&
      freshTrip.availableSeats <= freshTrip.totalSeats
    ) {
      freshTrip.status = TRIP_STATUS.PUBLISHED;
    }
    await freshTrip.save({ transaction: t });

    const seat = await TripSeat.findOne({
      where: { tripId: booking.tripId, seatNumber: booking.seatNumber },
      transaction: t,
    });
    if (seat) {
      seat.seatType = SEAT_TYPE.AVAILABLE;
      await seat.save({ transaction: t });
    }
  });

  if (booking.seatNumber !== null && booking.seatNumber !== undefined) {
    await releaseSeatLock(booking.tripId, booking.seatNumber).catch(() => {});
  }

  auditService.track({
    action: 'booking.cancelled',
    resourceType: 'booking',
    resourceId: booking.id,
    actorId: passengerId,
    actorType: 'passenger',
    payload: { trip_id: booking.tripId, reference_code: booking.referenceCode },
  });

  await notifyDriver(booking.trip, 'BOOKING_CANCELLED_DRIVER', {
    passenger: user.fullName,
    seat_number: booking.seatNumber,
    route: `${booking.trip.originCity} - ${booking.trip.destinationCity}`,
  });

  return { booking: { id: booking.id, status: booking.status, cancelled_at: booking.cancelledAt } };
}

module.exports = { listForDriver, getForDriver, createBooking, listForPassenger, getForPassenger, cancelBooking };
