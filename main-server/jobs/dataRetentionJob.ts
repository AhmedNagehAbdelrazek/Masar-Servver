import { Op } from 'sequelize';
import { TripLocation, Message, SosEvent } from '../Models';

const LOCATION_RETENTION_MS: number = 30 * 24 * 60 * 60 * 1000;
const SOS_LOCATION_RETENTION_MS: number = 365 * 24 * 60 * 60 * 1000;
const MESSAGE_RETENTION_MS: number = 365 * 24 * 60 * 60 * 1000;

interface RetentionResult {
  locationsDeleted: number;
  messagesDeleted: number;
}

async function runDataRetention(): Promise<RetentionResult> {
  const now: number = Date.now();
  const results: RetentionResult = { locationsDeleted: 0, messagesDeleted: 0 };

  const locationCutoff: Date = new Date(now - LOCATION_RETENTION_MS);
  const messageCutoff: Date = new Date(now - MESSAGE_RETENTION_MS);

  // spec 013: raw points on SOS-linked trips live a year, not 30 days.
  const sosRows = await (SosEvent as unknown as { findAll: (o: unknown) => Promise<Array<{ tripId: string }>> }).findAll({
    attributes: ['tripId'],
    group: ['tripId'],
  });
  const sosTripIds = [...new Set((sosRows || []).map((r) => r.tripId).filter(Boolean))];

  const baseWhere = { createdat: { [Op.lt]: locationCutoff } };
  if (sosTripIds.length === 0) {
    results.locationsDeleted = await (TripLocation as unknown as { destroy: (opts: unknown) => Promise<number> }).destroy({ where: baseWhere });
  } else {
    results.locationsDeleted += await (TripLocation as unknown as { destroy: (opts: unknown) => Promise<number> }).destroy({
      where: { ...baseWhere, tripId: { [Op.notIn]: sosTripIds } },
    });
    const sosCutoff: Date = new Date(now - SOS_LOCATION_RETENTION_MS);
    results.locationsDeleted += await (TripLocation as unknown as { destroy: (opts: unknown) => Promise<number> }).destroy({
      where: { createdat: { [Op.lt]: sosCutoff }, tripId: { [Op.in]: sosTripIds } },
    });
  }

  results.messagesDeleted = await (Message as unknown as { destroy: (opts: unknown) => Promise<number> }).destroy({
    where: { createdat: { [Op.lt]: messageCutoff } },
  });

  return results;
}

export { runDataRetention, LOCATION_RETENTION_MS, SOS_LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
export default { runDataRetention, LOCATION_RETENTION_MS, SOS_LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
module.exports = { runDataRetention, LOCATION_RETENTION_MS, SOS_LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
