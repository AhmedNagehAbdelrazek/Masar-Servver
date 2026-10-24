"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_RETENTION_MS = exports.SOS_LOCATION_RETENTION_MS = exports.LOCATION_RETENTION_MS = void 0;
exports.runDataRetention = runDataRetention;
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const LOCATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
exports.LOCATION_RETENTION_MS = LOCATION_RETENTION_MS;
const SOS_LOCATION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
exports.SOS_LOCATION_RETENTION_MS = SOS_LOCATION_RETENTION_MS;
const MESSAGE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
exports.MESSAGE_RETENTION_MS = MESSAGE_RETENTION_MS;
async function runDataRetention() {
    const now = Date.now();
    const results = { locationsDeleted: 0, messagesDeleted: 0 };
    const locationCutoff = new Date(now - LOCATION_RETENTION_MS);
    const messageCutoff = new Date(now - MESSAGE_RETENTION_MS);
    // spec 013: raw points on SOS-linked trips live a year, not 30 days.
    const sosRows = await Models_1.SosEvent.findAll({
        attributes: ['tripId'],
        group: ['tripId'],
    });
    const sosTripIds = [...new Set((sosRows || []).map((r) => r.tripId).filter(Boolean))];
    const baseWhere = { createdat: { [sequelize_1.Op.lt]: locationCutoff } };
    if (sosTripIds.length === 0) {
        results.locationsDeleted = await Models_1.TripLocation.destroy({ where: baseWhere });
    }
    else {
        results.locationsDeleted += await Models_1.TripLocation.destroy({
            where: { ...baseWhere, tripId: { [sequelize_1.Op.notIn]: sosTripIds } },
        });
        const sosCutoff = new Date(now - SOS_LOCATION_RETENTION_MS);
        results.locationsDeleted += await Models_1.TripLocation.destroy({
            where: { createdat: { [sequelize_1.Op.lt]: sosCutoff }, tripId: { [sequelize_1.Op.in]: sosTripIds } },
        });
    }
    results.messagesDeleted = await Models_1.Message.destroy({
        where: { createdat: { [sequelize_1.Op.lt]: messageCutoff } },
    });
    return results;
}
exports.default = { runDataRetention, LOCATION_RETENTION_MS, SOS_LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
module.exports = { runDataRetention, LOCATION_RETENTION_MS, SOS_LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
//# sourceMappingURL=dataRetentionJob.js.map