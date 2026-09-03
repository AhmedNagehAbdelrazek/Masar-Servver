"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExpiryReminder = runExpiryReminder;
const sequelize_1 = require("sequelize");
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const notificationService_1 = __importDefault(require("../Services/notificationService"));
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
async function runExpiryReminder() {
    const now = new Date();
    const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);
    const expiring = await Models_1.DriverSubscription.findAll({
        where: {
            status: constants_1.SUBSCRIPTION_STATUS.ACTIVE,
            expiresAt: { [sequelize_1.Op.gt]: now, [sequelize_1.Op.lte]: horizon },
        },
        order: [['expiresAt', 'ASC']],
    });
    const byDriver = new Map();
    for (const sub of expiring) {
        if (!byDriver.has(sub.driverId))
            byDriver.set(sub.driverId, sub);
    }
    const notified = [];
    for (const [driverId, sub] of byDriver) {
        try {
            const user = await Models_1.User.findByPk(driverId);
            if (!user)
                continue;
            await notificationService_1.default.sendToUser(user, 'PLAN_EXPIRING_SOON', {
                channels: ['in_app', 'push'],
                vars: { plan: sub.planName },
                data: { subscription_id: sub.id, expires_at: sub.expiresAt },
            });
            notified.push({ driverId, subscriptionId: sub.id, planName: sub.planName });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[expiryReminderJob] notification failed:', msg);
        }
    }
    return notified;
}
exports.default = { runExpiryReminder };
module.exports = { runExpiryReminder };
//# sourceMappingURL=expiryReminderJob.js.map