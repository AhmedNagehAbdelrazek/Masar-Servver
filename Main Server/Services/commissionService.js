const { Op } = require('sequelize');
const { Booking } = require('../Models');
const { BOOKING_STATUS } = require('../config/constants');
const balanceService = require('./balanceService');

function round(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Minimum balance required to publish/start a trip with the given plan:
 * fare_per_seat × commission rate.
 */
function minimumBalanceForPlan(plan, farePerSeat) {
  const rate = plan ? Number(plan.planPercentageCut) : 0;
  return round(Number(farePerSeat) * (rate / 100));
}

/**
 * Current active plan + minimum balance for a driver (US3 gating).
 * Returns `{ current, minimum, totalBalance }`.
 */
async function getGatingSnapshot(driverId, farePerSeat) {
  const current = await balanceService.findCurrentSubscription(driverId);
  if (!current) {
    return { current: null, minimum: 0, totalBalance: 0 };
  }
  const overview = await balanceService.getBalanceOverview(driverId);
  return {
    current,
    minimum: minimumBalanceForPlan(current, farePerSeat),
    totalBalance: overview ? Number(overview.total_balance) : 0,
  };
}

/**
 * Compute total paid fare for a trip (confirmed/completed bookings).
 */
async function getTotalFare(tripId) {
  const bookings = await Booking.findAll({
    where: {
      tripId,
      status: { [Op.in]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED] },
    },
    attributes: ['agreedFare'],
  });
  return round(bookings.reduce((sum, b) => sum + Number(b.agreedFare), 0));
}

/**
 * Deduct commission at trip completion (T040).
 * Commission = total paid fare × current active plan rate (rate is the plan
 * active at completion time). Deduction is FIFO across active plans via
 * `balanceService.deductCommission`; any shortfall becomes debt and the
 * driver's trips are blocked.
 */
async function deductCommission(trip, actorId = null) {
  const totalFare = await getTotalFare(trip.id);

  const current = await balanceService.findCurrentSubscription(trip.driverId);
  const rate = current ? Number(current.planPercentageCut) : 0;
  const commission = round(totalFare * (rate / 100));

  const result = await balanceService.deductCommission({
    driverId: trip.driverId,
    amount: commission,
    actorId,
  });

  return {
    commission,
    rate,
    totalFare,
    planName: result.planName,
    balanceAfter: result.balanceAfter,
    isInDebt: result.isInDebt,
    shortfall: result.shortfall,
    tripsBlocked: result.tripsBlocked,
  };
}

module.exports = {
  round,
  minimumBalanceForPlan,
  getGatingSnapshot,
  getTotalFare,
  deductCommission,
};
