import { Op } from 'sequelize';
import sequelize from '../config/database';
import { DriverSubscription, User } from '../Models';
import { SUBSCRIPTION_STATUS } from '../config/constants';
import balanceService from '../Services/balanceService';
import notificationService from '../Services/notificationService';

interface ExpiredEntry {
  id: string;
  planName: string;
  removedBalance: number;
}

interface SweepResult {
  driverId: string;
  expired: ExpiredEntry[];
  totalBalance: number;
  isInDebt: boolean;
}

async function runExpirySweep(): Promise<SweepResult[]> {
  const now: Date = new Date();
  const due = await DriverSubscription.findAll({
    where: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.lte]: now },
    },
  }) as Array<{ driverId: string; id: string; planName: string }>;

  const byDriver = new Map<string, typeof due>();
  for (const sub of due) {
    if (!byDriver.has(sub.driverId)) byDriver.set(sub.driverId, []);
    const arr = byDriver.get(sub.driverId);
    if (arr) arr.push(sub);
  }

  const results: SweepResult[] = [];
  for (const [driverId, subs] of byDriver) {
    const outcome = await (sequelize as unknown as { transaction: (cb: (t: unknown) => Promise<SweepResult>) => Promise<SweepResult> }).transaction(async (t: unknown) => {
      const expired: ExpiredEntry[] = [];
      for (const sub of subs) {
        const res = await (balanceService as { expireSubscription: (s: unknown, o: unknown) => Promise<{ removedBalance: number }> }).expireSubscription(sub, { transaction: t });
        expired.push({ id: sub.id, planName: sub.planName, removedBalance: res.removedBalance });
      }
      const cached = await (balanceService as { recomputeCachedBalance: (id: string, o: unknown) => Promise<{ totalBalance: number; isInDebt: boolean }> }).recomputeCachedBalance(driverId, { transaction: t });
      await (balanceService as { syncTripBlocking: (id: string, o: unknown) => Promise<void> }).syncTripBlocking(driverId, { transaction: t });
      return { driverId, expired, totalBalance: cached.totalBalance, isInDebt: cached.isInDebt };
    });

    try {
      const user = await User.findByPk(driverId) as { id: string } | null;
      if (user) {
        for (const entry of outcome.expired) {
          await (notificationService as { sendToUser: (u: unknown, t: string, o: unknown) => Promise<void> }).sendToUser(user, 'PLAN_EXPIRED', {
            channels: ['in_app', 'push'],
            vars: { plan: entry.planName },
            data: { subscription_id: entry.id },
          });
        }
        if (outcome.isInDebt) {
          await (notificationService as { sendToUser: (u: unknown, t: string, o: unknown) => Promise<void> }).sendToUser(user, 'DEBT', {
            channels: ['in_app', 'push'],
            vars: { balance: Number(outcome.totalBalance).toFixed(2) },
            data: { subscriptions: outcome.expired.map((e) => e.id) },
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[expirySweepJob] notification failed:', msg);
    }

    results.push(outcome);
  }

  return results;
}

export { runExpirySweep };
export default { runExpirySweep };
module.exports = { runExpirySweep };
