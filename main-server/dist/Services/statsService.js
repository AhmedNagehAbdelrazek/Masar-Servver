"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lifetime = lifetime;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
/**
 * Lifetime driver statistics (contract D10). Read-only aggregation over the
 * existing status transitions; returns zeros for empty accounts.
 */
async function lifetime(driverId) {
    const user = await Models_1.User.findByPk(driverId, { attributes: ['id', 'avgRating'] });
    const profile = await Models_1.DriverProfile.findOne({
        where: { driverId },
        attributes: ['responseRate'],
    });
    const totalTrips = await Models_1.Trip.count({ where: { driverId } });
    const completedTrips = await Models_1.Trip.count({ where: { driverId, status: constants_1.TRIP_STATUS.COMPLETED } });
    const cancelledTrips = await Models_1.Trip.count({ where: { driverId, status: constants_1.TRIP_STATUS.CANCELLED } });
    const tripIds = await Models_1.Trip.findAll({
        where: { driverId },
        attributes: ['id'],
    }).then((rows) => rows.map((r) => r.id));
    let totalBookings = 0;
    let noShowBookings = 0;
    let totalEarnings = 0;
    if (tripIds.length > 0) {
        totalBookings = await Models_1.Booking.count({
            where: { tripId: { [sequelize_1.Op.in]: tripIds } },
        });
        noShowBookings = await Models_1.Booking.count({
            where: { tripId: { [sequelize_1.Op.in]: tripIds }, status: constants_1.BOOKING_STATUS.NO_SHOW },
        });
        const earnings = await Models_1.Booking.findOne({
            attributes: [
                [fn('SUM', col('agreed_fare')), 'total'],
            ],
            where: { tripId: { [sequelize_1.Op.in]: tripIds }, status: constants_1.BOOKING_STATUS.COMPLETED },
            raw: true,
        });
        totalEarnings = Number(earnings && earnings.total ? earnings.total : 0);
    }
    const noShowRate = totalBookings === 0 ? 0 : Math.round((noShowBookings / totalBookings) * 1000) / 10;
    const responseRate = profile ? Number(profile.responseRate) : 0;
    const avgRating = user ? Number(user.avgRating || 0) : 0;
    return {
        stats: {
            total_trips: totalTrips,
            total_bookings: totalBookings,
            no_show_rate: noShowRate,
            response_rate: responseRate,
            avg_rating: avgRating,
            total_earnings: totalEarnings,
            completed_trips: completedTrips,
            cancelled_trips: cancelledTrips,
        },
    };
}
module.exports = { lifetime };
exports.default = module.exports;
//# sourceMappingURL=statsService.js.map