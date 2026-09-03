"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExpirySweep = runExpirySweep;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Models_1 = require("../Models");
const constants_1 = require("../config/constants");
const balanceService_1 = __importDefault(require("../Services/balanceService"));
const notificationService_1 = __importDefault(require("../Services/notificationService"));
async function runExpirySweep() {
    const now = new Date();
    const due = await Models_1.DriverSubscription.findAll({
        where: {
            status: constants_1.SUBSCRIPTION_STATUS.ACTIVE,
            expiresAt: { [sequelize_1.Op.lte]: now },
        },
    });
    const byDriver = new Map();
    for (const sub of due) {
        if (!byDriver.has(sub.driverId))
            byDriver.set(sub.driverId, []);
        const arr = byDriver.get(sub.driverId);
        if (arr)
            arr.push(sub);
    }
    const results = [];
    for (const [driverId, subs] of byDriver) {
        const outcome = await database_1.default.transaction(async (t) => {
            const expired = [];
            for (const sub of subs) {
                const res = await balanceService_1.default.expireSubscription(sub, { transaction: t });
                expired.push({ id: sub.id, planName: sub.planName, removedBalance: res.removedBalance });
            }
            const cached = await balanceService_1.default.recomputeCachedBalance(driverId, { transaction: t });
            await balanceService_1.default.syncTripBlocking(driverId, { transaction: t });
            return { driverId, expired, totalBalance: cached.totalBalance, isInDebt: cached.isInDebt };
        });
        try {
            const user = await Models_1.User.findByPk(driverId);
            if (user) {
                for (const entry of outcome.expired) {
                    await notificationService_1.default.sendToUser(user, 'PLAN_EXPIRED', {
                        channels: ['in_app', 'push'],
                        vars: { plan: entry.planName },
                        data: { subscription_id: entry.id },
                    });
                }
                if (outcome.isInDebt) {
                    await notificationService_1.default.sendToUser(user, 'DEBT', {
                        channels: ['in_app', 'push'],
                        vars: { balance: Number(outcome.totalBalance).toFixed(2) },
                        data: { subscriptions: outcome.expired.map((e) => e.id) },
                    });
                }
            }
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn('[expirySweepJob] notification failed:', msg);
        }
        results.push(outcome);
    }
    return results;
}
exports.default = { runExpirySweep };
module.exports = { runExpirySweep };
//# sourceMappingURL=expirySweepJob.js.map