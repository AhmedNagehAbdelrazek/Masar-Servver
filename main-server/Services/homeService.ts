// @ts-nocheck
import { Op } from 'sequelize';
import { User, DriverProfile, Trip, Booking, Vehicle, Rating, TripStop, TripAttribute } from '../Models';
import { TRIP_STATUS, BOOKING_STATUS } from '../config/constants';
import { ApiErrors } from '../utils/ApiError';
import balanceService from './balanceService';
import subscriptionService from './subscriptionService';
import recentSearchService from './recentSearchService';
import realtimeService from './realtimeService';
import { seatNumbersFor } from '../utils/seatSerializer';
import { hasFreeTripsOffer, freeTripsLimit } from '../utils/freeTrips';
import { jordanStartOfToday } from '../utils/time';

// NOTE: home payloads are intentionally NEVER cached (a stale next_trip is
// worse than a fresh query). The invalidate* exports below stay as no-ops /
// socket-only notifiers so existing call sites keep working.
// The expiry sweep is lazy-required to avoid a module cycle
// (tripService -> homeService -> tripExpiryService -> tripService).
function sweepStaleTrips(tripIds) {
  try {
    const { refreshStaleTrips } = require('./tripExpiryService');
    return refreshStaleTrips(tripIds);
  } catch (err) {
    console.warn('[homeService] expiry sweep failed:', err.message);
    return Promise.resolve({ touched: 0 });
  }
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDriverSection(user, profile, vehicle) {
  return {
    id: user.id,
    full_name: user.fullName,
    profile_picture_url: user.avatarUrl,
    rating: Number(user.avgRating || 0),
    total_trips_completed: Number((profile && profile.totalTrips) || 0),
    gender: user.gender ?? null,
    // Same field name as the dashboard account block, so the home screen can
    // render the vehicle's seat count even when there is no next trip.
    vehicle_seats_number: vehicle ? vehicle.seats : null,
  };
}

/**
 * Free-trips info from the subscription's offer snapshot. Returns null when
 * the subscription has no free-trips offer (e.g. paid plans, credit offers).
 */
function freeTripsFor(sub) {
  if (!hasFreeTripsOffer(sub)) return null;
  const limit = freeTripsLimit(sub);
  const used = Number(sub.freeTripsUsed) || 0;
  return { max: limit, used, remaining: Math.max(0, limit - used) };
}

async function toSubscriptionSection(driverId) {
  const current = await balanceService.findCurrentSubscription(driverId);
  if (!current) {
    return { tier: 'free', price: 0, currency: 'JOD', expires_at: null, days_remaining: 0, free_trips: null, is_active: false };
  }
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((new Date(current.expiresAt).getTime() - now) / DAY_MS));
  const isActive = current.status === 'active' && new Date(current.expiresAt).getTime() > now;
  return {
    tier: String(current.planName || 'free').toLowerCase(),
    price: Number(current.planCost || 0),
    currency: 'JOD',
    expires_at: current.expiresAt,
    days_remaining: daysRemaining,
    free_trips: freeTripsFor(current),
    is_active: isActive,
  };
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toTripStops(stops) {
  return (stops || [])
    .slice()
    .sort((a, b) => Number(a.stopOrder ?? 0) - Number(b.stopOrder ?? 0))
    .map((s) => ({
      stop_id: s.id,
      stop_order: s.stopOrder,
      stop_name: s.stopName,
      city: s.city,
      address: s.address,
      lat: toNumber(s.lat != null ? s.lat : s.stopLat),
      lng: toNumber(s.lng != null ? s.lng : s.stopLng),
      stop_type: s.stopType,
      estimated_arrival: s.estimatedArrival,
    }));
}

function toTripAttributes(attributes) {
  return (attributes || []).map((a) => ({ key: a.attrKey, value: a.attrValue === 'true' }));
}

function toRouteSection(trip) {
  return {
    status: trip.routeStatus || 'pending',
    version: Number(trip.routeVersion) || 0,
    polyline: trip.routePolyline || null,
    distance_m: toNumber(trip.routeDistanceM),
    duration_s: toNumber(trip.routeDurationS),
    computed_at: trip.routeComputedAt || null,
  };
}

function toPickupSection(booking) {
  return {
    type: booking.pickupType || null,
    stop_id: booking.pickupStopId || null,
    place: booking.pickupPlace || null,
    label: booking.pickupLabel || null,
    city: booking.pickupCity || null,
    area: booking.pickupArea || null,
    lat: toNumber(booking.pickupLat),
    lng: toNumber(booking.pickupLng),
    order: booking.pickupOrder ?? null,
    status: booking.pickupStatus || 'pending',
    detour_seconds: toNumber(booking.detourSeconds),
    arrived_at: booking.arrivedAt || null,
    picked_up_at: booking.pickedUpAt || null,
  };
}

function toTripDetails(trip) {
  const stops = trip.stops || [];
  return {
    trip_id: trip.id,
    origin: {
      city: trip.originCity,
      area: trip.originArea,
      address: trip.originAddress || null,
      lat: toNumber(trip.originLat),
      lng: toNumber(trip.originLng),
    },
    destination: {
      city: trip.destinationCity,
      area: trip.destinationArea,
      address: trip.destinationAddress || null,
      lat: toNumber(trip.destinationLat),
      lng: toNumber(trip.destinationLng),
    },
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime || null,
    fare_per_seat: Number(trip.farePerSeat),
    total_profit: Number(trip.totalProfit) || 0,
    currency: trip.currency || 'JOD',
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    status: trip.status,
    is_recurring: Boolean(trip.isRecurring),
    recurrence_days: trip.recurrenceDays || [],
    recurrence_end_date: trip.recurrenceEndDate || null,
    gender_preference: trip.genderPreference || 'all',
    attributes: toTripAttributes(trip.attributes),
    stops: toTripStops(stops),
    waypoints: stops.map((s) => ({
      stop_name: s.stopName,
      stop_lat: toNumber(s.lat != null ? s.lat : s.stopLat),
      stop_lng: toNumber(s.lng != null ? s.lng : s.stopLng),
    })),
    instructions: trip.driverInstructions || [],
    additional_instructions: trip.additionalInstructions || null,
    created_at: trip.createdat || trip.createdAt || null,
    route: toRouteSection(trip),
  };
}

function toNextTrip(trip) {
  if (!trip) return null;
  const bookings = trip.bookings || [];
  const bookedSeatsCount = bookings.reduce((sum, b) => sum + Number(b.seatsBooked || 0), 0);
  const canStart =
    [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL].includes(trip.status) &&
    new Date(trip.departureTime).getTime() - Date.now() <= HOUR_MS;
  const vehicle = trip.vehicle;
  const stops = trip.stops || [];

  return {
    trip_id: trip.id,
    origin_city: trip.originCity,
    origin_area: trip.originArea,
    origin_address: trip.originAddress || null,
    origin_lat: toNumber(trip.originLat),
    origin_lng: toNumber(trip.originLng),
    destination_city: trip.destinationCity,
    destination_area: trip.destinationArea,
    destination_address: trip.destinationAddress || null,
    destination_lat: toNumber(trip.destinationLat),
    destination_lng: toNumber(trip.destinationLng),
    departure_time: trip.departureTime,
    arrival_time: trip.arrivalTime || null,
    fare_per_seat: Number(trip.farePerSeat),
    total_profit: Number(trip.totalProfit) || 0,
    currency: trip.currency || 'JOD',
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    booked_seats_count: bookedSeatsCount,
    is_recurring: Boolean(trip.isRecurring),
    recurrence_days: trip.recurrenceDays || [],
    recurrence_end_date: trip.recurrenceEndDate || null,
    gender_preference: trip.genderPreference || 'all',
    attributes: toTripAttributes(trip.attributes),
    stops: toTripStops(stops),
    waypoints: stops.map((s) => ({
      stop_name: s.stopName,
      stop_lat: toNumber(s.lat != null ? s.lat : s.stopLat),
      stop_lng: toNumber(s.lng != null ? s.lng : s.stopLng),
    })),
    instructions: trip.driverInstructions || [],
    additional_instructions: trip.additionalInstructions || null,
    created_at: trip.createdat || trip.createdAt || null,
    route: toRouteSection(trip),
    vehicle: vehicle
      ? {
          vehicle_id: vehicle.id,
          vehicle_type: vehicle.vehicleType,
          make_model: [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '),
          year: vehicle.modelYear,
          plate_number: vehicle.plateNumber,
          color: vehicle.color,
          seats: vehicle.seats,
        }
      : null,
    status: trip.status,
    passengers: bookings.map((b) => ({
      booking_id: b.id,
      passenger_id: b.passenger ? b.passenger.id : null,
      passenger_name: b.passenger ? b.passenger.fullName : 'Unknown',
      passenger_phone: b.passenger ? b.passenger.phone : null,
      seats_booked: b.seatsBooked,
      seat_numbers: seatNumbersFor(b),
      agreed_fare: Number(b.agreedFare),
      status: b.status,
      pickup: toPickupSection(b),
      created_at: b.createdat || b.createdAt,
    })),
    can_start: canStart,
  };
}

async function toRecentBookings(driverId) {
  const bookings = await Booking.findAll({
    include: [
      {
        model: Trip,
        as: 'trip',
        where: { driverId },
        attributes: ['id', 'originCity', 'destinationCity', 'departureTime'],
      },
      {
        model: User,
        as: 'passenger',
        attributes: ['fullName'],
      },
    ],
    order: [[{ model: Trip, as: 'trip' }, 'departureTime', 'DESC']],
    limit: 5,
  });

  return bookings.map((b) => ({
    booking_id: b.id,
    trip: {
      trip_id: b.trip.id,
      origin_city: b.trip.originCity,
      destination_city: b.trip.destinationCity,
      departure_time: b.trip.departureTime,
    },
    passenger_name: b.passenger ? b.passenger.fullName : 'Unknown',
    seats_booked: b.seatsBooked,
    seat_numbers: seatNumbersFor(b),
    agreed_fare: Number(b.agreedFare),
    status: b.status,
    created_at: b.createdat || b.createdAt,
  }));
}

async function buildHome(driverId) {
  const user = await User.findByPk(driverId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');
  const profile = await DriverProfile.findOne({ where: { driverId } });

  // Close out anything that already expired so the home below reflects the
  // current state, not the last cron run.
  try {
    const activeIds = (
      await Trip.findAll({
        where: {
          driverId,
          isRecurring: false,
          status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL, TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING] },
        },
        attributes: ['id'],
      })
    ).map((t) => t.id);
    await sweepStaleTrips(activeIds);
  } catch (err) {
    console.warn('[homeService] pre-home sweep failed:', err.message);
  }

  // Jordan calendar day (never server-local midnight).
  const todayStart = jordanStartOfToday();
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);
  const todayWindow = { [Op.gte]: todayStart, [Op.lt]: tomorrowStart };
  const now = new Date();

  const [subscription, nextTrip, vehicle, completedToday, tripsToday, recentBookings] = await Promise.all([
    toSubscriptionSection(driverId),
    Trip.findOne({
      where: {
        driverId,
        status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] },
        // Upcoming only, earliest first: a stale published trip must never
        // surface as the "next" trip.
        departureTime: { [Op.gt]: now },
      },
      include: [
        { model: Vehicle, as: 'vehicle' },
        { model: TripStop, as: 'stops', separate: true, order: [['stopOrder', 'ASC']] },
        { model: TripAttribute, as: 'attributes', separate: true },
        {
          model: Booking,
          as: 'bookings',
          required: false,
          where: { status: BOOKING_STATUS.CONFIRMED },
          include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'] }],
        },
      ],
      order: [['departure_time', 'ASC']],
    }),
    Vehicle.findOne({ where: { driverId } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.COMPLETED, departureTime: todayWindow } }),
    Trip.count({ where: { driverId, departureTime: todayWindow } }),
    toRecentBookings(driverId),
  ]);

  const nextTripPayload = toNextTrip(nextTrip);

  return {
    driver: toDriverSection(user, profile, vehicle),
    subscription,
    next_trip: nextTripPayload,
    summary: {
      completed_trips_today: completedToday,
      reserved_seats_for_next_trip: nextTripPayload ? nextTripPayload.booked_seats_count : 0,
      trips_today: tripsToday,
    },
    recent_bookings: recentBookings,
  };
}

/**
 * Driver home payload — always built fresh, never cached.
 */
async function getHome(driverId) {
  return buildHome(driverId);
}

// No cache exists anymore; kept so existing call sites keep working.
async function invalidateHomeCache(_driverId) {}

/**
 * Current plan + history for the dedicated subscription page (C4).
 */
async function getSubscription(driverId) {
  const current = await balanceService.findCurrentSubscription(driverId);
  const history = await subscriptionService.getMySubscriptions(driverId);

  const now = Date.now();
  const isActive = current && current.status === 'active' && new Date(current.expiresAt).getTime() > now;

  return {
    subscription: current
      ? {
          tier: String(current.planName || 'free').toLowerCase(),
          price: Number(current.planCost || 0),
          currency: 'JOD',
          expires_at: current.expiresAt,
          days_remaining: Math.max(
            0,
            Math.ceil((new Date(current.expiresAt).getTime() - now) / DAY_MS)
          ),
          balance: Number(current.balance || 0),
          plan_name: current.planName,
          free_trips: freeTripsFor(current),
          is_active: isActive,
        }
      : null,
    history: history.map((s) => ({
      id: s.id,
      plan_name: s.plan.name,
      period_days: s.plan.period_days,
      balance: s.balance,
      status: s.status,
      created_at: s.created_at,
      expires_at: s.expires_at,
    })),
  };
}

const TRIP_DRIVER_ATTRS = ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'];
const VEHICLE_ATTRS = ['id', 'vehicleType', 'manufacturer', 'model', 'modelYear', 'plateNumber', 'color', 'seats'];

function toPassengerSection(user) {
  return {
    id: user.id,
    full_name: user.fullName,
    profile_picture_url: user.avatarUrl,
    rating: user.avgRating ? Number(user.avgRating) : null,
  };
}

function toNextBookingPayload(booking) {
  if (!booking || !booking.trip) return null;
  const trip = booking.trip;
  const driver = trip.driver ? trip.driver : null;
  const vehicle = trip.vehicle ? trip.vehicle : null;

  return {
    booking_id: booking.id,
    reference_code: booking.referenceCode,
    status: booking.status,
    payment_status: booking.paymentStatus,
    seats_booked: booking.seatsBooked,
    seat_numbers: seatNumbersFor(booking),
    agreed_fare: Number(booking.agreedFare),
    currency: booking.currency || 'JOD',
    pickup: toPickupSection(booking),
    dropoff_place: booking.dropoffPlace || null,
    dropoff_lat: toNumber(booking.dropoffLat),
    dropoff_lng: toNumber(booking.dropoffLng),
    dropoff_order: booking.dropoffOrder != null ? Number(booking.dropoffOrder) : null,
    dropoff_deadline: booking.dropoffDeadline || null,
    cancellation_reason: booking.cancellationReason || null,
    cancelled_at: booking.cancelledAt || null,
    completed_at: booking.completedAt || null,
    created_at: booking.createdat || booking.createdAt || null,
    trip: toTripDetails(trip),
    driver: driver
      ? {
          id: driver.id,
          full_name: driver.fullName,
          phone: driver.phone,
          rating: Number(driver.avgRating) || 0,
          image: driver.avatarUrl,
        }
      : null,
    vehicle: vehicle
      ? {
          vehicle_id: vehicle.id,
          type: vehicle.vehicleType,
          make_model: [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '),
          year: vehicle.modelYear,
          plate: vehicle.plateNumber,
          color: vehicle.color,
          seats: vehicle.seats,
          total_seats: vehicle.seats,
        }
      : null,
  };
}

function toLastTripPayload(booking) {
  const trip = booking.trip;
  if (!trip) return null;
  const ratingRow = (booking.ratings || [])[0];
  const driver = trip.driver || null;
  const vehicle = trip.vehicle || null;
  return {
    booking_id: booking.id,
    reference_code: booking.referenceCode,
    status: booking.status,
    payment_status: booking.paymentStatus,
    seats_booked: booking.seatsBooked,
    seat_numbers: seatNumbersFor(booking),
    agreed_fare: Number(booking.agreedFare),
    currency: booking.currency || 'JOD',
    pickup: toPickupSection(booking),
    dropoff_place: booking.dropoffPlace || null,
    dropoff_lat: toNumber(booking.dropoffLat),
    dropoff_lng: toNumber(booking.dropoffLng),
    dropoff_order: booking.dropoffOrder != null ? Number(booking.dropoffOrder) : null,
    dropoff_deadline: booking.dropoffDeadline || null,
    cancellation_reason: booking.cancellationReason || null,
    cancelled_at: booking.cancelledAt || null,
    completed_at: booking.completedAt || null,
    booking_created_at: booking.createdat || booking.createdAt || null,
    // Legacy summary fields kept for existing clients.
    trip_id: trip.id,
    origin: { city: trip.originCity, area: trip.originArea },
    destination: { city: trip.destinationCity, area: trip.destinationArea },
    departure_time: trip.departureTime,
    satisfaction_rating: ratingRow ? Number(ratingRow.stars) : null,
    trip_cost: Number(booking.agreedFare),
    // Full trip + driver/vehicle details.
    trip: toTripDetails(trip),
    driver: driver
      ? {
          id: driver.id,
          full_name: driver.fullName,
          phone: driver.phone,
          rating: Number(driver.avgRating) || 0,
          image: driver.avatarUrl,
        }
      : null,
    vehicle: vehicle
      ? {
          vehicle_id: vehicle.id,
          type: vehicle.vehicleType,
          make_model: [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '),
          year: vehicle.modelYear,
          plate: vehicle.plateNumber,
          color: vehicle.color,
          seats: vehicle.seats,
          total_seats: vehicle.seats,
        }
      : null,
  };
}

async function buildPassengerHome(passengerId) {
  const user = await User.findByPk(passengerId);
  if (!user) throw ApiErrors.notFound('USER_NOT_FOUND');

  const now = new Date();

  // Close out anything that already expired so the home below reflects the
  // current state, not the last cron run.
  try {
    const activeBookings = await Booking.findAll({
      where: { passengerId, status: { [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] } },
      attributes: ['tripId'],
    });
    await sweepStaleTrips(activeBookings.map((b) => b.tripId));
  } catch (err) {
    console.warn('[homeService] pre-home sweep failed:', err.message);
  }

  const nextBooking = await Booking.findOne({
    where: { passengerId, status: { [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] } },
    include: [
      {
        model: Trip,
        as: 'trip',
        where: { departureTime: { [Op.gte]: now } },
        include: [
          { model: User, as: 'driver', attributes: TRIP_DRIVER_ATTRS },
          { model: Vehicle, as: 'vehicle', attributes: VEHICLE_ATTRS },
          { model: TripStop, as: 'stops', separate: true, order: [['stopOrder', 'ASC']] },
          { model: TripAttribute, as: 'attributes', separate: true },
        ],
      },
    ],
    order: [[{ model: Trip, as: 'trip' }, 'departureTime', 'ASC']],
    limit: 1,
  });

  const [lastSearched, recentBookings] = await Promise.all([
    recentSearchService.getRecent(passengerId, 5),
    Booking.findAll({
      where: { passengerId },
      include: [
        {
          model: Trip,
          as: 'trip',
          include: [
            { model: User, as: 'driver', attributes: TRIP_DRIVER_ATTRS },
            { model: Vehicle, as: 'vehicle', attributes: VEHICLE_ATTRS },
            { model: TripStop, as: 'stops', separate: true, order: [['stopOrder', 'ASC']] },
            { model: TripAttribute, as: 'attributes', separate: true },
          ],
        },
        { model: Rating, as: 'ratings', attributes: ['stars'], where: { raterId: passengerId }, required: false },
      ],
      order: [[{ model: Trip, as: 'trip' }, 'departureTime', 'DESC']],
      limit: 10,
    }),
  ]);

  const lastTrips = recentBookings
    .filter((b) => b.trip && (b.status === BOOKING_STATUS.COMPLETED || new Date(b.trip.departureTime) < now))
    .slice(0, 5)
    .map(toLastTripPayload)
    .filter(Boolean);

  return {
    passenger: toPassengerSection(user),
    next_booking: toNextBookingPayload(nextBooking),
    last_searched_trips: lastSearched, // [{origin_city, destination_city, searched_on}]
    last_trips: lastTrips,
  };
}

/**
 * Passenger home payload — always built fresh, never cached.
 */
async function getPassengerHome(passengerId) {
  return buildPassengerHome(passengerId);
}

// No cache exists anymore; kept so existing call sites keep working.
async function invalidatePassengerHome(_passengerId) {}

/**
 * Notify participants of a trip mutation (open clients refresh their home).
 * There is no home cache to clear — homes are always built fresh.
 * Best-effort — never throws.
 */
async function invalidateHomeForTrip(tripId, driverId) {
  try {
    const bookings = await Booking.findAll({
      where: { tripId },
      attributes: ['passengerId'],
    });

    const userIds = new Set([driverId, ...bookings.map((b) => b.passengerId)]);
    for (const userId of userIds) {
      if (!userId) continue;
      try {
        realtimeService.emitToUser(userId, 'home:invalidate', { trip_id: tripId });
      } catch (_err) {
        // socket layer offline (e.g. tests) — ignore
      }
    }
  } catch (err) {
    console.warn('[homeService] home invalidation failed:', err.message);
  }
}

module.exports = { getHome, invalidateHomeCache, getSubscription, getPassengerHome, invalidatePassengerHome, invalidateHomeForTrip, toTripDetails };
export { getHome, invalidateHomeCache, getSubscription, getPassengerHome, invalidatePassengerHome, invalidateHomeForTrip, toTripDetails };
export default module.exports;