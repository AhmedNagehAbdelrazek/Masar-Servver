const { Op } = require('sequelize');
const { User, DriverProfile, Trip, Booking, Vehicle } = require('../Models');
const { TRIP_STATUS, BOOKING_STATUS, FREE_OFFER_TYPE } = require('../config/constants');
const { ApiErrors } = require('../utils/ApiError');
const balanceService = require('./balanceService');
const subscriptionService = require('./subscriptionService');
const { REDIS_KEYS, CACHE_TTL } = require('../utils/redisKeys');
const { getKey, setKey, deleteKey } = require('../config/redis');
const { seatNumbersFor } = require('../utils/seatSerializer');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toDriverSection(user, profile) {
  return {
    id: user.id,
    full_name: user.fullName,
    profile_picture_url: user.avatarUrl,
    rating: Number(user.avgRating || 0),
    total_trips_completed: Number((profile && profile.totalTrips) || 0),
  };
}

/**
 * Free-trips info from the subscription's offer snapshot. Returns null when
 * the subscription has no free-trips offer (e.g. paid plans, credit offers).
 */
function freeTripsFor(sub) {
  if (!sub || !sub.freeOffer || sub.freeOffer.type !== FREE_OFFER_TYPE.TRIPS) return null;
  const limit = Number(sub.freeOffer.value) || 0;
  const used = Number(sub.freeTripsUsed) || 0;
  return { max: limit, used, remaining: Math.max(0, limit - used) };
}

/**
 * Home `subscription` section per C1: always present, free-tier defaults when
 * the driver has no active non-expired plan.
 */
async function toSubscriptionSection(driverId) {
  const current = await balanceService.findCurrentSubscription(driverId);
  if (!current) {
    return { tier: 'free', price: 0, currency: 'JOD', expires_at: null, days_remaining: 0, free_trips: null };
  }
  const now = Date.now();
  const daysRemaining = Math.max(0, Math.ceil((new Date(current.expiresAt).getTime() - now) / DAY_MS));
  return {
    tier: String(current.planName || 'free').toLowerCase(),
    price: Number(current.planCost || 0),
    currency: 'JOD',
    expires_at: current.expiresAt,
    days_remaining: daysRemaining,
    free_trips: freeTripsFor(current),
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

  return {
    trip_id: trip.id,
    origin_city: trip.originCity,
    origin_area: trip.originArea,
    destination_city: trip.destinationCity,
    destination_area: trip.destinationArea,
    departure_time: trip.departureTime,
    fare_per_seat: Number(trip.farePerSeat),
    currency: trip.currency || 'JOD',
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    booked_seats_count: bookedSeatsCount,
    vehicle: vehicle
      ? {
          make_model: [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '),
          year: vehicle.modelYear,
          plate_number: vehicle.plateNumber,
          color: vehicle.color,
        }
      : null,
    status: trip.status,
    passengers: bookings.map((b) => ({
      booking_id: b.id,
      passenger_name: b.passenger ? b.passenger.fullName : 'Unknown',
      seats_booked: b.seatsBooked,
      seat_numbers: seatNumbersFor(b),
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
    order: [['createdat', 'DESC']],
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
  if (!user) throw ApiErrors.notFound('User not found');
  const profile = await DriverProfile.findOne({ where: { driverId } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayWindow = { [Op.gte]: today, [Op.lt]: tomorrow };

  const [subscription, nextTrip, completedToday, tripsToday, recentBookings] = await Promise.all([
    toSubscriptionSection(driverId),
    Trip.findOne({
      where: {
        driverId,
        status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] },
      },
      include: [
        { model: Vehicle, as: 'vehicle' },
        {
          model: Booking,
          as: 'bookings',
          required: false,
          where: { status: BOOKING_STATUS.CONFIRMED },
          include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName'] }],
        },
      ],
      order: [['departure_time', 'ASC']],
    }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.COMPLETED, departureTime: todayWindow } }),
    Trip.count({ where: { driverId, departureTime: todayWindow } }),
    toRecentBookings(driverId),
  ]);

  const nextTripPayload = toNextTrip(nextTrip);

  return {
    driver: toDriverSection(user, profile),
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
 * Combined driver home payload, cached in Redis for 30s.
 */
async function getHome(driverId) {
  const cacheKey = REDIS_KEYS.DRIVER_HOME(driverId);
  const cached = await getKey(cacheKey);
  if (cached) return JSON.parse(cached);

  const payload = await buildHome(driverId);
  await setKey(cacheKey, JSON.stringify(payload), CACHE_TTL.HOME);
  return payload;
}

async function invalidateHomeCache(driverId) {
  await deleteKey(REDIS_KEYS.DRIVER_HOME(driverId));
}

/**
 * Current plan + history for the dedicated subscription page (C4).
 */
async function getSubscription(driverId) {
  const current = await balanceService.findCurrentSubscription(driverId);
  const history = await subscriptionService.getMySubscriptions(driverId);

  return {
    subscription: current
      ? {
          tier: String(current.planName || 'free').toLowerCase(),
          price: Number(current.planCost || 0),
          currency: 'JOD',
          expires_at: current.expiresAt,
          days_remaining: Math.max(
            0,
            Math.ceil((new Date(current.expiresAt).getTime() - Date.now()) / DAY_MS)
          ),
          balance: Number(current.balance || 0),
          plan_name: current.planName,
          free_trips: freeTripsFor(current),
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

module.exports = { getHome, invalidateHomeCache, getSubscription };
