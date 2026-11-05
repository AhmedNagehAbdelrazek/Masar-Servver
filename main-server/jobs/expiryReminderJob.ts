import { Op } from 'sequelize';
import { DriverSubscription, User } from '../Models';
import { SUBSCRIPTION_STATUS } from '../config/constants';
import notificationService from '../Services/notificationService';

const REMINDER_WINDOW_MS: number = 24 * 60 * 60 * 1000;

interface NotifiedEntry {
  driverId: string;
  subscriptionId: string;
  planName: string;
}

async function runExpiryReminder(): Promise<NotifiedEntry[]> {
  const now: Date = new Date();
  const horizon: Date = new Date(now.getTime() + REMINDER_WINDOW_MS);

  const expiring = await DriverSubscription.findAll({
    where: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: { [Op.gt]: now, [Op.lte]: horizon },
    },
    order: [['expiresAt', 'ASC']],
  }) as Array<{ driverId: string; id: string; planName: string; expiresAt: Date }>;

  const byDriver = new Map<string, typeof expiring[number]>();
  for (const sub of expiring) {
    if (!byDriver.has(sub.driverId)) byDriver.set(sub.driverId, sub);
  }

  const notified: NotifiedEntry[] = [];
  for (const [driverId, sub] of byDriver) {
    try {
      const user = await User.findByPk(driverId) as { id: string } | null;
      if (!user) continue;
      await (notificationService as { sendToUser: (u: unknown, t: string, o: unknown) => Promise<void> }).sendToUser(user, 'PLAN_EXPIRING_SOON', {
        channels: ['in_app', 'push'],
        vars: { plan: sub.planName },
        data: { subscription_id: sub.id, expires_at: sub.expiresAt },
      });
      notified.push({ driverId, subscriptionId: sub.id, planName: sub.planName });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[expiryReminderJob] notification failed:', msg);
    }
  }

  return notified;
}

export { runExpiryReminder };
export default { runExpiryReminder };
module.exports = { runExpiryReminder };
