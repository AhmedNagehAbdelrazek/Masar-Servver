const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { DriverSubscription, User } = require('../Models');
const { SUBSCRIPTION_STATUS } = require('../config/constants');
const balanceService = require('../Services/balanceService');
const notificationService = require('../Services/notificationService');

/**
 * Expiry sweep (T047).
 *
 * Flips every active subscription whose `expires_at` has passed to
 * `expired`, removes its remaining balance from the ledger (debt is
 * preserved), recomputes the cached `users.total_balance`/`is_in_debt`,
 * unpublishes the driver's trips when they have no active plan or are in
 * debt, and sends PLAN_EXPIRED (+ DEBT when applicable) notifications.
 *
 * Idempotent by design: only rows with `status = 'active'` and
 * `expires_at <= now()` are selected.
 */
async function runExpirySweep() {
  const now = new Date();
  const due = await DriverSubscription.findAll({
    where: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.lte]: now },
    },
  });

  const byDriver = new Map();
  for (const sub of due) {
    if (!byDriver.has(sub.driverId)) byDriver.set(sub.driverId, []);
    byDriver.get(sub.driverId).push(sub);
  }

  const results = [];
  for (const [driverId, subs] of byDriver) {
    const outcome = await sequelize.transaction(async (t) => {
      const expired = [];
      for (const sub of subs) {
        const res = await balanceService.expireSubscription(sub, { transaction: t });
        expired.push({ id: sub.id, planName: sub.planName, removedBalance: res.removedBalance });
      }
      const cached = await balanceService.recomputeCachedBalance(driverId, { transaction: t });
      await balanceService.syncTripBlocking(driverId, { transaction: t });
      return { driverId, expired, ...cached };
    });

    // Notify outside the transaction (best-effort, never throws).
    try {
      const user = await User.findByPk(driverId);
      if (user) {
        for (const entry of outcome.expired) {
          await notificationService.sendToUser(user, 'PLAN_EXPIRED', {
            channels: ['in_app', 'push'],
            vars: { plan: entry.planName },
            data: { subscription_id: entry.id },
          });
        }
        if (outcome.isInDebt) {
          await notificationService.sendToUser(user, 'DEBT', {
            channels: ['in_app', 'push'],
            vars: { balance: Number(outcome.totalBalance).toFixed(2) },
            data: { subscriptions: outcome.expired.map((e) => e.id) },
          });
        }
      }
    } catch (err) {
      console.warn('[expirySweepJob] notification failed:', err.message);
    }

    results.push(outcome);
  }

  return results;
}

module.exports = { runExpirySweep };
