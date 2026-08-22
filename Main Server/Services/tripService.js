const { Op } = require('sequelize');
const {
  Trip,
  TripSeat,
  TripStop,
  TripAttribute,
  Vehicle,
  User,
  Booking,
  DriverSubscription,
  SubscriptionPlan,
  Penalty,
} = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { TRIP_STATUS, GENDER_PREFERENCE, BOOKING_STATUS, FREE_OFFER_TYPE, PENALTY_TYPES, PENALTY_CATEGORY, PENALTY_SEVERITY, CANCELLATION_ESCALATION } = require('../config/constants');
const commissionService = require('./commissionService');
const notificationService = require('./notificationService');
const { releaseSeatLock } = require('../utils/seatLock');
const homeService = require('./homeService');
const { seatNumbersFor } = require('../utils/seatSerializer');
const auditService = require('./auditService');

/**
 * US3 minimum-balance gate. Rejects with NO_ACTIVE_PLAN when the driver has
 * no active plan, or INSUFFICIENT_BALANCE when the total balance cannot
 * cover the commission for one seat.
 */
async function assertCanPublish(driverId, farePerSeat) {
  const { current, minimum, totalBalance } = await commissionService.getGatingSnapshot(
    driverId,
    farePerSeat
  );
  if (!current) {
    throw ApiErrors.custom('You need an active plan to publish trips.', 422, 'NO_ACTIVE_PLAN');
  }
  if (totalBalance < minimum) {
    throw ApiErrors.custom(
      `Insufficient balance to publish trip. You need at least ${minimum.toFixed(2)} to cover commission for one seat. Current balance: ${totalBalance.toFixed(2)}.`,
      422,
      'INSUFFICIENT_BALANCE'
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

  const limit = Number(freeOffer.value);
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
    `You have used all ${limit} free trips included in your plan. Please subscribe to a paid plan to continue publishing trips.`,
    422,
    'FREE_TRIPS_EXHAUSTED'
  );
}

/**
 * Create a new trip with seats, waypoints, and recurrence
 */
const createTrip = async (driverId, data) => {
  // Verify driver exists and is verified
  const driver = await User.findByPk(driverId);
  if (!driver) throw ApiErrors.notFound('User not found');
  if (driver.role !== 'driver') throw ApiErrors.forbidden('Only drivers can create trips');
  if (!driver.isVerified) throw ApiErrors.forbidden('Driver not verified');

  // Fetch driver's vehicle (each driver has exactly one vehicle)
  const vehicle = await Vehicle.findOne({ where: { driverId } });
  if (!vehicle) throw ApiErrors.forbidden('Driver has no registered vehicle');
  if (!vehicle.isVerified) throw ApiErrors.forbidden('Driver vehicle is not verified');

  // Validate seat configuration matches vehicle
  if (data.seats.length !== vehicle.seats) {
    throw ApiErrors.validation('Seat count does not match vehicle total seats');
  }

  // Validate seat numbers are sequential 1 to N
  const seatNumbers = data.seats.map((s) => s.seat_number).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: vehicle.seats }, (_, i) => i + 1);
  if (JSON.stringify(seatNumbers) !== JSON.stringify(expectedNumbers)) {
    throw ApiErrors.validation('Seat numbers must be sequential from 1 to total seats');
  }

  // Validate at least one available seat
  const availableSeats = data.seats.filter((s) => s.type === 'available');
  if (availableSeats.length === 0) {
    throw ApiErrors.validation('At least one seat must be available');
  }

  // Validate exactly one driver seat
  const driverSeats = data.seats.filter((s) => s.type === 'driver');
  if (driverSeats.length !== 1) {
    throw ApiErrors.validation('Exactly one seat must be marked as driver');
  }

  // Validate departure time is in the future
  const departureDateTime = new Date(`${data.departure_date}T${data.departure_time}`);
  if (departureDateTime <= new Date()) {
    throw ApiErrors.validation('Departure time must be in the future');
  }

  // Validate recurrence
  const isRecurring = data.type_of_trip === 'repeated';
  if (isRecurring && (!data.repeated_days || data.repeated_days.length === 0)) {
    throw ApiErrors.validation('Repeated days are required for recurring trips');
  }
  if (isRecurring && !data.repeated_end_date) {
    throw ApiErrors.validation('End date is required for recurring trips');
  }
  if (isRecurring) {
    const endDate = new Date(data.repeated_end_date);
    if (endDate <= departureDateTime) {
      throw ApiErrors.validation('End date must be after departure date');
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

  // Create waypoints
  if (data.waypoints && data.waypoints.length > 0) {
    const stopRecords = data.waypoints.map((w, index) => ({
      tripId: trip.id,
      stopOrder: index + 1,
      stopName: w.stop_name || null,
      stopLat: w.stop_lat || null,
      stopLng: w.stop_lng || null,
    }));
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
    message: 'Trip published successfully!',
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
  if (!trip) throw ApiErrors.notFound('Trip not found');

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
 * Get trips for a driver
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
  return trips;
};

/**
 * Get available trips for passengers (with recurrence expansion)
 */
const getAvailableTrips = async (originCity, destinationCity, date, genderPreference = null) => {
  const queryDate = new Date(date);

  const where = {
    status: TRIP_STATUS.PUBLISHED,
    isModerated: false,
    availableSeats: { [Op.gt]: 0 },
    [Op.or]: [
      // One-time trips for this date
      {
        isRecurring: false,
        departureTime: {
          [Op.and]: [
            { [Op.gte]: new Date(queryDate.setHours(0, 0, 0, 0)) },
            { [Op.lt]: new Date(queryDate.setHours(23, 59, 59, 999)) },
          ],
        },
      },
      // Recurring trips matching this day of week
      {
        isRecurring: true,
        recurrenceDays: { [Op.contains]: [queryDate.getDay()] },
        recurrenceEndDate: { [Op.or]: [{ [Op.gte]: queryDate }, { [Op.is]: null }] },
      },
    ],
  };

  if (originCity) where.originCity = originCity;
  if (destinationCity) where.destinationCity = destinationCity;
  if (genderPreference && genderPreference !== GENDER_PREFERENCE.ALL) {
    where.genderPreference = { [Op.in]: [ genderPreference ] };
  }

  const trips = await Trip.findAll({
    where,
    include: [
      { model: TripSeat, as: 'seats', where: { seatType: 'available' } },
      { model: TripStop, as: 'stops' },
      { model: Vehicle, as: 'vehicle' },
    ],
    order: [['departure_time', 'ASC']],
  });

  return trips;
};

/**
 * Start a trip (US3). Re-verifies the minimum balance and marks the trip
 * in-progress. Sends an INSUFFICIENT_BALANCE_START notification when the
 * balance check fails.
 */
const startTrip = async (driverId, tripId) => {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('You can only start your own trips');

  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.custom('Trip cannot be started from its current status.', 422, 'INVALID_TRIP_STATUS');
  }

  // US2: departure window — reject starting more than 1 hour before departure.
  const now = Date.now();
  const START_WINDOW_MS = 60 * 60 * 1000;
  if (trip.departureTime.getTime() - now > START_WINDOW_MS) {
    throw ApiErrors.custom(
      'Trip cannot be started yet. It can only be started within one hour before departure.',
      400,
      'TOO_EARLY_TO_START'
    );
  }

  const { current, minimum, totalBalance } = await commissionService.getGatingSnapshot(
    driverId,
    trip.farePerSeat
  );
  if (!current) {
    throw ApiErrors.custom('You need an active plan to start trips.', 422, 'NO_ACTIVE_PLAN');
  }
  if (totalBalance < minimum) {
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
      'Your trip cannot be started because your balance is insufficient. Please subscribe to a plan.',
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
    message: 'Trip started successfully!',
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
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('You can only complete your own trips');

  if (![TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING].includes(trip.status)) {
    throw ApiErrors.custom('Trip cannot be completed from its current status.', 422, 'INVALID_TRIP_STATUS');
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
  getDriverTrips,
  getAvailableTrips,
  startTrip,
  completeTrip,
  updateTrip,
  cancelTrip,
  cancelTripWithPenalty,
  getTripAttributes,
};

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
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('You can only edit your own trips');
  if ([TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED].includes(trip.status)) {
    throw ApiErrors.custom('Trip cannot be edited from its current status.', 422, 'INVALID_TRIP_STATUS');
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
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('You can only cancel your own trips');
  if (
    [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING, TRIP_STATUS.COMPLETED].includes(trip.status)
  ) {
    throw ApiErrors.forbidden('A trip that has already started cannot be cancelled');
  }
  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw ApiErrors.custom('Trip is already cancelled.', 409, 'ALREADY_CANCELLED');
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
  if (!trip) throw ApiErrors.notFound('Trip not found');

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
  if (!trip) throw ApiErrors.notFound('Trip not found');
  if (trip.driverId !== driverId) throw ApiErrors.forbidden('You can only cancel your own trips');

  if (![TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status)) {
    throw ApiErrors.conflict('Trip is already ongoing or completed. Cannot cancel.');
  }
  if (trip.status === TRIP_STATUS.CANCELLED) {
    throw ApiErrors.conflict('Trip is already cancelled.');
  }

  const confirmedCount = await Booking.count({
    where: { tripId: trip.id, status: BOOKING_STATUS.CONFIRMED },
  });
  if (confirmedCount > 0) {
    throw ApiErrors.conflict('Cannot cancel trip. There are confirmed bookings. Please contact support.');
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
    message: 'Trip cancelled successfully. This cancellation has been recorded.',
    trip_id: trip.id,
    status: trip.status,
    penalty_id: penalty.id,
    penalty_type: escalation.severity,
  };
}
