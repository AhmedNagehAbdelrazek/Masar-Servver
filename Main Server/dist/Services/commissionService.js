"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.round = round;
exports.minimumBalanceForPlan = minimumBalanceForPlan;
exports.getGatingSnapshot = getGatingSnapshot;
exports.getTotalFare = getTotalFare;
exports.deductCommission = deductCommission;
// @ts-nocheck
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const balanceService_1 = __importDefault(require("./balanceService"));
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
    const current = await balanceService_1.default.findCurrentSubscription(driverId);
    if (!current) {
        return { current: null, minimum: 0, totalBalance: 0 };
    }
    const overview = await balanceService_1.default.getBalanceOverview(driverId);
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
    const bookings = await Models_1.Booking.findAll({
        where: {
            tripId,
            status: { [sequelize_1.Op.in]: [constants_1.BOOKING_STATUS.CONFIRMED, constants_1.BOOKING_STATUS.COMPLETED] },
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
    const current = await balanceService_1.default.findCurrentSubscription(trip.driverId);
    const rate = current ? Number(current.planPercentageCut) : 0;
    const commission = round(totalFare * (rate / 100));
    const result = await balanceService_1.default.deductCommission({
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
exports.default = module.exports;
//# sourceMappingURL=commissionService.js.map