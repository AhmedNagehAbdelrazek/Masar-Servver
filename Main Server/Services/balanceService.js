const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { DriverSubscription, SubscriptionPlan, User, Trip, Booking } = require('../Models');
const { SUBSCRIPTION_STATUS, BOOKING_STATUS, TRIP_STATUS } = require('../config/constants');
const { audit } = require('../config/audit');
const notificationService = require('./notificationService');

/**
 * Plan queue activation ordering (T045):
 * 1. Free plan first (isFree DESC) — one-time plan activates before paid plans
 * 2. Shortest period first (plan_period_days ASC)
 * 3. Submission date FIFO (createdat ASC)
 * Used consistently for the "current active plan" lookup and FIFO deduction.
 */
const ACTIVE_SUBSCRIPTION_ORDER = [
  [{ model: SubscriptionPlan, as: 'plan' }, 'isFree', 'DESC'],
  ['planPeriodDays', 'ASC'],
  ['createdat', 'ASC'],
];

/**
 * Single gateway for EVERY balance mutation (credit on approval, FIFO
 * commission deduction, expiry, debt). All mutations run inside a
 * transaction with row locks and are audit-logged.
 *
 * Ledger rule: `users.total_balance` moves by the SAME delta as the sum of
 * active subscription balances. When a commission exceeds the available
 * subscription balances, the uncovered shortfall lowers `total_balance`
 * below zero (debt). Per-subscription balances never go negative.
 */
function round(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function logMutation({ action, resourceType, resourceId, resourceLabel, actorId, actorType, payload }) {
  try {
    audit.track({
      event_type: 'domain.event',
      action,
      outcome: 'success',
      actor: actorId
        ? { type: actorType || 'admin', id: actorId }
        : { type: 'system' },
      resource: { type: resourceType, id: resourceId, label: resourceLabel },
      payload,
    });
  } catch (err) {
    console.warn('[audit] balance mutation log failed:', err.message);
  }
}

async function getUserForUpdate(driverId, transaction) {
  return User.findByPk(driverId, { transaction, lock: transaction.LOCK.UPDATE });
}

/**
 * Current active plan (queue ordering). Returns null when the driver has no
 * active non-expired subscription. The SubscriptionPlan association is
 * included so the free-plan-first ordering can be applied.
 */
async function findCurrentSubscription(driverId, { transaction } = {}) {
  const now = new Date();
  return DriverSubscription.findOne({
    where: {
      driverId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.gt]: now },
    },
    include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['isFree', 'freeOffer'] }],
    order: ACTIVE_SUBSCRIPTION_ORDER,
    transaction,
  });
}

/**
 * Active (non-expired) subscriptions for a driver, in queue (FIFO) order.
 */
async function getActiveSubscriptions(driverId, { transaction } = {}) {
  const now = new Date();
  return DriverSubscription.findAll({
    where: {
      driverId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.gt]: now },
    },
    include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['isFree'] }],
    order: ACTIVE_SUBSCRIPTION_ORDER,
    transaction,
  });
}

/**
 * Recompute the cached users.total_balance / is_in_debt from the active
 * subscription balances (used by the expiry sweep and debt recovery).
 *
 * total_balance = activeBalance − debt, where debt is preserved from the
 * existing cached value (per-subscription balances never go negative, so an
 * existing negative total_balance is an uncovered debt that expiry must not
 * clear).
 */
async function recomputeCachedBalance(driverId, { transaction } = {}) {
  const user = await getUserForUpdate(driverId, transaction);
  const now = new Date();
  const subs = await DriverSubscription.findAll({
    where: {
      driverId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.gt]: now },
    },
    transaction,
  });

  const activeBalance = round(subs.reduce((sum, s) => sum + Number(s.balance), 0));
  const debt = Math.max(0, round(activeBalance - Number(user.totalBalance)));
  const total = round(activeBalance - debt);
  const isInDebt = total < 0;
  await user.update({ totalBalance: total, isInDebt }, { transaction });

  return { totalBalance: total, isInDebt };
}

/**
 * Credit a subscription's balance on approval.
 * `extraBalance` merges a renewed plan's remaining balance (and free-plan
 * credit offers) into the new row's balance. `mergedBalance` is the portion
 * of `extraBalance` that was already sitting on the old row — it is a
 * transfer, not new credit — so only the non-merged delta raises
 * `users.total_balance`. Debt is cleared first automatically (credit always
 * raises the total).
 */
async function creditOnApproval(
  subscription,
  { transaction, actorId = null, extraBalance = 0, mergedBalance = 0 } = {}
) {
  const subscriptionBalance = round(Number(subscription.planCost) + Number(extraBalance || 0));
  const totalDelta = round(subscriptionBalance - Number(mergedBalance || 0));
  const user = await getUserForUpdate(subscription.driverId, transaction);

  const newTotal = round(Number(user.totalBalance) + totalDelta);
  const isInDebt = newTotal < 0;

  await subscription.update({ balance: subscriptionBalance }, { transaction });
  await user.update({ totalBalance: newTotal, isInDebt }, { transaction });

  if (!isInDebt) {
    await unblockDriverTrips(subscription.driverId, { transaction });
  }

  logMutation({
    action: 'balance.credit',
    resourceType: 'driver_subscription',
    resourceId: subscription.id,
    resourceLabel: subscription.planName,
    actorId,
    payload: {
      driver_id: subscription.driverId,
      credit: totalDelta,
      subscription_balance: subscriptionBalance,
      total_balance: newTotal,
      is_in_debt: isInDebt,
    },
  });

  return { balanceAdded: totalDelta, totalBalance: newTotal, isInDebt };
}

/**
 * FIFO commission deduction at trip completion.
 * Deducts from active plans in queue order; any shortfall becomes debt on
 * `users.total_balance` and all driver trips are blocked.
 */
async function deductCommission({ driverId, amount, actorId = null }) {
  return sequelize.transaction(async (t) => {
    const now = new Date();
    const activeSubs = await DriverSubscription.findAll({
      where: {
        driverId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        expiresAt: { [Op.gt]: now },
      },
      order: [['planPeriodDays', 'ASC'], ['createdat', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (activeSubs.length > 1) {
      const planIds = [...new Set(activeSubs.map((s) => s.planId))];
      const plans = await SubscriptionPlan.findAll({
        where: { id: { [Op.in]: planIds } },
        attributes: ['id', 'isFree'],
        transaction: t,
      });
      const freeMap = new Map(plans.map((p) => [p.id, p.isFree]));
      activeSubs.sort((a, b) => {
        const af = freeMap.get(a.planId) ? 0 : 1;
        const bf = freeMap.get(b.planId) ? 0 : 1;
        if (af !== bf) return af - bf;
        if (Number(a.planPeriodDays) !== Number(b.planPeriodDays)) {
          return Number(a.planPeriodDays) - Number(b.planPeriodDays);
        }
        return new Date(a.createdat) - new Date(b.createdat);
      });
    }

    const user = await getUserForUpdate(driverId, t);

    let remaining = round(amount);
    let planName = null;
    let deducted = 0;
    for (const sub of activeSubs) {
      if (remaining <= 0) break;
      const bal = Number(sub.balance);
      if (bal <= 0) continue;
      const take = Math.min(bal, remaining);
      await sub.update({ balance: round(bal - take) }, { transaction: t });
      remaining = round(remaining - take);
      deducted += take;
      if (!planName) planName = sub.planName;
    }

    const newTotal = round(Number(user.totalBalance) - amount);
    const isInDebt = newTotal < 0;
    await user.update({ totalBalance: newTotal, isInDebt }, { transaction: t });

    let tripsBlocked = false;
    if (isInDebt) {
      await blockDriverTrips(driverId, { transaction: t });
      tripsBlocked = true;
    }

    logMutation({
      action: 'balance.debit',
      resourceType: 'driver_subscription',
      resourceId: driverId,
      resourceLabel: 'commission',
      actorId,
      payload: { driver_id: driverId, amount, deducted, shortfall: remaining, total_balance: newTotal, is_in_debt: isInDebt },
    });

    return {
      commission: round(amount),
      planName,
      balanceAfter: newTotal,
      isInDebt,
      shortfall: remaining,
      tripsBlocked,
    };
  });
}

/**
 * Expire a subscription (used by the expiry sweep). The plan's remaining
 * balance leaves the ledger; if the driver was in debt the debt is
 * unchanged (that credit had already been consumed).
 */
async function expireSubscription(subscription, { transaction }) {
  const balance = Number(subscription.balance);
  await subscription.update({ status: SUBSCRIPTION_STATUS.EXPIRED }, { transaction });

  const user = await getUserForUpdate(subscription.driverId, transaction);
  const newTotal = round(Number(user.totalBalance) - balance);
  const isInDebt = newTotal < 0;
  await user.update({ totalBalance: newTotal, isInDebt }, { transaction });

  logMutation({
    action: 'balance.expire',
    resourceType: 'driver_subscription',
    resourceId: subscription.id,
    resourceLabel: subscription.planName,
    actorId: null,
    payload: { driver_id: subscription.driverId, removed_balance: balance, total_balance: newTotal, is_in_debt: isInDebt },
  });

  return { removedBalance: balance, totalBalance: newTotal, isInDebt };
}

/**
 * Block/unblock all of a driver's trips based on current state.
 * blocked = driver is in debt OR has no active (non-expired) plan.
 * Returns whether the blocked state changed (to drive notifications).
 */
async function syncTripBlocking(driverId, { transaction }) {
  const now = new Date();
  const activeCount = await DriverSubscription.count({
    where: {
      driverId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.gt]: now },
    },
    transaction,
  });

  const user = await getUserForUpdate(driverId, transaction);
  const blocked = user.isInDebt || activeCount === 0;

  const trips = await Trip.findAll({
    where: { driverId, status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL, TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING] } },
    transaction,
  });

  let changed = false;
  for (const trip of trips) {
    if (trip.isBlockedByBalance !== blocked) {
      await trip.update({ isBlockedByBalance: blocked }, { transaction });
      changed = true;
    }
  }

  if (changed) {
    const bookingNotifications = async (type, vars) => {
      const tripIds = trips.map((tr) => tr.id);
      await notificationService.notifyBookedPassengers(tripIds, type, {
        vars,
        data: { driver_id: driverId },
      });
    };

    if (blocked) {
      await bookingNotifications('TRIP_UNAVAILABLE', {});
    } else {
      await bookingNotifications('TRIP_REPUBLISHED', {});
    }
  }

  return { blocked, changed };
}

async function blockDriverTrips(driverId, { transaction }) {
  return syncTripBlocking(driverId, { transaction });
}

async function unblockDriverTrips(driverId, { transaction }) {
  return syncTripBlocking(driverId, { transaction });
}

/**
 * Read-only balance overview for a driver.
 */
async function getBalanceOverview(driverId) {
  const user = await User.findByPk(driverId);
  if (!user) return null;

  const currentPlan = await findCurrentSubscription(driverId);

  return {
    total_balance: Number(user.totalBalance),
    is_in_debt: user.isInDebt,
    current_plan: currentPlan
      ? {
          id: currentPlan.id,
          plan_name: currentPlan.planName,
          plan_percentage_cut: Number(currentPlan.planPercentageCut),
          balance: Number(currentPlan.balance),
          expires_at: currentPlan.expiresAt,
        }
      : null,
  };
}

module.exports = {
  round,
  ACTIVE_SUBSCRIPTION_ORDER,
  creditOnApproval,
  deductCommission,
  expireSubscription,
  syncTripBlocking,
  blockDriverTrips,
  unblockDriverTrips,
  getBalanceOverview,
  findCurrentSubscription,
  getActiveSubscriptions,
  recomputeCachedBalance,
};
