"use strict";
const { Op } = require('sequelize');
const { Trip, User } = require('../Models');
const { TRIP_STATUS } = require('../config/constants');
const commissionService = require('../Services/commissionService');
const notificationService = require('../Services/notificationService');
const WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
/**
 * Low-balance warnings (T049).
 *
 * Warns each driver once (in-app + push) when they have an upcoming trip
 * within the next 24 hours but their total balance cannot cover the
 * commission for one seat at their current plan's rate. Deduplicated per
 * driver using their earliest upcoming trip.
 */
async function runLowBalanceWarning() {
    const now = new Date();
    const horizon = new Date(now.getTime() + WARNING_WINDOW_MS);
    const upcoming = await Trip.findAll({
        where: {
            status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] },
            isBlockedByBalance: false,
            departureTime: { [Op.gt]: now, [Op.lte]: horizon },
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
            const { current, minimum, totalBalance } = await commissionService.getGatingSnapshot(driverId, trip.farePerSeat);
            if (!current || totalBalance >= minimum)
                continue;
            const user = await User.findByPk(driverId);
            if (!user)
                continue;
            await notificationService.sendToUser(user, 'LOW_BALANCE_WARNING', {
                channels: ['in_app', 'push'],
                vars: { route: trip.destinationCity || '' },
                data: { trip_id: trip.id, required: minimum, balance: totalBalance },
            });
            warned.push({ driverId, tripId: trip.id, minimum, balance: totalBalance });
        }
        catch (err) {
            console.warn('[lowBalanceWarningJob] notification failed:', err.message);
        }
    }
    return warned;
}
module.exports = { runLowBalanceWarning };
//# sourceMappingURL=lowBalanceWarningJob.js.map