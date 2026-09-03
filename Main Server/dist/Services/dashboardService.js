"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateDashboardCache = exports.getDashboard = void 0;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const redisKeys_1 = require("../utils/redisKeys");
const redis_1 = require("../config/redis");
const ApiError_1 = require("../utils/ApiError");
const redis_2 = require("../config/redis");
/**
 * Get driver dashboard data with caching
 */
const getDashboard = async (driverId) => {
    // Check cache first
    const cacheKey = redisKeys_1.REDIS_KEYS.DRIVER_DASHBOARD(driverId);
    const cached = await (0, redis_1.getKey)(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    // Fetch fresh data
    const driver = await Models_1.User.findByPk(driverId);
    if (!driver)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Today's trips
    const todayTrips = await Models_1.Trip.findAll({
        where: {
            driverId,
            departureTime: { [sequelize_1.Op.and]: [{ [sequelize_1.Op.gte]: today }, { [sequelize_1.Op.lt]: tomorrow }] },
            status: { [sequelize_1.Op.in]: [constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.IN_PROGRESS] },
        },
        include: [{ model: Models_1.TripSeat, as: 'seats' }],
        order: [['departure_time', 'ASC']],
    });
    // Upcoming trips (after today)
    const upcomingTrips = await Models_1.Trip.findAll({
        where: {
            driverId,
            departureTime: { [sequelize_1.Op.gte]: tomorrow },
            status: constants_1.TRIP_STATUS.PUBLISHED,
        },
        include: [{ model: Models_1.TripSeat, as: 'seats' }],
        order: [['departure_time', 'ASC']],
        limit: 10,
    });
    // Total completed trips
    const totalCompleted = await Models_1.Trip.count({
        where: { driverId, status: constants_1.TRIP_STATUS.COMPLETED },
    });
    // Monthly earnings
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyEarnings = await Models_1.Booking.sum('agreedFare', {
        include: [
            {
                model: Models_1.Trip,
                as: 'trip',
                where: { driverId },
                attributes: [],
            },
        ],
        where: {
            status: 'confirmed',
            createdat: { [sequelize_1.Op.gte]: monthStart },
        },
    });
    // Average rating
    const ratingResult = await Models_1.Rating.findOne({
        attributes: [[database_1.default.fn('AVG', database_1.default.col('stars')), 'avgRating']],
        where: { rateeId: driverId },
    });
    const avgRating = ratingResult?.get('avgRating') ? parseFloat(ratingResult.get('avgRating')) : null;
    // Recent reservation history
    const recentBookings = await Models_1.Booking.findAll({
        include: [
            {
                model: Models_1.Trip,
                as: 'trip',
                where: { driverId },
                attributes: ['id', 'originCity', 'destinationCity', 'departureTime'],
            },
            {
                model: Models_1.User,
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
    await (0, redis_1.setKey)(cacheKey, JSON.stringify(dashboard), redisKeys_1.CACHE_TTL.DASHBOARD);
    return dashboard;
};
exports.getDashboard = getDashboard;
/**
 * Invalidate dashboard cache (call after trip/booking mutations)
 */
const invalidateDashboardCache = async (driverId) => {
    await (0, redis_2.deleteKey)(redisKeys_1.REDIS_KEYS.DRIVER_DASHBOARD(driverId));
};
exports.invalidateDashboardCache = invalidateDashboardCache;
module.exports = {
    getDashboard,
    invalidateDashboardCache,
};
exports.default = module.exports;
//# sourceMappingURL=dashboardService.js.map