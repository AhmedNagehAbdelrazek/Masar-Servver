"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
globals_1.jest.mock('../../config/database', () => {
    const sequelize = globals_1.jest.fn();
    sequelize.transaction = globals_1.jest.fn(async (cb) => cb({}));
    return sequelize;
});
globals_1.jest.mock('../../Models', () => ({
    DriverSubscription: { findAll: globals_1.jest.fn() },
    User: { findByPk: globals_1.jest.fn() },
    Trip: { findAll: globals_1.jest.fn() },
}));
globals_1.jest.mock('../../Services/balanceService');
globals_1.jest.mock('../../Services/notificationService');
globals_1.jest.mock('../../Services/commissionService');
globals_1.jest.mock('node-cron', () => ({ schedule: globals_1.jest.fn() }));
// Must use require after mocks to get mocked versions; use jest.requireMock for typed access where needed
const { DriverSubscription, User, Trip } = require('../../Models');
const dbMock = globals_1.jest.requireMock('../../config/database');
const balanceService = require('../../Services/balanceService');
const notificationService = require('../../Services/notificationService');
const commissionService = require('../../Services/commissionService');
const { runExpirySweep } = require('../../jobs/expirySweepJob');
const { runExpiryReminder } = require('../../jobs/expiryReminderJob');
const { runLowBalanceWarning } = require('../../jobs/lowBalanceWarningJob');
const { JOBS, startJobs } = require('../../jobs');
(0, globals_1.afterEach)(() => {
    globals_1.jest.clearAllMocks();
});
(0, globals_1.describe)('expirySweepJob', () => {
    (0, globals_1.it)('flips subscriptions, recomputes balances, unpublishes trips, and notifies', async () => {
        DriverSubscription.findAll.mockResolvedValue([
            { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', balance: 40 },
            { id: 'sub-2', driverId: 'driver-1', planName: 'Pro', balance: 60 },
        ]);
        balanceService.expireSubscription.mockResolvedValue({ removedBalance: 0 });
        balanceService.recomputeCachedBalance.mockResolvedValue({ totalBalance: -20, isInDebt: true });
        balanceService.syncTripBlocking.mockResolvedValue({ blocked: true, changed: true });
        User.findByPk.mockResolvedValue({ id: 'driver-1', locale: 'ar' });
        const results = await runExpirySweep();
        (0, globals_1.expect)(DriverSubscription.findAll).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(dbMock.transaction).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(balanceService.expireSubscription).toHaveBeenCalledTimes(2);
        (0, globals_1.expect)(balanceService.expireSubscription).toHaveBeenNthCalledWith(1, { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', balance: 40 }, { transaction: {} });
        (0, globals_1.expect)(balanceService.recomputeCachedBalance).toHaveBeenCalledWith('driver-1', { transaction: {} });
        (0, globals_1.expect)(balanceService.syncTripBlocking).toHaveBeenCalledWith('driver-1', { transaction: {} });
        const types = notificationService.sendToUser.mock.calls.map((c) => c[1]);
        (0, globals_1.expect)(types).toEqual(globals_1.expect.arrayContaining(['PLAN_EXPIRED', 'PLAN_EXPIRED', 'DEBT']));
        (0, globals_1.expect)(notificationService.sendToUser).toHaveBeenCalledWith({ id: 'driver-1', locale: 'ar' }, 'PLAN_EXPIRED', globals_1.expect.objectContaining({ channels: ['in_app', 'push'], vars: { plan: 'Basic' } }));
        (0, globals_1.expect)(results).toHaveLength(1);
        (0, globals_1.expect)(results[0].totalBalance).toBe(-20);
        (0, globals_1.expect)(results[0].isInDebt).toBe(true);
    });
    (0, globals_1.it)('skips DEBT notification when the driver is not in debt', async () => {
        DriverSubscription.findAll.mockResolvedValue([
            { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', balance: 40 },
        ]);
        balanceService.expireSubscription.mockResolvedValue({ removedBalance: 40 });
        balanceService.recomputeCachedBalance.mockResolvedValue({ totalBalance: 0, isInDebt: false });
        balanceService.syncTripBlocking.mockResolvedValue({ blocked: true, changed: true });
        User.findByPk.mockResolvedValue({ id: 'driver-1', locale: 'ar' });
        await runExpirySweep();
        const types = notificationService.sendToUser.mock.calls.map((c) => c[1]);
        (0, globals_1.expect)(types).toEqual(['PLAN_EXPIRED']);
    });
});
(0, globals_1.describe)('expiryReminderJob', () => {
    (0, globals_1.it)('notifies each driver once about their earliest expiring plan', async () => {
        DriverSubscription.findAll.mockResolvedValue([
            { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', expiresAt: new Date() },
            { id: 'sub-2', driverId: 'driver-1', planName: 'Pro', expiresAt: new Date() },
            { id: 'sub-3', driverId: 'driver-2', planName: 'Pro', expiresAt: new Date() },
        ]);
        User.findByPk.mockImplementation(async (id) => ({ id, locale: 'en' }));
        const notified = await runExpiryReminder();
        (0, globals_1.expect)(notificationService.sendToUser).toHaveBeenCalledTimes(2);
        (0, globals_1.expect)(notificationService.sendToUser).toHaveBeenCalledWith({ id: 'driver-1', locale: 'en' }, 'PLAN_EXPIRING_SOON', globals_1.expect.objectContaining({ channels: ['in_app', 'push'], vars: { plan: 'Basic' } }));
        (0, globals_1.expect)(notificationService.sendToUser).toHaveBeenCalledWith({ id: 'driver-2', locale: 'en' }, 'PLAN_EXPIRING_SOON', globals_1.expect.objectContaining({ vars: { plan: 'Pro' } }));
        (0, globals_1.expect)(notified).toHaveLength(2);
    });
});
(0, globals_1.describe)('lowBalanceWarningJob', () => {
    (0, globals_1.it)('warns only drivers whose upcoming trip balance cannot cover commission', async () => {
        Trip.findAll.mockResolvedValue([
            { id: 'trip-1', driverId: 'driver-1', destinationCity: 'Irbid', farePerSeat: 20 },
            { id: 'trip-2', driverId: 'driver-2', destinationCity: 'Zarqa', farePerSeat: 20 },
        ]);
        commissionService.getGatingSnapshot.mockImplementation(async (driverId) => {
            if (driverId === 'driver-1') {
                return { current: { id: 'plan-1' }, minimum: 5, totalBalance: 1 };
            }
            return { current: { id: 'plan-2' }, minimum: 5, totalBalance: 100 };
        });
        User.findByPk.mockImplementation(async (id) => ({ id, locale: 'en' }));
        const warned = await runLowBalanceWarning();
        (0, globals_1.expect)(notificationService.sendToUser).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(notificationService.sendToUser).toHaveBeenCalledWith({ id: 'driver-1', locale: 'en' }, 'LOW_BALANCE_WARNING', globals_1.expect.objectContaining({ channels: ['in_app', 'push'], vars: { route: 'Irbid' } }));
        (0, globals_1.expect)(warned).toHaveLength(1);
        (0, globals_1.expect)(warned[0].driverId).toBe('driver-1');
    });
    (0, globals_1.it)('skips drivers with no active plan', async () => {
        Trip.findAll.mockResolvedValue([
            { id: 'trip-1', driverId: 'driver-1', destinationCity: 'Irbid', farePerSeat: 20 },
        ]);
        commissionService.getGatingSnapshot.mockResolvedValue({
            current: null,
            minimum: 0,
            totalBalance: 0,
        });
        const warned = await runLowBalanceWarning();
        (0, globals_1.expect)(notificationService.sendToUser).not.toHaveBeenCalled();
        (0, globals_1.expect)(warned).toHaveLength(0);
    });
});
(0, globals_1.describe)('jobs registry', () => {
    (0, globals_1.it)('exposes all three jobs with env-driven schedules', () => {
        (0, globals_1.expect)(Object.keys(JOBS)).toEqual(['expirySweep', 'expiryReminder', 'lowBalanceWarning']);
        (0, globals_1.expect)(JOBS.expirySweep.schedule).toBeTruthy();
        (0, globals_1.expect)(JOBS.expiryReminder.schedule).toBeTruthy();
        (0, globals_1.expect)(JOBS.lowBalanceWarning.schedule).toBeTruthy();
    });
    (0, globals_1.it)('does not schedule cron jobs in the test environment', () => {
        const cron = require('node-cron');
        startJobs();
        (0, globals_1.expect)(cron.schedule).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=jobs.test.js.map