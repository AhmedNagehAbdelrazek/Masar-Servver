"use strict";
const { Op } = require('sequelize');
const { DriverSubscription, User } = require('../Models');
const { SUBSCRIPTION_STATUS } = require('../config/constants');
const notificationService = require('../Services/notificationService');
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
/**
 * 24h-before-expiry reminders (T048).
 *
 * Notifies each driver once (in-app + push) about their earliest plan that
 * expires within the next 24 hours. Deduplicated per driver to avoid spam
 * when several plans expire around the same time.
 */
async function runExpiryReminder() {
    const now = new Date();
    const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);
    const expiring = await DriverSubscription.findAll({
        where: {
            status: SUBSCRIPTION_STATUS.ACTIVE,
            expiresAt: { [Op.gt]: now, [Op.lte]: horizon },
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
            const user = await User.findByPk(driverId);
            if (!user)
                continue;
            await notificationService.sendToUser(user, 'PLAN_EXPIRING_SOON', {
                channels: ['in_app', 'push'],
                vars: { plan: sub.planName },
                data: { subscription_id: sub.id, expires_at: sub.expiresAt },
            });
            notified.push({ driverId, subscriptionId: sub.id, planName: sub.planName });
        }
        catch (err) {
            console.warn('[expiryReminderJob] notification failed:', err.message);
        }
    }
    return notified;
}
module.exports = { runExpiryReminder };
//# sourceMappingURL=expiryReminderJob.js.map