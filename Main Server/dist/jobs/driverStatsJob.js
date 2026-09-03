"use strict";
const driverStatsService = require('../Services/driverStatsService');
const auditService = require('../Services/auditService');
/**
 * Driver stats refresh (spec 012 US5).
 *
 * Recomputes materialised performance columns (`totalTrips`, `punctualityRate`,
 * `professionalDriver`) for every active driver. Data-intensive, so it runs on
 * a light schedule (nightly by default) rather than on every request.
 */
async function runDriverStats() {
    try {
        const updated = await driverStatsService.recomputeAllDrivers();
        if (updated.length > 0) {
            auditService.track({
                eventType: 'driver_stats.recalculate',
                action: 'recompute_all_drivers',
                outcome: 'success',
                payload: { driversUpdated: updated.length },
            });
        }
        return { driversUpdated: updated.length };
    }
    catch (err) {
        console.error('[driverStatsJob] failed:', err.message);
        throw err;
    }
}
module.exports = { runDriverStats };
//# sourceMappingURL=driverStatsJob.js.map