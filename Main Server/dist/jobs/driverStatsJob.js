"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDriverStats = runDriverStats;
const driverStatsService_1 = __importDefault(require("../Services/driverStatsService"));
const auditService_1 = __importDefault(require("../Services/auditService"));
async function runDriverStats() {
    try {
        const updated = await driverStatsService_1.default.recomputeAllDrivers();
        if (updated.length > 0) {
            auditService_1.default.track({
                eventType: 'driver_stats.recalculate',
                action: 'recompute_all_drivers',
                outcome: 'success',
                payload: { driversUpdated: updated.length },
            });
        }
        return { driversUpdated: updated.length };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[driverStatsJob] failed:', msg);
        throw err;
    }
}
exports.default = { runDriverStats };
module.exports = { runDriverStats };
//# sourceMappingURL=driverStatsJob.js.map