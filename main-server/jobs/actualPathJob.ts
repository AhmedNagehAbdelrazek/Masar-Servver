import { Op } from 'sequelize';
import { Trip } from '../Models';
import { TRIP_STATUS } from '../config/constants';
import routeService from '../Services/routeService';

export interface ActualPathResult {
  compacted: number;
  skipped: number;
}

// Compact completed trips missing a recorded path. compactActualPath is
// idempotent, so overlap between inline completion and this job is harmless.
async function runActualPath(): Promise<ActualPathResult> {
  const result: ActualPathResult = { compacted: 0, skipped: 0 };
  const trips = await (Trip as unknown as { findAll: (o: unknown) => Promise<Array<{ id: string }>> }).findAll({
    where: { status: TRIP_STATUS.COMPLETED, actualPathPolyline: { [Op.is]: null } },
    attributes: ['id'],
    order: [['updatedat', 'ASC']],
    limit: 50,
  });
  for (const t of trips) {
    try {
      const out = await routeService.compactActualPath(t.id);
      if (out.ok) result.compacted += 1;
      else result.skipped += 1;
    } catch (err) {
      result.skipped += 1;
      console.warn(`[actualPathJob] trip ${t.id} failed:`, (err as Error).message);
    }
  }
  return result;
}

export { runActualPath };
export default { runActualPath };
module.exports = { runActualPath };
