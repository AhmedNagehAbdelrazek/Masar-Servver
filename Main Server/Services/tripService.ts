// @ts-nocheck
import { Op } from 'sequelize';
import { ApiErrors } from '../utils/ApiError';
import { TRIP_STATUS, GENDER_PREFERENCE, BOOKING_STATUS, FREE_OFFER_TYPE, PENALTY_TYPES, PENALTY_CATEGORY, PENALTY_SEVERITY, CANCELLATION_ESCALATION } from '../config/constants';
import commissionService from './commissionService';
import notificationService from './notificationService';
import { releaseSeatLock, checkSeatLock } from '../utils/seatLock';
import homeService from './homeService';
import { seatNumbersFor } from '../utils/seatSerializer';
import auditService from './auditService';
import { hasFreeTripsOffer, freeTripsLimit } from '../utils/freeTrips';
import { Trip, TripSeat, TripStop, TripAttribute, Vehicle, User, Booking, DriverSubscription, SubscriptionPlan, Penalty } from '../Models';

/**
 * US3 minimum-balance gate. Rejects with NO_ACTIVE_PLAN when the driver has
 * no active plan, or INSUFFICIENT_BALANCE when the total balance cannot
 * cover the commission for one seat.
 */
async function hasRemainingFreeTrips(driverId) {
  const now = new Date();
  const subscription = await DriverSubscription.findOne({
    where: {
      driverId,
      status: 'active',
      expiresAt: { [Op.gt]: now },
    },
    include: [{
      model: SubscriptionPlan,
      as: 'plan',
      attributes: ['id', 'isFree'],
    }],
  });
  if (!subscription || !hasFreeTripsOffer(subscription)) return false;
  if (!subscription.plan || !subscription.plan.isFree) return false;
  const used = Number(subscription.freeTripsUsed) || 0;
  return used < freeTripsLimit(subscription);
}

async function assertCanPublish(driverId, farePerSeat) {
  const { current, minimum, totalBalance } = await commissionService.getGatingSnapshot(
    driverId,
    farePerSeat
  );
  if (!current) {
    throw ApiErrors.custom('YOU_NEED_AN_ACTIVE_PLAN_TO_PUBLISH_TRIPS', 422, 'NO_ACTIVE_PLAN');
  }
  // Free-trip allowance covers publishing without needing a pre-funded balance.
  if (await hasRemainingFreeTrips(driverId)) {
    return { minimum, totalBalance, freeTrips: true };
  }
  if (totalBalance < minimum) {
    throw ApiErrors.custom(
      'INSUFFICIENT_BALANCE_TO_PUBLISH_TRIP',
      422,
      'INSUFFICIENT_BALANCE',
      null,
      { minimum: minimum.toFixed(2), balance: totalBalance.toFixed(2) }
    );
  }
  return { minimum, totalBalance };
}

/**
 * Free-trips gate. If the driver's current active subscription has a free
 * trips offer (snapshots from signup), check that the driver has not
 * exhausted the allowed count. When free trips are exhausted, the driver
 * is still allowed to publish if they have an active paid subscription.
 */
async function assertFreeTripsAvailable(driverId) {
  const now = new Date();

  // Find the driver's current active subscription (free plan has queue priority).
  const subscription = await DriverSubscription.findOne({
    where: {
      driverId,
      status: 'active',
      expiresAt: { [Op.gt]: now },
    },
    include: [{
      model: SubscriptionPlan,
      as: 'plan',
      attributes: ['id', 'isFree'],
    }],
  });

  // No active subscription — nothing to block here.
  if (!subscription) return;

  // Use the snapshot from the subscription, not the current plan.
  const freeOffer = subscription.freeOffer;
  if (!freeOffer) return;
  if (freeOffer.type !== FREE_OFFER_TYPE.TRIPS) return;

  // Only block if this is a free plan subscription.
  if (!subscription.plan || !subscription.plan.isFree) return;

  const limit = freeTripsLimit(subscription);
  const used = Number(subscription.freeTripsUsed) || 0;

  if (used < limit) return;

  // Free trips exhausted. Check if the driver has an active paid subscription.
  const paidSub = await DriverSubscription.findOne({
    where: {
      driverId,
      status: 'active',
      expiresAt: { [Op.gt]: now },
    },
    include: [{
      model: SubscriptionPlan,
      as: 'plan',
      where: { isFree: false },
      attributes: ['id'],
    }],
  });

  if (paidSub) return;

  throw ApiErrors.custom(
    'FREE_TRIPS_EXHAUSTED_PUBLISHING',
    422,
    'FREE_TRIPS_EXHAUSTED',
    null,
    { limit }
  );
}

/**
 * Create a new trip with seats, waypoints, and recurrence
 */
const createTrip = async (driverId, data) => {
  // Verify driver exists and is verified
  const driver = await User.findByPk(driverId);
  if (!driver) throw ApiErrors.notFound('USER_NOT_FOUND');
  if (driver.role !== 'driver') throw ApiErrors.forbidden('ONLY_DRIVERS_CAN_CREATE_TRIPS');
  if (!driver.isVerified) throw ApiErrors.forbidden('DRIVER_NOT_VERIFIED');

  // Fetch driver's vehicle (each driver has exactly one vehicle)
  const vehicle = await Vehicle.findOne({ where: { driverId } });
  if (!vehicle) throw ApiErrors.forbidden('DRIVER_HAS_NO_REGISTERED_VEHICLE');
  if (!vehicle.isVerified) throw ApiErrors.forbidden('DRIVER_VEHICLE_IS_NOT_VERIFIED');

  // Validate seat configuration matches vehicle
  if (data.seats.length !== vehicle.seats) {
    throw ApiErrors.validation('SEAT_COUNT_DOES_NOT_MATCH_VEHICLE_TOTAL_SEATS');
  }

  // Validate seat numbers are sequential 1 to N
  const seatNumbers = data.seats.map((s) => s.seat_number).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: vehicle.seats }, (_, i) => i + 1);
  if (JSON.stringify(seatNumbers) !== JSON.stringify(expectedNumbers)) {
    throw ApiErrors.validation('SEAT_NUMBERS_MUST_BE_SEQUENTIAL_FROM_1_TO_TOTAL_SEATS');
  }

  // Validate at least one available seat
  const availableSeats = data.seats.filter((s) => s.type === 'available');
  if (availableSeats.length === 0) {
    throw ApiErrors.validation('AT_LEAST_ONE_SEAT_MUST_BE_AVAILABLE');
  }

  // Validate exactly one driver seat
  const driverSeats = data.seats.filter((s) => s.type === 'driver');
  if (driverSeats.length !== 1) {
    throw ApiErrors.validation('EXACTLY_ONE_SEAT_MUST_BE_MARKED_AS_DRIVER');
  }

  // Validate departure time is in the future
  const departureDateTime = new Date(`${data.departure_date}T${data.departure_time}`);
  if (departureDateTime <= new Date()) {
    throw ApiErrors.validation('DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE');
  }

  // Validate recurrence
  const isRecurring = data.type_of_trip === 'repeated';
  if (isRecurring && (!data.repeated_days || data.repeated_days.length === 0)) {
    throw ApiErrors.validation('REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS');
  }
  if (isRecurring && !data.repeated_end_date) {
    throw ApiErrors.validation('END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS');
  }
  if (isRecurring) {
    const endDate = new Date(data.repeated_end_date);
    if (endDate <= departureDateTime) {
      throw ApiErrors.validation('END_DATE_MUST_BE_AFTER_DEPARTURE_DATE');
    }
  }

  // Free-trips gate: block if the driver exhausted their free trip allowance.
  await assertFreeTripsAvailable(driverId);

  // US3: minimum-balance gate before publishing.
  await assertCanPublish(driverId, data.fare_per_seat);

  // Create trip
  const trip = await Trip.create({
    driverId,
    vehicleId: vehicle.id,
    originCity: data.origin_city,
    originArea: data.origin_area || null,
    originLat: data.origin_lat || null,
    originLng: data.origin_lng || null,
    destinationCity: data.destination_city,
    destinationArea: data.destination_area || null,
    destinationLat: data.destination_lat || null,
    destinationLng: data.destination_lng || null,
    departureTime: departureDateTime,
    totalSeats: vehicle.seats,
    availableSeats: availableSeats.length,
    farePerSeat: data.fare_per_seat,
    isRecurring,
    recurrenceDays: isRecurring ? data.repeated_days : null,
    recurrenceEndDate: isRecurring ? data.repeated_end_date : null,
    genderPreference: data.allowed_type || GENDER_PREFERENCE.ALL,
    driverInstructions: data.instructions || null,
    additionalInstructions: data.additional_instructions || null,
    status: TRIP_STATUS.PUBLISHED,
  });

  // Create seat configurations
  const seatRecords = data.seats.map((s) => ({
    tripId: trip.id,
    seatNumber: s.seat_number,
    seatType: s.type,
  }));
  await TripSeat.bulkCreate(seatRecords);

  // Create stops / waypoints including dedicated pickup and dropoff points (each with name + lat/lng)
  const buildStopRecord = (src, fallbackOrder, fallbackType) => {
    const name = src.stop_name || src.name || src.city || null;
    const city = src.city || src.stop_name || src.name || null;
    const address = src.address || null;
    const latRaw = src.lat ?? src.stop_lat ?? src.latitude ?? null;
    const lngRaw = src.lng ?? src.stop_lng ?? src.longitude ?? null;
    const stopOrder = src.stop_order != null ? Number(src.stop_order) : fallbackOrder;
    const stopType = src.stop_type || fallbackType || 'both';
    return {
      tripId: trip.id,
      stopOrder,
      stopName: name ? String(name).trim() : null,
      city: city ? String(city).trim() : null,
      address: address ? String(address).trim() : null,
      // legacy lat/lng columns (used by bookingService fallback)
      lat: latRaw != null ? String(latRaw) : null,
      lng: lngRaw != null ? String(lngRaw) : null,
      stopLat: latRaw != null ? String(latRaw) : null,
      stopLng: lngRaw != null ? String(lngRaw) : null,
      stopType,
    };
  };

  let stopRecords = [];
  // Prefer explicit stops array if provided (full control)
  if (data.stops && Array.isArray(data.stops) && data.stops.length > 0) {
    stopRecords = data.stops.map((s, idx) => buildStopRecord(s, idx + 1, s.stop_type || 'both'));
  } else {
    let order = 1;
    const pickupSrc = data.pickup_point || data.pickup || data.pickup_location || null;
    if (pickupSrc && typeof pickupSrc === 'object') {
      stopRecords.push(buildStopRecord(pickupSrc, order++, 'pickup'));
    }
    if (data.waypoints && Array.isArray(data.waypoints) && data.waypoints.length > 0) {
      for (const w of data.waypoints) {
        const hasAny = w.stop_name || w.name || w.stop_lat || w.lat || w.stop_lng || w.lng || w.city;
        if (!hasAny) continue;
        stopRecords.push(buildStopRecord(w, order++, w.stop_type || 'both'));
      }
    }
    const dropoffSrc = data.dropoff_point || data.dropoff || data.dropoff_location || data.drop_off_point || null;
    if (dropoffSrc && typeof dropoffSrc === 'object') {
      stopRecords.push(buildStopRecord(dropoffSrc, order++, 'dropoff'));
    }
  }

  if (stopRecords.length > 0) {
    // Ensure stopOrder is sequential and unique
    stopRecords.forEach((r, idx) => { if (!r.stopOrder) r.stopOrder = idx + 1; });
    stopRecords.sort((a, b) => a.stopOrder - b.stopOrder);
    stopRecords.forEach((r, idx) => { r.stopOrder = idx + 1; });
    await TripStop.bulkCreate(stopRecords);
  }

  trackTripMutation({
    action: 'trip.created',
    driverId,
    tripId: trip.id,
    payload: {
      status: trip.status,
      origin_city: trip.originCity,
      destination_city: trip.destinationCity,
      departure_time: trip.departureTime,
      fare_per_seat: trip.farePerSeat,
      total_seats: trip.totalSeats,
      available_seats: trip.availableSeats,
    },
  });

  return {
    trip_id: trip.id,
    status: trip.status,
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    estimated_earnings: trip.availableSeats * trip.farePerSeat,
    message: 'TRIP_PUBLISHED_SUCCESSFULLY',
  };
};

/**
 * Audit a driver trip mutation with the trip as the resource.
 */
function trackTripMutation({ action, driverId, tripId, payload = {} }) {
  auditService.track({
    action,
    resourceType: 'trip',
    resourceId: tripId,
    actorId: driverId,
    actorType: 'driver',
    payload,
  });
}

/**
 * Get trip by ID with full details: driver profile, vehicle, waypoints,
 * attributes, and confirmed passengers with their profiles and booking info.
 * `_participantIds` lets the controller gate access to driver + confirmed
 * passengers + admins.
 */
const getTripById = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    include: [
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'],
      },
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['id', 'manufacturer', 'model', 'modelYear', 'plateNumber', 'color', 'seats'],
      },
      { model: TripSeat, as: 'seats' },
      { model: TripStop, as: 'stops' },
      { model: TripAttribute, as: 'attributes' },
      {
        model: Booking,
        as: 'bookings',
        where: { status: BOOKING_STATUS.CONFIRMED },
        required: false,
        include: [
          {
            model: User,
            as: 'passenger',
            attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'],
          },
        ],
      },
    ],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');

  const data = trip.toJSON();
  const confirmedBookings = data.bookings || [];

  data.trip = {
    trip_id: data.id,
    driver: data.driver
      ? {
          id: data.driver.id,
          full_name: data.driver.fullName,
          phone: data.driver.phone,
          rating: Number(data.driver.avgRating) || 0,
          profile_picture_url: data.driver.avatarUrl,
        }
      : null,
    vehicle: data.vehicle
      ? {
          vehicle_id: data.vehicle.id,
          make_model: `${data.vehicle.manufacturer} ${data.vehicle.model}`,
          year: data.vehicle.modelYear,
          plate_number: data.vehicle.plateNumber,
          color: data.vehicle.color,
          total_seats: data.vehicle.seats,
        }
      : null,
    origin: {
      city: data.originCity,
      area: data.originArea,
      lat: data.originLat ? Number(data.originLat) : null,
      lng: data.originLng ? Number(data.originLng) : null,
    },
    destination: {
      city: data.destinationCity,
      area: data.destinationArea,
      lat: data.destinationLat ? Number(data.destinationLat) : null,
      lng: data.destinationLng ? Number(data.destinationLng) : null,
    },
    departure_time: data.departureTime,
    fare_per_seat: Number(data.farePerSeat),
    currency: data.currency || 'JOD',
    total_seats: data.totalSeats,
    available_seats: data.availableSeats,
    status: data.status,
    is_recurring: data.isRecurring,
    recurrence_days: data.recurrenceDays,
    recurrence_end_date: data.recurrenceEndDate,
    gender_preference: data.genderPreference,
    attributes: (data.attributes || []).map((a) => ({
      key: a.attrKey,
      value: a.attrValue === 'true',
    })),
    waypoints: (data.stops || []).map((s) => ({
      stop_name: s.stopName,
      stop_lat: s.stopLat ? Number(s.stopLat) : null,
      stop_lng: s.stopLng ? Number(s.stopLng) : null,
    })),
    instructions: data.driverInstructions,
    additional_instructions: data.additionalInstructions,
    created_at: data.createdAt,
  };

  data.passengers = confirmedBookings.map((b) => ({
    booking_id: b.id,
    passenger: b.passenger
      ? {
          id: b.passenger.id,
          full_name: b.passenger.fullName,
          phone: b.passenger.phone,
          rating: Number(b.passenger.avgRating) || 0,
          profile_picture_url: b.passenger.avatarUrl,
        }
      : null,
    seats_booked: b.seatsBooked,
    seat_numbers: seatNumbersFor(b),
    agreed_fare: Number(b.agreedFare),
    booking_status: b.status,
    dropoff_place: b.dropoffPlace,
    dropoff_deadline: b.dropoffDeadline,
    created_at: b.createdAt,
  }));

  data._participantIds = [data.driverId, ...confirmedBookings.map((b) => b.passengerId)];
  delete data.driver;
  delete data.vehicle;
  delete data.bookings;
  delete data.originCity;
  delete data.originArea;
  delete data.originAddress;
  delete data.originLat;
  delete data.originLng;
  delete data.destinationCity;
  delete data.destinationArea;
  delete data.destinationAddress;
  delete data.destinationLat;
  delete data.destinationLng;
  delete data.farePerSeat;
  delete data.totalSeats;
  delete data.availableSeats;
  delete data.genderPreference;
  delete data.driverInstructions;
  delete data.additionalInstructions;
  delete data.isRecurring;
  delete data.recurrenceDays;
  delete data.recurrenceEndDate;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.isFeatured;
  delete data.featuredUntil;
  delete data.isBlockedByBalance;
  delete data.isModerated;
  delete data.moderationReason;
  delete data.moderatedBy;
  delete data.arrivalTime;

  return data;
};

/**
 * Get trip booking options (spec 012 US2): the current open-seat count and the
 * ordered drop-off points (the trip's stops). Refused for trips that have
 * already started or ended (not bookable).
 */
const getTripOptions = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    attributes: ['id', 'status', 'availableSeats'],
    include: [{ model: TripStop, as: 'stops' }],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('TRIP_NOT_BOOKABLE');
  }

  const allPoints = (trip.stops || [])
    .slice()
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((s) => ({
      stop_id: s.id,
      stop_order: s.stopOrder,
      stop_name: s.stopName,
      city: s.city,
      address: s.address || null,
      lat: s.lat != null ? Number(s.lat) : s.stopLat != null ? Number(s.stopLat) : null,
      lng: s.lng != null ? Number(s.lng) : s.stopLng != null ? Number(s.stopLng) : null,
      stop_type: s.stopType || 'both',
    }));

  const pickupPoints = allPoints.filter((p) => p.stop_type === 'pickup' || p.stop_type === 'both');
  const dropOffPoints = allPoints.filter((p) => p.stop_type === 'dropoff' || p.stop_type === 'both');

  return {
    trip_id: trip.id,
    available_seats: trip.availableSeats,
    // backward compat: drop_off_points historically contained all stops; now filtered to dropoff/both but keep alias `points` for all
    drop_off_points: dropOffPoints,
    pickup_points: pickupPoints,
    points: allPoints,
    stops: allPoints,
  };
};

/**
 * Get seats for a trip - returns all seats and empty (available) seats.
 * Any authenticated user may call it. Trip must exist; no status restriction
 * beyond existence so passengers can inspect layout even before booking.
 */
const getTripSeats = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    attributes: ['id', 'status', 'totalSeats', 'availableSeats', 'driverId'],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');

  const seatRows = await TripSeat.findAll({
    where: { tripId: trip.id },
    order: [['seat_number', 'ASC']],
  });

  // Enrich with lock info (best-effort, never throws)
  const seats = await Promise.all(
    seatRows.map(async (s) => {
      let locked = false;
      let lockedBy = null;
      let expiresAt = null;
      try {
        const lock = await checkSeatLock(tripId, s.seatNumber);
        locked = lock.locked;
        lockedBy = lock.passengerId;
        expiresAt = lock.expiresAt;
      } catch (_err) {
        // redis offline - treat as unlocked
      }
      return {
        seat_number: s.seatNumber,
        seat_type: s.seatType,
        is_available: s.seatType === 'available' && !locked,
        is_locked: locked,
        locked_by: lockedBy,
        locked_expires_at: expiresAt,
      };
    })
  );

  const emptySeats = seats.filter((s) => s.seat_type === 'available' && !s.is_locked);
  const availableSeats = seats.filter((s) => s.seat_type === 'available');

  return {
    trip_id: trip.id,
    status: trip.status,
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    seats_count: seats.length,
    seats,
    empty_seats: emptySeats,
    empty_seats_count: emptySeats.length,
    available_seats_detail: availableSeats,
  };
};

/**
 * Get trips for a driver (contract D-list). Each trip is serialized with its
 * current lifecycle `status` included.
 */
const getDriverTrips = async (driverId, status = null) => {
  const where = { driverId };
  if (status) where.status = status;

  const trips = await Trip.findAll({
    where,
    include: [
      { model: TripSeat, as: 'seats' },
      { model: TripStop, as: 'stops' },
    ],
    order: [['departure_time', 'ASC']],
  });

  return trips.map((trip) => ({
    trip_id: trip.id,
    origin_city: trip.originCity,
    origin_area: trip.originArea,
    destination_city: trip.destinationCity,
    destination_area: trip.destinationArea,
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime,
    fare_per_seat: Number(trip.farePerSeat),
    currency: trip.currency || 'JOD',
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    gender_preference: trip.genderPreference,
    is_recurring: trip.isRecurring,
    recurrence_days: trip.recurrenceDays,
    recurrence_end_date: trip.recurrenceEndDate,
    instructions: trip.driverInstructions,
    additional_instructions: trip.additionalInstructions,
    status: trip.status,
    seats: (trip.seats || []).map((s) => ({
      seat_number: s.seatNumber,
      seat_type: s.seatType,
    })),
    waypoints: (trip.stops || []).map((s) => ({
      stop_name: s.stopName,
      stop_lat: s.stopLat ? Number(s.stopLat) : null,
      stop_lng: s.stopLng ? Number(s.stopLng) : null,
    })),
    created_at: trip.createdat || trip.createdAt,
  }));
};

/**
 * Get available trips for passengers (with recurrence expansion).
 * Additive filters (spec 012): time window, vehicle type, minimum seat count.
 * The output keeps the existing raw-trip shape for backward compatibility.
 */
/**
 * Helper to build a Trip query for a specific date/direction.
 * Includes driver details (name, rating, avatar) + vehicle.
 * NOTE: `targetDate` is the START of the range (inclusive) — the search
 * returns trips on that date AND all future ones, not just that single day.
 */
async function fetchTripsForDate({ targetDate, originCity, destinationCity, genderPreference, timeFrom, timeTo, vehicleType, seats }) {
  const hasDate = !!targetDate;
  const now = new Date();

  let qd = null;
  let dayStart = null;
  if (hasDate) {
    qd = new Date(targetDate);
    dayStart = new Date(qd);
    dayStart.setHours(0, 0, 0, 0);
  }

  const where = {
    status: TRIP_STATUS.PUBLISHED,
    isModerated: false,
  };

  // Seat filter: if seats requested, require at least that many; otherwise require at least 1
  if (seats && Number(seats) > 0) {
    where.availableSeats = { [Op.gte]: Number(seats) };
  } else {
    where.availableSeats = { [Op.gt]: 0 };
  }

  if (originCity) where.originCity = originCity;
  if (destinationCity) where.destinationCity = destinationCity;
  if (genderPreference && genderPreference !== GENDER_PREFERENCE.ALL) {
    where.genderPreference = { [Op.in]: [genderPreference] };
  }

  const andConditions = [];

  if (hasDate) {
    // Date is the start of the range (inclusive): one-off trips departing on
    // the date or any later day, plus recurring trips still active on/after
    // the date (they have occurrences in the future).
    const dateBranch = {
      [Op.or]: [
        {
          isRecurring: false,
          departureTime: { [Op.gte]: dayStart },
        },
        {
          isRecurring: true,
          [Op.or]: [
            { recurrenceEndDate: { [Op.gte]: dayStart } },
            { recurrenceEndDate: { [Op.is]: null } },
          ],
        },
      ],
    };
    andConditions.push(dateBranch);

    // Time window is a time-of-day filter applied post-query below (it must
    // not be an absolute single-day datetime range, otherwise every future
    // trip outside the target day would be excluded).

    // Exclude trips whose departure time is already in the past (only for non-recurring)
    andConditions.push({
      [Op.or]: [
        { isRecurring: true },
        { departureTime: { [Op.gt]: now } },
      ],
    });
  } else {
    // No date filter: return all future trips (published + available), excluding past one-off trips
    andConditions.push({
      [Op.or]: [
        { isRecurring: false, departureTime: { [Op.gt]: now } },
        {
          isRecurring: true,
          [Op.or]: [
            { recurrenceEndDate: { [Op.gte]: now } },
            { recurrenceEndDate: { [Op.is]: null } },
          ],
        },
      ],
    });
    // Time window for no-date case is applied post-query (time-of-day filtering)
  }

  if (andConditions.length > 0) {
    where[Op.and] = andConditions;
  }

  const include = [
    { model: TripSeat, as: 'seats', where: { seatType: 'available' } },
    { model: TripStop, as: 'stops' },
    { model: Vehicle, as: 'vehicle' },
    { model: User, as: 'driver', attributes: ['id', 'fullName', 'avgRating', 'avatarUrl', 'gender'] },
  ];
  if (vehicleType) {
    include[2] = { model: Vehicle, as: 'vehicle', where: { vehicleType } };
  }

  let trips = await Trip.findAll({
    where,
    include,
    order: [['departure_time', 'ASC']],
  });

  // Post-filter time window as time-of-day (applies with or without a date:
  // with a date the results span that date + all future days, so an absolute
  // single-day datetime range would wrongly exclude every later trip)
  if (timeFrom || timeTo) {
    const parseMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const fromMin = timeFrom ? parseMinutes(timeFrom) : 0;
    const toMin = timeTo ? parseMinutes(timeTo) : 23 * 60 + 59;
    trips = trips.filter((trip) => {
      const dt = new Date(trip.departureTime);
      const minutes = dt.getHours() * 60 + dt.getMinutes();
      return minutes >= fromMin && minutes <= toMin;
    });
  }

  // Defensive: also filter out any non-recurring trips still in the past (in case DB clock drift)
  trips = trips.filter((trip) => {
    if (trip.isRecurring) return true;
    return new Date(trip.departureTime).getTime() > now.getTime();
  });

  return trips;
}

const getAvailableTrips = async (filters = {}) => {
  const {
    originCity,
    destinationCity,
    date,
    returnDate,
    genderPreference = null,
    timeFrom,
    timeTo,
    vehicleType,
    seats,
  } = filters;

  // Validate dates when provided; allow omitting date to return all trips
  let queryDate = null;
  if (date) {
    queryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedQuery = new Date(queryDate);
    normalizedQuery.setHours(0, 0, 0, 0);
    if (normalizedQuery < today) {
      throw ApiErrors.validation('DATE_CANNOT_BE_IN_THE_PAST');
    }
  }
  if (returnDate) {
    const rd = new Date(returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normReturn = new Date(rd);
    normReturn.setHours(0, 0, 0, 0);
    if (normReturn < today) throw ApiErrors.validation('DATE_CANNOT_BE_IN_THE_PAST');
    if (queryDate) {
      const normQuery = new Date(queryDate);
      normQuery.setHours(0, 0, 0, 0);
      if (normReturn < normQuery) throw ApiErrors.validation('DATE_CANNOT_BE_IN_THE_PAST');
    }
  }

  const trips = await fetchTripsForDate({
    targetDate: date || null,
    originCity,
    destinationCity,
    genderPreference,
    timeFrom,
    timeTo,
    vehicleType,
    seats,
  });

  let returningTrips = [];
  if (returnDate && originCity && destinationCity) {
    returningTrips = await fetchTripsForDate({
      targetDate: returnDate,
      originCity: destinationCity,
      destinationCity: originCity,
      genderPreference,
      timeFrom,
      timeTo,
      vehicleType,
      seats,
    });
  }

  // Backward compat: callers that expect an array still get trips,
  // but we also attach returningTrips as a property for new controller.
  // Returning an object shape is the new contract for the controller.
  const result = trips;
  result.returningTrips = returningTrips;
  // Also return object form for explicit destructuring
  return { trips, returningTrips };
};

/**
 * Start a trip (US3). Re-verifies the minimum balance and marks the trip
 * in-progress. Sends an INSUFFICIENT_BALANCE_START notification when the
 * balance check fails.
 */
const startTrip = async (driverId, tripId) => {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('YOU_CAN_ONLY_START_YOUR_OWN_TRIPS');

  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.custom('TRIP_CANNOT_BE_STARTED_FROM_ITS_CURRENT_STATUS', 422, 'INVALID_TRIP_STATUS');
  }

  // US2: departure window — reject starting more than 1 hour before departure.
  const now = Date.now();
  const START_WINDOW_MS = 60 * 60 * 1000;
  if (trip.departureTime.getTime() - now > START_WINDOW_MS) {
    throw ApiErrors.custom(
      'TRIP_CANNOT_BE_STARTED_YET_IT_CAN_ONLY_BE_STARTED',
      400,
      'TOO_EARLY_TO_START'
    );
  }

  const { current, minimum, totalBalance } = await commissionService.getGatingSnapshot(
    driverId,
    trip.farePerSeat
  );
  if (!current) {
    throw ApiErrors.custom('YOU_NEED_AN_ACTIVE_PLAN_TO_START_TRIPS', 422, 'NO_ACTIVE_PLAN');
  }
  if (!(await hasRemainingFreeTrips(driverId)) && totalBalance < minimum) {
    const user = await User.findByPk(driverId);
    if (user) {
      try {
        await notificationService.sendToUser(user, 'INSUFFICIENT_BALANCE_START', {
          channels: ['sms', 'in_app', 'push'],
          data: { trip_id: tripId, required: minimum, balance: totalBalance },
        });
      } catch (err) {
        console.warn('[tripService] insufficient balance notification failed:', err.message);
      }
    }
    throw ApiErrors.custom(
      'YOUR_TRIP_CANNOT_BE_STARTED_BECAUSE_YOUR_BALANCE_IS_INSUFFICIENT',
      422,
      'INSUFFICIENT_BALANCE'
    );
  }

  await trip.update({ status: TRIP_STATUS.IN_PROGRESS });

  // US2: best-effort notify confirmed passengers that the trip has started.
  try {
    await notificationService.notifyConfirmedPassengers(
      [trip.id],
      'TRIP_STARTED',
      { data: { trip_id: trip.id } }
    );
  } catch (err) {
    console.warn('[tripService] TRIP_STARTED notification failed:', err.message);
  }

  // US2: drop the cached home payload so it reflects the new trip status.
  try {
    await homeService.invalidateHomeCache(driverId);
  } catch (err) {
    console.warn('[tripService] home cache invalidation failed:', err.message);
  }

  const trackingLink =
    `${process.env.SOCKET_TRACKING_BASE_URL || 'wss://api.masar.app/socket.io'}?trip=${trip.id}`;

  trackTripMutation({
    action: 'trip.started',
    driverId,
    tripId: trip.id,
    payload: { status: trip.status },
  });

  return {
    trip_id: trip.id,
    status: trip.status,
    message: 'TRIP_STARTED_SUCCESSFULLY',
    tracking_link: trackingLink,
  };
};

/**
 * Complete a trip (US3). Deducts the commission (total paid fare × current
 * plan rate) FIFO from the active plans and marks the trip completed. If the
 * deduction pushes the driver into debt their trips are blocked.
 */
const completeTrip = async (driverId, tripId) => {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('YOU_CAN_ONLY_COMPLETE_YOUR_OWN_TRIPS');

  if (![TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING].includes(trip.status)) {
    throw ApiErrors.custom('TRIP_CANNOT_BE_COMPLETED_FROM_ITS_CURRENT_STATUS', 422, 'INVALID_TRIP_STATUS');
  }

  const result = await commissionService.deductCommission(trip, driverId);

  await trip.update({ status: TRIP_STATUS.COMPLETED });

  // Finalize confirmed bookings (spec 009 US3): completed + paid_cash + timestamp.
  const confirmedBookings = await Booking.findAll({
    where: { tripId: trip.id, status: BOOKING_STATUS.CONFIRMED },
    include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName'] }],
  });
  for (const booking of confirmedBookings) {
    await booking.update({
      status: BOOKING_STATUS.COMPLETED,
      paymentStatus: 'paid_cash',
      completedAt: new Date(),
    });
    if (booking.passenger) {
      try {
        await notificationService.sendToUser(booking.passenger, 'TRIP_COMPLETED_PROMPT', {
          channels: ['in_app'],
          vars: { route: `${trip.originCity} - ${trip.destinationCity}` },
        });
      } catch (err) {
        console.warn('[tripService] trip completed notification failed:', err.message);
      }
    }
  }

  // Increment free trips counter if the driver's subscription has a free trips offer.
  try {
    const now = new Date();
    const subscription = await DriverSubscription.findOne({
      where: {
        driverId,
        status: 'active',
        expiresAt: { [Op.gt]: now },
      },
      include: [{
        model: SubscriptionPlan,
        as: 'plan',
        where: { isFree: true },
        attributes: ['id'],
      }],
    });

    // Use the snapshot from the subscription, not the current plan.
    if (subscription && subscription.freeOffer &&
        subscription.freeOffer.type === FREE_OFFER_TYPE.TRIPS) {
      await subscription.increment('freeTripsUsed');
    }
  } catch (err) {
    console.warn('[tripService] failed to increment free trips counter:', err.message);
  }

  if (result.isInDebt) {
    const user = await User.findByPk(driverId);
    if (user) {
      try {
        await notificationService.sendToUser(user, 'DEBT', {
          channels: ['in_app', 'push'],
          vars: { balance: Number(result.balanceAfter).toFixed(2) },
          data: { trip_id: tripId, commission: result.commission },
        });
      } catch (err) {
        console.warn('[tripService] debt notification failed:', err.message);
      }
    }
  }

  // US3: reflect completion in the cached driver + passenger homes.
  await homeService.invalidateHomeForTrip(trip.id, driverId);

  trackTripMutation({
    action: 'trip.completed',
    driverId,
    tripId: trip.id,
    payload: {
      commission: result.commission,
      plan_name: result.planName,
      balance_after: result.balanceAfter,
      is_in_debt: result.isInDebt,
    },
  });

  return {
    trip_id: trip.id,
    commission: result.commission,
    plan_name: result.planName,
    balance_after: result.balanceAfter,
    is_in_debt: result.isInDebt,
  };
};

module.exports = {
  createTrip,
  getTripById,
  getTripOptions,
  getTripSeats,
  getDriverTrips,
  getAvailableTrips,
  startTrip,
  completeTrip,
  updateTrip,
  cancelTrip,
  cancelTripWithPenalty,
  getTripAttributes,
  getTripPassengers,
};

/**
 * Lean passenger list for one of the driver's own trips — shaped for
 * client-side pickers/dropdowns (e.g. rate-a-passenger after completion).
 * Defaults to CONFIRMED + COMPLETED bookings; `status` narrows to one.
 */
async function getTripPassengers(driverId, tripId, filters = {}) {
  const trip = await Trip.findByPk(tripId, {
    attributes: ['id', 'driverId', 'originCity', 'destinationCity', 'departureTime', 'status'],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) {
    throw ApiErrors.forbidden('YOU_CAN_ONLY_VIEW_PASSENGERS_ON_YOUR_OWN_TRIPS');
  }

  const status = filters.status || [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED];
  const bookings = await Booking.findAll({
    where: { tripId: trip.id, status },
    include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName', 'avatarUrl', 'avgRating'] }],
    order: [['createdat', 'ASC']],
  });

  return {
    trip_id: trip.id,
    trip_status: trip.status,
    route: `${trip.originCity} - ${trip.destinationCity}`,
    departure_time: trip.departureTime,
    passengers: bookings.map((b) => ({
      booking_id: b.id,
      passenger: b.passenger
        ? {
            id: b.passenger.id,
            full_name: b.passenger.fullName,
            profile_picture_url: b.passenger.avatarUrl,
            rating: Number(b.passenger.avgRating) || 0,
          }
        : null,
      seats_booked: b.seatsBooked,
      seat_numbers: seatNumbersFor(b),
      booking_status: b.status,
    })),
  };
}

/**
 * Partial update of a driver's own trip (contract D1). Accepts fare,
 * departure/arrival time, gender preference and instructions. When provided,
 * `attributes` and `stops` replace the existing values. A departure-time
 * change notifies all confirmed passengers (best-effort, never throws).
 */
async function updateTrip(driverId, tripId, data) {
  const trip = await Trip.findByPk(tripId, {
    include: [{ model: TripAttribute, as: 'attributes' }],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('YOU_CAN_ONLY_EDIT_YOUR_OWN_TRIPS');
  if ([TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED].includes(trip.status)) {
    throw ApiErrors.custom('TRIP_CANNOT_BE_EDITED_FROM_ITS_CURRENT_STATUS', 422, 'INVALID_TRIP_STATUS');
  }

  const fields = {};
  if (data.fare_per_seat !== undefined) fields.farePerSeat = data.fare_per_seat;
  if (data.arrival_time !== undefined) fields.arrivalTime = data.arrival_time || null;
  if (data.gender_preference !== undefined) fields.genderPreference = data.gender_preference;
  if (data.driver_instructions !== undefined) fields.driverInstructions = data.driver_instructions;
  if (data.additional_instructions !== undefined) fields.additionalInstructions = data.additional_instructions || null;

  const departureChanged =
    data.departure_time !== undefined &&
    new Date(data.departure_time).getTime() !== new Date(trip.departureTime).getTime();
  if (data.departure_time !== undefined) fields.departureTime = new Date(data.departure_time);

  await trip.update(fields);

  if (data.attributes !== undefined) {
    await TripAttribute.destroy({ where: { tripId: trip.id } });
    const records = (data.attributes || []).map((a) => ({
      tripId: trip.id,
      attrKey: a.attr_key,
      attrValue: a.attr_value,
    }));
    if (records.length > 0) await TripAttribute.bulkCreate(records);
  }

  if (data.stops !== undefined) {
    await TripStop.destroy({ where: { tripId: trip.id } });
    const records = (data.stops || []).map((s, i) => ({
      tripId: trip.id,
      stopOrder: s.stop_order !== undefined ? s.stop_order : i + 1,
      stopName: s.city || null,
      city: s.city || null,
      address: s.address || null,
      lat: s.lat || null,
      lng: s.lng || null,
      stopType: s.stop_type || 'both',
      estimatedArrival: s.estimated_arrival ? new Date(s.estimated_arrival) : null,
    }));
    if (records.length > 0) await TripStop.bulkCreate(records);
  }

  let notifiedPassengers = 0;
  if (departureChanged) {
    const departure = new Date(trip.departureTime);
    notifiedPassengers = await notificationService.notifyConfirmedPassengers(
      [trip.id],
      'TRIP_TIME_CHANGED',
      {
        vars: { time: departure.toISOString() },
        data: { trip_id: trip.id },
      }
    );

    // A departure change updates the time shown on driver/passenger homes.
    await homeService.invalidateHomeForTrip(trip.id, driverId);
  }

  const attributes = await TripAttribute.findAll({ where: { tripId: trip.id } });

  trackTripMutation({
    action: 'trip.updated',
    driverId,
    tripId: trip.id,
    payload: { fields: Object.keys(fields), notified_passengers: notifiedPassengers },
  });

  return {
    trip: {
      id: trip.id,
      origin_city: trip.originCity,
      destination_city: trip.destinationCity,
      departure_time: trip.departureTime,
      fare_per_seat: Number(trip.farePerSeat),
      status: trip.status,
      attributes: attributes.map((a) => ({ attr_key: a.attrKey, attr_value: a.attrValue })),
      notified_passengers: notifiedPassengers,
    },
  };
}

/**
 * Cancel a driver's own trip (contract D2). Refused once started. Marks the
 * trip and its bookings cancelled, releases every Redis seat lock for the
 * trip's seats, and notifies confirmed passengers (best-effort).
 */
async function cancelTrip(driverId, tripId) {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS');
  if (
    [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING, TRIP_STATUS.COMPLETED].includes(trip.status)
  ) {
    throw ApiErrors.forbidden('A_TRIP_THAT_HAS_ALREADY_STARTED_CANNOT_BE_CANCELLED');
  }
  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw ApiErrors.custom('TRIP_IS_ALREADY_CANCELLED', 409, 'ALREADY_CANCELLED');
  }

  await trip.update({ status: TRIP_STATUS.CANCELLED });

  let notifiedPassengers = 0;
  try {
    notifiedPassengers = await notificationService.notifyConfirmedPassengers(
      [trip.id],
      'TRIP_CANCELLED',
      { data: { trip_id: trip.id } }
    );
  } catch (err) {
    console.warn('[tripService] cancel notification failed:', err.message);
  }

  await Booking.update(
    {
      status: BOOKING_STATUS.CANCELLED,
      cancellationReason: 'Trip cancelled by driver',
      cancelledBy: driverId,
      cancelledAt: new Date(),
    },
    { where: { tripId: trip.id, status: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] } }
  );

  const seats = await TripSeat.findAll({ where: { tripId: trip.id }, attributes: ['seatNumber'] });
  for (const seat of seats) {
    try {
      await releaseSeatLock(trip.id, seat.seatNumber);
    } catch (err) {
      console.warn(`[tripService] failed to release seat lock for trip ${trip.id} seat ${seat.seatNumber}:`, err.message);
    }
  }

  // Reflect the cancellation in the cached driver + passenger homes.
  await homeService.invalidateHomeForTrip(trip.id, driverId);

  trackTripMutation({
    action: 'trip.cancelled',
    driverId,
    tripId: trip.id,
    payload: { status: trip.status, notified_passengers: notifiedPassengers },
  });

  return {
    trip: {
      id: trip.id,
      status: trip.status,
      notified_passengers: notifiedPassengers,
    },
  };
}

/**
 * Get the attribute key/value pairs for a trip (contract D11).
 */
async function getTripAttributes(tripId) {
  const trip = await Trip.findByPk(tripId, { attributes: ['id'] });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');

  const attributes = await TripAttribute.findAll({ where: { tripId: trip.id } });
  return {
    trip_id: trip.id,
    attributes: attributes.map((a) => ({ attr_key: a.attrKey, attr_value: a.attrValue })),
  };
}

/**
 * Count the number of trip_cancellation penalties for a driver in the last 30 days.
 */
async function countRecentCancellations(driverId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const count = await Penalty.count({
    where: {
      userId: driverId,
      penaltyType: PENALTY_CATEGORY.TRIP_CANCELLATION,
      createdat: { [Op.gte]: thirtyDaysAgo },
    },
  });
  return count;
}

/**
 * Determine the escalation level based on cancellation count.
 * Returns { severity, suspensionDays }.
 */
function getEscalationLevel(cancellationCount) {
  if (cancellationCount >= CANCELLATION_ESCALATION.SUSPENSION_30D_MIN) {
    return { severity: PENALTY_SEVERITY.MAJOR, suspensionDays: 30 };
  }
  if (cancellationCount >= CANCELLATION_ESCALATION.SUSPENSION_7D_MIN) {
    return { severity: PENALTY_SEVERITY.MAJOR, suspensionDays: 7 };
  }
  if (cancellationCount >= CANCELLATION_ESCALATION.WARNING_MIN) {
    return { severity: PENALTY_SEVERITY.MODERATE, suspensionDays: null };
  }
  return { severity: PENALTY_SEVERITY.MINOR, suspensionDays: null };
}

/**
 * Apply escalation after a cancellation penalty: check 30-day window count,
 * upgrade penalty severity, and apply suspension if needed.
 */
async function applyEscalation(penalty, driverId) {
  const count = await countRecentCancellations(driverId);
  const { severity, suspensionDays } = getEscalationLevel(count);

  if (severity !== penalty.severity) {
    const update = { severity };
    if (suspensionDays) {
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + suspensionDays);
      update.endsAt = endsAt;
    }
    await penalty.update(update);
  }

  if (suspensionDays) {
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + suspensionDays);
    await User.update({ status: 'suspended' }, { where: { id: driverId } });

    const driver = await User.findByPk(driverId);
    if (driver) {
      try {
        await notificationService.sendToUser(driver, 'PENALTY_ISSUED', {
          channels: ['in_app', 'push'],
          vars: {
            severity: `suspension (${suspensionDays} days)`,
            reason: 'Repeated trip cancellations',
          },
          data: { penalty_id: penalty.id },
        });
      } catch (err) {
        console.warn('[tripService] penalty notification failed:', err.message);
      }
    }
  } else if (severity === PENALTY_SEVERITY.MODERATE) {
    const driver = await User.findByPk(driverId);
    if (driver) {
      try {
        await notificationService.sendToUser(driver, 'PENALTY_ISSUED', {
          channels: ['in_app', 'push'],
          vars: {
            severity: 'warning',
            reason: 'Repeated trip cancellations',
          },
          data: { penalty_id: penalty.id },
        });
      } catch (err) {
        console.warn('[tripService] penalty notification failed:', err.message);
      }
    }
  }

  return { count, severity, suspensionDays };
}

/**
 * Cancel a trip with penalty (new flow per spec 008).
 * Only allowed when: driver owns trip, status is published/full, zero confirmed bookings.
 * Creates a penalty record and applies escalation logic.
 */
async function cancelTripWithPenalty(driverId, tripId, { reason, note }) {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS');

  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('TRIP_IS_ALREADY_ONGOING_OR_COMPLETED_CANNOT_CANCEL');
  }
  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw ApiErrors.custom('TRIP_IS_ALREADY_CANCELLED', 409, 'ALREADY_CANCELLED');
  }

  const confirmedCount = await Booking.count({
    where: { tripId: trip.id, status: BOOKING_STATUS.CONFIRMED },
  });
  if (confirmedCount > 0) {
    throw ApiErrors.conflict('CANNOT_CANCEL_TRIP_THERE_ARE_CONFIRMED_BOOKINGS_PLEASE_CONTACT_SUPPORT');
  }

  await trip.update({ status: TRIP_STATUS.CANCELLED });

  const penalty = await Penalty.create({
    userId: driverId,
    tripId: trip.id,
    type: PENALTY_TYPES.WARNING,
    penaltyType: PENALTY_CATEGORY.TRIP_CANCELLATION,
    severity: PENALTY_SEVERITY.MINOR,
    reason: reason,
    details: note || null,
    startsAt: new Date(),
    issuedBy: driverId,
  });

  const escalation = await applyEscalation(penalty, driverId);

  let notifiedPassengers = 0;
  try {
    notifiedPassengers = await notificationService.notifyBookedPassengers(
      [trip.id],
      'TRIP_CANCELLED',
      { data: { trip_id: trip.id } }
    );
  } catch (err) {
    console.warn('[tripService] cancel notification failed:', err.message);
  }

  await homeService.invalidateHomeForTrip(trip.id, driverId);

  trackTripMutation({
    action: 'trip.cancelled_by_driver',
    driverId,
    tripId: trip.id,
    payload: {
      status: trip.status,
      reason,
      note,
      penalty_id: penalty.id,
      escalation_count: escalation.count,
      escalation_severity: escalation.severity,
      notified_passengers: notifiedPassengers,
    },
  });

  return {
    message: 'TRIP_CANCELLED_SUCCESSFULLY',
    trip_id: trip.id,
    status: trip.status,
    penalty_id: penalty.id,
    penalty_type: escalation.severity,
  };
}
export { createTrip, getTripById, getTripOptions, getTripSeats, getDriverTrips, getAvailableTrips, startTrip, completeTrip, updateTrip, cancelTrip, cancelTripWithPenalty, getTripAttributes, getTripPassengers };
export default module.exports;