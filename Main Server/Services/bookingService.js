const { Op } = require('sequelize');
const { Booking, Trip, User, TripSeat, TripStop, Rating, Vehicle, DriverProfile, sequelize } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { maskPhone } = require('../utils/masking');
const { REDIS_KEYS } = require('../utils/redisKeys');
const { deleteKey } = require('../config/redis');
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  TRIP_STATUS,
  SEAT_TYPE,
  USER_STATUS,
  STOP_TYPE,
} = require('../config/constants');
const { checkSeatLock, releaseSeatLock } = require('../utils/seatLock');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const { generateReferenceCode } = require('../utils/referenceCode');
const homeService = require('./homeService');
const realtimeService = require('./realtimeService');

function serializeRoutePoints(trip) {
  return (trip.stops || [])
    .slice()
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => ({
      stop_order: s.stopOrder,
      stop_name: s.stopName,
      city: s.city,
      address: s.address,
      lat: s.lat != null ? Number(s.lat) : s.stopLat != null ? Number(s.stopLat) : null,
      lng: s.lng != null ? Number(s.lng) : s.stopLng != null ? Number(s.stopLng) : null,
      stop_type: s.stopType,
      estimated_arrival: s.estimatedArrival,
    }));
}

function getMeetingPoint(trip) {
  const pickup =
    (trip.stops || []).find((s) => s.stopType === STOP_TYPE.PICKUP) ||
    (trip.stops || []).find((s) => s.stopType === STOP_TYPE.BOTH);
  if (pickup) {
    return {
      stop_name: pickup.stopName,
      city: pickup.city,
      address: pickup.address,
      lat: pickup.lat != null ? Number(pickup.lat) : pickup.stopLat != null ? Number(pickup.stopLat) : null,
      lng: pickup.lng != null ? Number(pickup.lng) : pickup.stopLng != null ? Number(pickup.stopLng) : null,
      estimated_arrival: pickup.estimatedArrival,
    };
  }
  return {
    stop_name: null,
    city: trip.originCity,
    address: trip.originArea,
    lat: trip.originLat != null ? Number(trip.originLat) : null,
    lng: trip.originLng != null ? Number(trip.originLng) : null,
    estimated_arrival: null,
  };
}

function tripLocationData(trip) {
  return {
    origin: {
      city: trip.originCity,
      area: trip.originArea,
      lat: trip.originLat != null ? Number(trip.originLat) : null,
      lng: trip.originLng != null ? Number(trip.originLng) : null,
    },
    destination: {
      city: trip.destinationCity,
      area: trip.destinationArea,
      lat: trip.destinationLat != null ? Number(trip.destinationLat) : null,
      lng: trip.destinationLng != null ? Number(trip.destinationLng) : null,
    },
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime,
    route_points: serializeRoutePoints(trip),
    meeting_point: getMeetingPoint(trip),
  };
}

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
          status: booking.trip.status,
          departureTime: booking.trip.departureTime,
          ...tripLocationData(booking.trip),
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
    booking_created_at: booking.createdat || booking.createdAt,
    cancellation_reason: booking.cancellationReason,
    cancelled_at: booking.cancelledAt,
    dropoff_place: booking.dropoffPlace,
    trip: booking.trip
      ? {
          origin: booking.trip.originCity,
          destination: booking.trip.destinationCity,
          price: Number(booking.trip.farePerSeat),
          ...tripLocationData(booking.trip),
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
      { model: Trip, as: 'trip', where: { driverId }, attributes: ['id', 'originCity', 'originArea', 'originLat', 'originLng', 'destinationCity', 'destinationArea', 'destinationLat', 'destinationLng', 'farePerSeat'], include: [{ model: TripStop, as: 'stops' }] },
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
      { model: Trip, as: 'trip', attributes: ['id', 'driverId', 'originCity', 'originArea', 'originLat', 'originLng', 'destinationCity', 'destinationArea', 'destinationLat', 'destinationLng', 'farePerSeat'], include: [{ model: TripStop, as: 'stops' }] },
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'avgRating'] },
    ],
  });
  if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
  if (!booking.trip || booking.trip.driverId !== driverId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_BOOKINGS_ON_YOUR_OWN_TRIPS');
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
  throw ApiErrors.serverError('COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE');
}

async function notifyDriver(trip, template, vars) {
  const driver = await User.findByPk(trip.driverId);
  if (driver) {
    await notificationService.sendToUser(driver, template, { channels: ['in_app', 'push'], vars });
  }
}

async function createBooking(passengerId, payload) {
  const {
    trip_id,
    seat_number,
    seats,
    agreed_fare,
    dropoff_place,
    dropoff_deadline,
    drop_off_point,
  } = payload;

  const user = await User.findByPk(passengerId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  if ([USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
    throw ApiErrors.forbidden('ACCOUNT_IS_SUSPENDED_YOU_CANNOT_BOOK_TRIPS');
  }

  const requestedSeats = seats === undefined ? 1 : Number(seats);
  if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
    throw ApiErrors.validation('SEATS_MUST_BE_POSITIVE_INTEGER');
  }

  const trip = await Trip.findByPk(trip_id, {
    include: [{ model: TripStop, as: 'stops' }],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('TRIP_NOT_BOOKABLE');
  }

  if (Number(agreed_fare) !== Number(trip.farePerSeat)) {
    throw ApiErrors.validation('AGREED_FARE_DOES_NOT_MATCH_THE_CURRENT_TRIP_FARE');
  }

  // Resolve the chosen drop-off point (must belong to this trip's route).
  let resolvedDropoffPlace = dropoff_place || null;
  let resolvedDropoffOrder = null;
  if (drop_off_point) {
    const stops = (trip.stops || []).slice().sort((a, b) => a.stopOrder - b.stopOrder);
    const stop = stops.find((s) => s.id === drop_off_point);
    if (!stop) throw ApiErrors.custom('DROP_OFF_POINT_NOT_ON_TRIP', 409, 'DROP_OFF_POINT_NOT_ON_TRIP');
    resolvedDropoffPlace = stop.stopName || stop.city || dropoff_place || null;
    resolvedDropoffOrder = stop.stopOrder;
  }

  // Could the booking be satisfied right now? (re-checked atomically below)
  if (requestedSeats > Number(trip.availableSeats)) {
    throw ApiErrors.custom('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP', 409, 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
  }

  // Legacy single-seat path uses an explicit seat lock + specific seat row.
  const isSingleSeatLocked = seat_number !== undefined && seat_number !== null;
  if (isSingleSeatLocked && requestedSeats !== 1) {
    throw ApiErrors.validation('SEATS_MUST_BE_1');
  }

  let seat = null;
  if (isSingleSeatLocked) {
    const lockStatus = await checkSeatLock(trip_id, seat_number);
    if (!lockStatus.locked || lockStatus.passengerId !== passengerId) {
      throw ApiErrors.custom('SEAT_LOCK_EXPIRED_OR_NOT_HELD', 404, 'SEAT_LOCK_EXPIRED');
    }
    seat = await TripSeat.findOne({ where: { tripId: trip_id, seatNumber: seat_number } });
    if (!seat) throw ApiErrors.notFound('SEAT_NOT_FOUND_ON_THIS_TRIP');
    if (seat.seatType !== SEAT_TYPE.AVAILABLE) {
      throw ApiErrors.conflict('SEAT_ALREADY_BOOKED');
    }
  }

  const referenceCode = await uniqueBookingCode();

  const booking = await sequelize.transaction(async (t) => {
    const freshTrip = await Trip.findByPk(trip_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(freshTrip.status)) {
      throw ApiErrors.conflict('TRIP_NOT_BOOKABLE');
    }

    const remainingSeats = Number(freshTrip.availableSeats) - requestedSeats;
    if (remainingSeats < 0) {
      throw ApiErrors.custom('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP', 409, 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
    }

    if (isSingleSeatLocked) {
      seat.seatType = SEAT_TYPE.UNAVAILABLE;
      await seat.save({ transaction: t });
    }

    const row = await Booking.create(
      {
        tripId: trip_id,
        passengerId,
        seatNumber: isSingleSeatLocked ? seat_number : null,
        seatsBooked: requestedSeats,
        agreedFare: agreed_fare,
        currency: 'JOD',
        dropoffPlace: resolvedDropoffPlace,
        dropoffOrder: resolvedDropoffOrder,
        dropoffDeadline: dropoff_deadline ? new Date(dropoff_deadline) : null,
        status: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        referenceCode,
        cancelledBy: null,
      },
      { transaction: t }
    );

    freshTrip.availableSeats = remainingSeats;
    if (remainingSeats === 0 && freshTrip.status === TRIP_STATUS.PUBLISHED) {
      freshTrip.status = TRIP_STATUS.FULL;
    }
    await freshTrip.save({ transaction: t });

    return row;
  });

  auditService.track({
    action: 'booking.created',
    resourceType: 'booking',
    resourceId: booking.id,
    actorId: passengerId,
    actorType: 'passenger',
    payload: { trip_id, seat_number: isSingleSeatLocked ? seat_number : null, seats: requestedSeats, reference_code: booking.referenceCode },
  });

  // Best-effort: passenger home cache should reflect the new booking/trip.
  try {
    await deleteKey(REDIS_KEYS.PASSENGER_HOME(passengerId));
  } catch (err) {
    console.warn('[bookingService] passenger home cache invalidation failed:', err.message);
  }

  // Best-effort: the driver's home shows the new booking (seats/capacity).
  try {
    await deleteKey(REDIS_KEYS.DRIVER_HOME(trip.driverId));
  } catch (err) {
    console.warn('[bookingService] driver home cache invalidation failed:', err.message);
  }

  // Tell both homes over socket.io so open clients refresh immediately.
  try {
    realtimeService.emitToUser(passengerId, 'home:invalidate', { trip_id });
    realtimeService.emitToUser(trip.driverId, 'home:invalidate', { trip_id });
  } catch (_err) {
    // socket layer offline (e.g. tests) — ignore
  }

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
      seat_number: isSingleSeatLocked ? seat_number : null,
      seats: requestedSeats,
      route: routeLabel,
    }),
  ]);

  const fullTrip = await Trip.findByPk(trip_id, {
    include: [
      { model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'] },
      { model: TripStop, as: 'stops' },
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleType', 'plateNumber', 'seats'] },
    ],
  });
  return serializePassengerDetail(booking, fullTrip, user);
}

function serializePassengerDetail(booking, trip, passenger) {
  const ratingRow = (booking.ratings || [])[0];
  const tripVehicle = trip && trip.vehicle;
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
          departureTime: trip.departureTime,
          ...tripLocationData(trip),
        }
      : null,
    driver:
      trip && trip.driver
        ? {
            id: trip.driver.id,
            full_name: trip.driver.fullName,
            phone_masked: maskPhone(trip.driver.phone),
            rating: Number(trip.driver.avgRating) || 0,
            image: trip.driver.avatarUrl,
          }
        : null,
    vehicle: tripVehicle
      ? {
          vehicle_id: tripVehicle.id,
          type: tripVehicle.vehicleType,
          plate: tripVehicle.plateNumber,
          seats: tripVehicle.seats,
        }
      : null,
    passenger: passenger
      ? { id: passenger.id, full_name: passenger.fullName }
      : null,
    passenger_rating: ratingRow ? Number(ratingRow.stars) : null,
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
        attributes: ['id', 'driverId', 'originCity', 'originArea', 'originLat', 'originLng', 'destinationCity', 'destinationArea', 'destinationLat', 'destinationLng', 'farePerSeat'],
        include: [
          { model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'] },
          { model: TripStop, as: 'stops' },
          { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleType', 'plateNumber', 'seats'] },
        ],
      },
      { model: Rating, as: 'ratings', attributes: ['stars'], where: { raterId: passengerId }, required: false },
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
        attributes: ['id', 'driverId', 'originCity', 'originArea', 'originLat', 'originLng', 'destinationCity', 'destinationArea', 'destinationLat', 'destinationLng', 'farePerSeat'],
        include: [
          { model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'] },
          { model: TripStop, as: 'stops' },
          { model: Vehicle, as: 'vehicle', attributes: ['id', 'vehicleType', 'plateNumber', 'seats'] },
        ],
      },
      { model: User, as: 'passenger', attributes: ['id', 'fullName'] },
      { model: Rating, as: 'ratings', attributes: ['stars'], where: { raterId: passengerId }, required: false },
    ],
  });
  if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
  if (booking.passengerId !== passengerId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_YOUR_OWN_BOOKINGS');
  }

  return { booking: serializePassengerDetail(booking, booking.trip, booking.passenger) };
}

async function cancelBooking(passengerId, bookingId) {
  const user = await User.findByPk(passengerId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'departureTime', 'availableSeats', 'status'],
      },
    ],
  });
  if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
  if (booking.passengerId !== passengerId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_CANCEL_YOUR_OWN_BOOKINGS');
  }
  if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(booking.status)) {
    throw ApiErrors.conflict('BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED');
  }

  const departureTime = new Date(booking.trip.departureTime).getTime();
  const hoursUntilDeparture = (departureTime - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilDeparture < 1) {
    throw ApiErrors.custom(
      'CANCELLATIONS_ARE_ALLOWED_UP_TO_ONE_HOUR_BEFORE_DEPARTURE',
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

  await homeService.invalidateHomeForTrip(booking.tripId, booking.trip.driverId);

  return { booking: { id: booking.id, status: booking.status, cancelled_at: booking.cancelledAt } };
}

/**
 * Driver reveal for a confirmed booking (spec 012 US5). Only the booking's
 * passenger, the trip's driver, or an admin may read it, and only while the
 * booking is `confirmed`. PII (national ID, exact age) is returned here only.
 */
async function getDriverReveal(requesterId, requesterRole, bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'driverId', 'departureTime'],
        include: [
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'fullName', 'phone', 'age', 'gender', 'avatarUrl', 'avgRating'],
          },
          { model: Vehicle, as: 'vehicle' },
        ],
      },
    ],
  });
  if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');

  const isOwner = booking.passengerId === requesterId;
  const isDriver = booking.trip && booking.trip.driverId === requesterId;
  const isAdmin = requesterRole === 'admin';
  if (!isOwner && !isDriver && !isAdmin) {
    throw ApiErrors.custom('YOU_DO_NOT_HAVE_ACCESS_TO_THIS_BOOKING_DRIVER_PROFILE', 403, 'YOU_DO_NOT_HAVE_ACCESS_TO_THIS_BOOKING_DRIVER_PROFILE');
  }
  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw ApiErrors.custom('DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION', 409, 'DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION');
  }

  const driver = booking.trip && booking.trip.driver;
  if (!driver) throw ApiErrors.notFound('DRIVER_NOT_FOUND');

  const profile = await DriverProfile.findOne({ where: { driverId: driver.id } });
  const vehicle = booking.trip.vehicle || null;

  const nameParts = (driver.fullName || '').split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || null;

  return {
    driver: {
      id: driver.id,
      first_name: firstName,
      last_name: lastName,
      phone: driver.phone,
      age: driver.age != null ? Number(driver.age) : null,
      gender: driver.gender,
      is_professional_driver: Boolean(profile && profile.professionalDriver),
      driver_stats: {
        punctuality_rate: profile && profile.punctualityRate != null ? Number(profile.punctualityRate) : null,
        completed_trips: profile ? Number(profile.totalTrips) || 0 : 0,
        rating: Number(driver.avgRating) || 0,
      },
      vehicle_details: vehicle
        ? {
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            year: vehicle.modelYear,
            color: vehicle.color,
            plate_number: vehicle.plateNumber,
            seat_capacity: vehicle.seats,
          }
        : null,
    },
  };
}

module.exports = { listForDriver, getForDriver, createBooking, listForPassenger, getForPassenger, cancelBooking, getDriverReveal };
