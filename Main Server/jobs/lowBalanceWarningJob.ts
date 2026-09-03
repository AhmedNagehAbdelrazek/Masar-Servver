import { Op } from 'sequelize';
import { Trip, User } from '../Models';
import { TRIP_STATUS } from '../config/constants';
import commissionService from '../Services/commissionService';
import notificationService from '../Services/notificationService';

const WARNING_WINDOW_MS: number = 24 * 60 * 60 * 1000;

interface WarnedEntry {
  driverId: string;
  tripId: string;
  minimum: number;
  balance: number;
}

async function runLowBalanceWarning(): Promise<WarnedEntry[]> {
  const now: Date = new Date();
  const horizon: Date = new Date(now.getTime() + WARNING_WINDOW_MS);

  const upcoming = await Trip.findAll({
    where: {
      status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] },
      isBlockedByBalance: false,
      departureTime: { [Op.gt]: now, [Op.lte]: horizon },
    },
    order: [['departureTime', 'ASC']],
  }) as Array<{ driverId: string; id: string; farePerSeat: number; destinationCity: string }>;

  const byDriver = new Map<string, typeof upcoming[number]>();
  for (const trip of upcoming) {
    if (!byDriver.has(trip.driverId)) byDriver.set(trip.driverId, trip);
  }

  const warned: WarnedEntry[] = [];
  for (const [driverId, trip] of byDriver) {
    try {
      const { current, minimum, totalBalance } = await (commissionService as { getGatingSnapshot: (id: string, fare: number) => Promise<{ current: unknown | null; minimum: number; totalBalance: number }> }).getGatingSnapshot(
        driverId,
        trip.farePerSeat
      );
      if (!current || totalBalance >= minimum) continue;

      const user = await User.findByPk(driverId) as { id: string } | null;
      if (!user) continue;
      await (notificationService as { sendToUser: (u: unknown, t: string, o: unknown) => Promise<void> }).sendToUser(user, 'LOW_BALANCE_WARNING', {
        channels: ['in_app', 'push'],
        vars: { route: trip.destinationCity || '' },
        data: { trip_id: trip.id, required: minimum, balance: totalBalance },
      });
      warned.push({ driverId, tripId: trip.id, minimum, balance: totalBalance });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[lowBalanceWarningJob] notification failed:', msg);
    }
  }

  return warned;
}

export { runLowBalanceWarning };
export default { runLowBalanceWarning };
module.exports = { runLowBalanceWarning };
