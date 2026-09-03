import driverStatsService from '../Services/driverStatsService';
import auditService from '../Services/auditService';

interface DriverStatsResult {
  driversUpdated: number;
}

async function runDriverStats(): Promise<DriverStatsResult> {
  try {
    const updated: unknown[] = await (driverStatsService as { recomputeAllDrivers: () => Promise<unknown[]> }).recomputeAllDrivers();
    if (updated.length > 0) {
      (auditService as { track: (p: Record<string, unknown>) => void }).track({
        eventType: 'driver_stats.recalculate',
        action: 'recompute_all_drivers',
        outcome: 'success',
        payload: { driversUpdated: updated.length },
      });
    }
    return { driversUpdated: updated.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[driverStatsJob] failed:', msg);
    throw err;
  }
}

export { runDriverStats };
export default { runDriverStats };
module.exports = { runDriverStats };
