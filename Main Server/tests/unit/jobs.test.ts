import { describe, it, expect, afterEach, jest } from '@jest/globals';

jest.mock('../../config/database', () => {
  const sequelize = jest.fn() as unknown as { transaction: unknown } & ((...args: unknown[]) => unknown);
  (sequelize as unknown as { transaction: unknown }).transaction = jest.fn(
    async (cb: (t: unknown) => Promise<unknown>) => cb({})
  );
  return sequelize;
});

jest.mock('../../Models', () => ({
  DriverSubscription: { findAll: jest.fn() },
  User: { findByPk: jest.fn() },
  Trip: { findAll: jest.fn() },
}));

jest.mock('../../Services/balanceService');
jest.mock('../../Services/notificationService');
jest.mock('../../Services/commissionService');
jest.mock('node-cron', () => ({ schedule: jest.fn() }));

// Must use require after mocks to get mocked versions; use jest.requireMock for typed access where needed
const { DriverSubscription, User, Trip } = require('../../Models') as {
  DriverSubscription: { findAll: jest.Mock<() => Promise<unknown>> };
  User: { findByPk: jest.Mock<(id: string) => Promise<unknown>> };
  Trip: { findAll: jest.Mock<() => Promise<unknown>> };
};
const dbMock = jest.requireMock('../../config/database') as unknown as {
  transaction: jest.Mock<(cb: (t: unknown) => Promise<unknown>) => Promise<unknown>>;
};
const balanceService = require('../../Services/balanceService') as {
  expireSubscription: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  recomputeCachedBalance: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  syncTripBlocking: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};
const notificationService = require('../../Services/notificationService') as {
  sendToUser: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};
const commissionService = require('../../Services/commissionService') as {
  getGatingSnapshot: jest.Mock<(driverId: string) => Promise<unknown>>;
};

const { runExpirySweep } = require('../../jobs/expirySweepJob') as {
  runExpirySweep: () => Promise<Array<{ totalBalance: number; isInDebt: boolean }>>;
};
const { runExpiryReminder } = require('../../jobs/expiryReminderJob') as {
  runExpiryReminder: () => Promise<unknown[]>;
};
const { runLowBalanceWarning } = require('../../jobs/lowBalanceWarningJob') as {
  runLowBalanceWarning: () => Promise<Array<{ driverId: string }>>;
};
const { JOBS, startJobs } = require('../../jobs') as {
  JOBS: Record<string, { schedule: string }>;
  startJobs: () => unknown;
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('expirySweepJob', () => {
  it('flips subscriptions, recomputes balances, unpublishes trips, and notifies', async () => {
    DriverSubscription.findAll.mockResolvedValue([
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', balance: 40 },
      { id: 'sub-2', driverId: 'driver-1', planName: 'Pro', balance: 60 },
    ]);
    balanceService.expireSubscription.mockResolvedValue({ removedBalance: 0 });
    balanceService.recomputeCachedBalance.mockResolvedValue({ totalBalance: -20, isInDebt: true });
    balanceService.syncTripBlocking.mockResolvedValue({ blocked: true, changed: true });
    User.findByPk.mockResolvedValue({ id: 'driver-1', locale: 'ar' });

    const results = await runExpirySweep();

    expect(DriverSubscription.findAll).toHaveBeenCalledTimes(1);
    expect(dbMock.transaction).toHaveBeenCalledTimes(1);
    expect(balanceService.expireSubscription).toHaveBeenCalledTimes(2);
    expect(balanceService.expireSubscription).toHaveBeenNthCalledWith(
      1,
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', balance: 40 },
      { transaction: {} }
    );
    expect(balanceService.recomputeCachedBalance).toHaveBeenCalledWith('driver-1', { transaction: {} });
    expect(balanceService.syncTripBlocking).toHaveBeenCalledWith('driver-1', { transaction: {} });

    const types: unknown[] = (notificationService.sendToUser.mock.calls as unknown[][]).map(
      (c: unknown[]) => c[1]
    );
    expect(types).toEqual(expect.arrayContaining(['PLAN_EXPIRED', 'PLAN_EXPIRED', 'DEBT']));
    expect(notificationService.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-1', locale: 'ar' },
      'PLAN_EXPIRED',
      expect.objectContaining({ channels: ['in_app', 'push'], vars: { plan: 'Basic' } })
    );

    expect(results).toHaveLength(1);
    expect(results[0].totalBalance).toBe(-20);
    expect(results[0].isInDebt).toBe(true);
  });

  it('skips DEBT notification when the driver is not in debt', async () => {
    DriverSubscription.findAll.mockResolvedValue([
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', balance: 40 },
    ]);
    balanceService.expireSubscription.mockResolvedValue({ removedBalance: 40 });
    balanceService.recomputeCachedBalance.mockResolvedValue({ totalBalance: 0, isInDebt: false });
    balanceService.syncTripBlocking.mockResolvedValue({ blocked: true, changed: true });
    User.findByPk.mockResolvedValue({ id: 'driver-1', locale: 'ar' });

    await runExpirySweep();

    const types: unknown[] = (notificationService.sendToUser.mock.calls as unknown[][]).map(
      (c: unknown[]) => c[1]
    );
    expect(types).toEqual(['PLAN_EXPIRED']);
  });
});

describe('expiryReminderJob', () => {
  it('notifies each driver once about their earliest expiring plan', async () => {
    DriverSubscription.findAll.mockResolvedValue([
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', expiresAt: new Date() },
      { id: 'sub-2', driverId: 'driver-1', planName: 'Pro', expiresAt: new Date() },
      { id: 'sub-3', driverId: 'driver-2', planName: 'Pro', expiresAt: new Date() },
    ]);
    User.findByPk.mockImplementation(async (id: string) => ({ id, locale: 'en' }) as unknown as never);

    const notified = await runExpiryReminder();

    expect(notificationService.sendToUser).toHaveBeenCalledTimes(2);
    expect(notificationService.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-1', locale: 'en' },
      'PLAN_EXPIRING_SOON',
      expect.objectContaining({ channels: ['in_app', 'push'], vars: { plan: 'Basic' } })
    );
    expect(notificationService.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-2', locale: 'en' },
      'PLAN_EXPIRING_SOON',
      expect.objectContaining({ vars: { plan: 'Pro' } })
    );
    expect(notified).toHaveLength(2);
  });
});

describe('lowBalanceWarningJob', () => {
  it('warns only drivers whose upcoming trip balance cannot cover commission', async () => {
    Trip.findAll.mockResolvedValue([
      { id: 'trip-1', driverId: 'driver-1', destinationCity: 'Irbid', farePerSeat: 20 },
      { id: 'trip-2', driverId: 'driver-2', destinationCity: 'Zarqa', farePerSeat: 20 },
    ]);
    commissionService.getGatingSnapshot.mockImplementation(async (driverId: string) => {
      if (driverId === 'driver-1') {
        return { current: { id: 'plan-1' }, minimum: 5, totalBalance: 1 } as unknown as never;
      }
      return { current: { id: 'plan-2' }, minimum: 5, totalBalance: 100 } as unknown as never;
    });
    User.findByPk.mockImplementation(async (id: string) => ({ id, locale: 'en' }) as unknown as never);

    const warned = await runLowBalanceWarning();

    expect(notificationService.sendToUser).toHaveBeenCalledTimes(1);
    expect(notificationService.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-1', locale: 'en' },
      'LOW_BALANCE_WARNING',
      expect.objectContaining({ channels: ['in_app', 'push'], vars: { route: 'Irbid' } })
    );
    expect(warned).toHaveLength(1);
    expect(warned[0].driverId).toBe('driver-1');
  });

  it('skips drivers with no active plan', async () => {
    Trip.findAll.mockResolvedValue([
      { id: 'trip-1', driverId: 'driver-1', destinationCity: 'Irbid', farePerSeat: 20 },
    ]);
    commissionService.getGatingSnapshot.mockResolvedValue({
      current: null,
      minimum: 0,
      totalBalance: 0,
    } as unknown as never);

    const warned = await runLowBalanceWarning();

    expect(notificationService.sendToUser).not.toHaveBeenCalled();
    expect(warned).toHaveLength(0);
  });
});

describe('jobs registry', () => {
  it('exposes all three jobs with env-driven schedules', () => {
    expect(Object.keys(JOBS)).toEqual(['expirySweep', 'expiryReminder', 'lowBalanceWarning']);
    expect(JOBS.expirySweep.schedule).toBeTruthy();
    expect(JOBS.expiryReminder.schedule).toBeTruthy();
    expect(JOBS.lowBalanceWarning.schedule).toBeTruthy();
  });

  it('does not schedule cron jobs in the test environment', () => {
        const cron = require('node-cron') as { schedule: jest.Mock<(...args: unknown[]) => unknown> };
    startJobs();
    expect(cron.schedule).not.toHaveBeenCalled();
  });
});
