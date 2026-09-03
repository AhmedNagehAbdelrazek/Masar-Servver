"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLowBalanceWarning = runLowBalanceWarning;
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const commissionService_1 = __importDefault(require("../Services/commissionService"));
const notificationService_1 = __importDefault(require("../Services/notificationService"));
const WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
async function runLowBalanceWarning() {
    const now = new Date();
    const horizon = new Date(now.getTime() + WARNING_WINDOW_MS);
    const upcoming = await Models_1.Trip.findAll({
        where: {
            status: { [sequelize_1.Op.in]: [constants_1.TRIP_STATUS.PUBLISHED, constants_1.TRIP_STATUS.FULL] },
            isBlockedByBalance: false,
            departureTime: { [sequelize_1.Op.gt]: now, [sequelize_1.Op.lte]: horizon },
        },
        order: [['departureTime', 'ASC']],
    });
    const byDriver = new Map();
    for (const trip of upcoming) {
        if (!byDriver.has(trip.driverId))
            byDriver.set(trip.driverId, trip);
    }
    const warned = [];
    for (const [driverId, trip] of byDriver) {
        try {
            const { current, minimum, totalBalance } = await commissionService_1.default.getGatingSnapshot(driverId, trip.farePerSeat);
            if (!current || totalBalance >= minimum)
                continue;
            const user = await Models_1.User.findByPk(driverId);
            if (!user)
                continue;
            await notificationService_1.default.sendToUser(user, 'LOW_BALANCE_WARNING', {
                channels: ['in_app', 'push'],
                vars: { route: trip.destinationCity || '' },
                data: { trip_id: trip.id, required: minimum, balance: totalBalance },
            });
            warned.push({ driverId, tripId: trip.id, minimum, balance: totalBalance });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[lowBalanceWarningJob] notification failed:', msg);
        }
    }
    return warned;
}
exports.default = { runLowBalanceWarning };
module.exports = { runLowBalanceWarning };
//# sourceMappingURL=lowBalanceWarningJob.js.map