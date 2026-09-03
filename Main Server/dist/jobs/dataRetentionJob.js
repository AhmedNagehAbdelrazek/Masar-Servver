"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_RETENTION_MS = exports.LOCATION_RETENTION_MS = void 0;
exports.runDataRetention = runDataRetention;
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const LOCATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
exports.LOCATION_RETENTION_MS = LOCATION_RETENTION_MS;
const MESSAGE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
exports.MESSAGE_RETENTION_MS = MESSAGE_RETENTION_MS;
async function runDataRetention() {
    const now = Date.now();
    const results = { locationsDeleted: 0, messagesDeleted: 0 };
    const locationCutoff = new Date(now - LOCATION_RETENTION_MS);
    const messageCutoff = new Date(now - MESSAGE_RETENTION_MS);
    results.locationsDeleted = await Models_1.TripLocation.destroy({
        where: { createdat: { [sequelize_1.Op.lt]: locationCutoff } },
    });
    results.messagesDeleted = await Models_1.Message.destroy({
        where: { createdat: { [sequelize_1.Op.lt]: messageCutoff } },
    });
    return results;
}
exports.default = { runDataRetention, LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
module.exports = { runDataRetention, LOCATION_RETENTION_MS, MESSAGE_RETENTION_MS };
//# sourceMappingURL=dataRetentionJob.js.map