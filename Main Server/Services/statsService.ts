// @ts-nocheck
import { Op } from 'sequelize';
import { User, Trip, Booking, DriverProfile } from '../Models';
import { TRIP_STATUS, BOOKING_STATUS } from '../config/constants';

/**
 * Lifetime driver statistics (contract D10). Read-only aggregation over the
 * existing status transitions; returns zeros for empty accounts.
 */
async function lifetime(driverId) {
  const user = await User.findByPk(driverId, { attributes: ['id', 'avgRating'] });
  const profile = await DriverProfile.findOne({
    where: { driverId },
    attributes: ['responseRate'],
  });

  const totalTrips = await Trip.count({ where: { driverId } });
  const completedTrips = await Trip.count({ where: { driverId, status: TRIP_STATUS.COMPLETED } });
  const cancelledTrips = await Trip.count({ where: { driverId, status: TRIP_STATUS.CANCELLED } });

  const tripIds = await Trip.findAll({
    where: { driverId },
    attributes: ['id'],
  }).then((rows) => rows.map((r) => r.id));

  let totalBookings = 0;
  let noShowBookings = 0;
  let totalEarnings = 0;

  if (tripIds.length > 0) {
    totalBookings = await Booking.count({
      where: { tripId: { [Op.in]: tripIds } },
    });
    noShowBookings = await Booking.count({
      where: { tripId: { [Op.in]: tripIds }, status: BOOKING_STATUS.NO_SHOW },
    });
    const earnings = await Booking.findOne({
      attributes: [
        [fn('SUM', col('agreed_fare')), 'total'],
      ],
      where: { tripId: { [Op.in]: tripIds }, status: BOOKING_STATUS.COMPLETED },
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
export { lifetime };
export default module.exports;