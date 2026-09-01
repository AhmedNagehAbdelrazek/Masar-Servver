const { Op } = require('sequelize');
const { DriverProfile, Trip, Rating } = require('../Models');
const { TRIP_STATUS } = require('../config/constants');

const PROFESSIONAL_MIN_TRIPS = 20;
const PROFESSIONAL_MIN_PUNCTUALITY = 90;

/**
 * Driver performance stats (spec 012 US5).
 *
 * Materialises derivable performance columns onto `driver_profiles` so the
 * passenger-facing driver reveal does not recompute them on every request:
 *   - totalTrips         -> number of completed trips
 *   - punctualityRate    -> % of rated rides that were not late (or null/none)
 *   - professionalDriver -> completed >= PROFESSIONAL_MIN_TRIPS AND
 *                           punctuality (if known) >= PROFESSIONAL_MIN_PUNCTUALITY
 */
async function recomputeForDriver(driverId) {
  const completedTrips = await Trip.count({
    where: { driverId, status: TRIP_STATUS.COMPLETED },
  });

  const ratings = await Rating.findAndCountAll({
    where: { rateeId: driverId, isVisible: true },
    attributes: ['wasLate'],
  });

  let punctuality = null;
  if (ratings.count > 0) {
    const onTime = ratings.rows.filter((r) => !r.wasLate).length;
    punctuality = Math.round((onTime / ratings.count) * 10000) / 100;
  }

  const professional =
    completedTrips >= PROFESSIONAL_MIN_TRIPS &&
    (punctuality == null || punctuality >= PROFESSIONAL_MIN_PUNCTUALITY);

  const [profile] = await DriverProfile.findOrCreate({
    where: { driverId },
    defaults: { driverId },
  });

  await profile.update({
    totalTrips: completedTrips,
    punctualityRate: punctuality,
    professionalDriver: professional,
  });

  return {
    driverId,
    completedTrips,
    punctualityRate: punctuality,
    professionalDriver: professional,
  };
}

/**
 * Recompute stats for every driver that has any activity (a trip or a rating)
 * so the one-off/batch job converges with a single pass.
 */
async function recomputeAllDrivers() {
  const tripDrivers = await Trip.findAll({
    where: { driverId: { [Op.not]: null } },
    attributes: ['driverId'],
    group: ['driverId'],
  });
  const ratingDrivers = await Rating.findAll({
    where: { rateeId: { [Op.not]: null } },
    attributes: ['rateeId'],
    group: ['rateeId'],
  });

  const ids = new Set(
    [...tripDrivers.map((r) => r.driverId), ...ratingDrivers.map((r) => r.rateeId)].filter(Boolean)
  );

  const results = [];
  for (const driverId of ids) {
    results.push(await recomputeForDriver(driverId));
  }
  return results;
}

module.exports = { recomputeForDriver, recomputeAllDrivers };
