const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Trip, TripSeat, Booking, Rating, User, Vehicle } = require('../Models');
const { TRIP_STATUS } = require('../config/constants');
const { REDIS_KEYS, CACHE_TTL } = require('../utils/redisKeys');
const { getKey, setKey } = require('../config/redis');
const { ApiErrors } = require('../utils/ApiError');

/**
 * Get driver dashboard data with caching
 */
const getDashboard = async (driverId) => {
  // Check cache first
  const cacheKey = REDIS_KEYS.DRIVER_DASHBOARD(driverId);
  const cached = await getKey(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const driver = await User.findByPk(driverId);
  if (!driver) throw ApiErrors.notFound('USER_NOT_FOUND');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's trips
  const todayTrips = await Trip.findAll({
    where: {
      driverId,
      departureTime: { [Op.and]: [{ [Op.gte]: today }, { [Op.lt]: tomorrow }] },
      status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.IN_PROGRESS] },
    },
    include: [{ model: TripSeat, as: 'seats' }],
    order: [['departure_time', 'ASC']],
  });

  // Upcoming trips (after today)
  const upcomingTrips = await Trip.findAll({
    where: {
      driverId,
      departureTime: { [Op.gte]: tomorrow },
      status: TRIP_STATUS.PUBLISHED,
    },
    include: [{ model: TripSeat, as: 'seats' }],
    order: [['departure_time', 'ASC']],
    limit: 10,
  });

  // Total completed trips
  const totalCompleted = await Trip.count({
    where: { driverId, status: TRIP_STATUS.COMPLETED },
  });

  // Monthly earnings
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyEarnings = await Booking.sum('agreedFare', {
    include: [
      {
        model: Trip,
        as: 'trip',
        where: { driverId },
        attributes: [],
      },
    ],
    where: {
      status: 'confirmed',
      createdat: { [Op.gte]: monthStart },
    },
  });

  // Average rating
  const ratingResult = await Rating.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('stars')), 'avgRating']],
    where: { rateeId: driverId },
  });
  const avgRating = ratingResult?.get('avgRating') ? parseFloat(ratingResult.get('avgRating')) : null;

  // Recent reservation history
  const recentBookings = await Booking.findAll({
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
    limit: 10,
  });

  const dashboard = {
    account: {
      driver_id: driver.id,
      full_name: driver.fullName,
      phone: driver.phone,
      rating: avgRating || 0,
      total_trips_completed: totalCompleted,
      verified: driver.isVerified,
      profile_picture_url: driver.avatarUrl,
    },
    schedule: {
      today: todayTrips.map((t) => ({
        trip_id: t.id,
        origin_city: t.originCity,
        destination_city: t.destinationCity,
        departure_time: t.departureTime,
        available_seats: t.availableSeats,
        total_seats: t.totalSeats,
        status: t.status,
      })),
      upcoming: upcomingTrips.map((t) => ({
        trip_id: t.id,
        origin_city: t.originCity,
        destination_city: t.destinationCity,
        departure_time: t.departureTime,
        available_seats: t.availableSeats,
        total_seats: t.totalSeats,
        status: t.status,
      })),
    },
    summary: {
      today_trips_count: todayTrips.length,
      total_completed_trips: totalCompleted,
      monthly_earnings: monthlyEarnings || 0,
      avg_passenger_rating: avgRating ? parseFloat(avgRating.toFixed(1)) : 0,
    },
    reservation_history: {
      recent: recentBookings.map((b) => ({
        booking_id: b.id,
        trip: {
          trip_id: b.trip.id,
          origin_city: b.trip.originCity,
          destination_city: b.trip.destinationCity,
          departure_time: b.trip.departureTime,
        },
        passenger_name: b.passenger?.fullName || 'Unknown',
        seats_booked: b.seatsBooked,
        status: b.status,
        agreed_fare: b.agreedFare,
        created_at: b.createdAt,
        rating_received: b.rating || null,
      })),
      pagination: {
        total: recentBookings.length,
        page: 1,
        limit: 10,
      },
    },
  };

  // Cache for 30 seconds
  await setKey(cacheKey, JSON.stringify(dashboard), CACHE_TTL.DASHBOARD);

  return dashboard;
};

/**
 * Invalidate dashboard cache (call after trip/booking mutations)
 */
const invalidateDashboardCache = async (driverId) => {
  const { deleteKey } = require('../config/redis');
  await deleteKey(REDIS_KEYS.DRIVER_DASHBOARD(driverId));
};

module.exports = {
  getDashboard,
  invalidateDashboardCache,
};
