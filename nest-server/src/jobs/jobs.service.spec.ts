import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JobsService } from './jobs.service.js';

// Unit coverage for the jobs bodies + scheduler semantics (port of Main
// Server/tests/unit/jobs.test.ts + tests/unit/scheduler.test.ts). All
// collaborators are mocked; the overlap guard + jobs:lastrun:* record mirror
// jobs/scheduler.ts through the RedisService stub.
function makeDeps() {
  const prisma = {
    driverSubscription: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    trip: { findMany: vi.fn() },
    tripLocation: { deleteMany: vi.fn() },
    message: { deleteMany: vi.fn() },
    sosEvent: { findMany: vi.fn() },
    $transaction: vi.fn(async (cb: (t: unknown) => Promise<unknown>) => cb({})),
  };
  const redis = { setKey: vi.fn().mockResolvedValue(undefined), getKey: vi.fn() };
  const balance = {
    expireSubscription: vi.fn(),
    recomputeCachedBalance: vi.fn(),
    syncTripBlocking: vi.fn(),
  };
  const notifications = { sendToUser: vi.fn().mockResolvedValue({}) };
  const commission = { getGatingSnapshot: vi.fn() };
  const sos = { runEscalation: vi.fn() };
  const tripExpiry = { refreshStaleTrips: vi.fn() };
  const routes = { computeTripRoute: vi.fn(), compactActualPath: vi.fn() };
  const stats = { recomputeAllDrivers: vi.fn() };
  const service = new JobsService(
    prisma as never,
    redis as never,
    balance as never,
    notifications as never,
    commission as never,
    sos as never,
    tripExpiry as never,
    routes as never,
    stats as never,
  );
  return { prisma, redis, balance, notifications, commission, sos, tripExpiry, routes, stats, service };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('expirySweepJob', () => {
  it('flips subscriptions, recomputes balances, syncs blocking, and notifies', async () => {
    const { prisma, balance, notifications, service } = makeDeps();
    prisma.driverSubscription.findMany.mockResolvedValue([
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', planCost: 40, balance: 40 },
      { id: 'sub-2', driverId: 'driver-1', planName: 'Pro', planCost: 60, balance: 60 },
    ]);
    balance.expireSubscription.mockResolvedValue({ removedBalance: 0 });
    balance.recomputeCachedBalance.mockResolvedValue({ totalBalance: -20, isInDebt: true });
    balance.syncTripBlocking.mockResolvedValue({ blocked: true, changed: true });
    prisma.user.findUnique.mockResolvedValue({ id: 'driver-1' });

    const results = await service.runExpirySweep();

    expect(prisma.driverSubscription.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(balance.expireSubscription).toHaveBeenCalledTimes(2);
    expect(balance.expireSubscription).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'sub-1', driverId: 'driver-1' }),
      {},
    );
    expect(balance.recomputeCachedBalance).toHaveBeenCalledWith('driver-1', {});
    expect(balance.syncTripBlocking).toHaveBeenCalledWith('driver-1', {});

    const types = notifications.sendToUser.mock.calls.map((c) => c[1]);
    expect(types).toEqual(expect.arrayContaining(['PLAN_EXPIRED', 'PLAN_EXPIRED', 'DEBT']));
    expect(notifications.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-1' },
      'PLAN_EXPIRED',
      expect.objectContaining({ channels: ['in_app', 'push'], vars: { plan: 'Basic' } }),
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.totalBalance).toBe(-20);
    expect(results[0]?.isInDebt).toBe(true);
  });

  it('skips DEBT notification when the driver is not in debt', async () => {
    const { prisma, balance, notifications, service } = makeDeps();
    prisma.driverSubscription.findMany.mockResolvedValue([
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', planCost: 40, balance: 40 },
    ]);
    balance.expireSubscription.mockResolvedValue({ removedBalance: 40 });
    balance.recomputeCachedBalance.mockResolvedValue({ totalBalance: 0, isInDebt: false });
    balance.syncTripBlocking.mockResolvedValue({ blocked: true, changed: true });
    prisma.user.findUnique.mockResolvedValue({ id: 'driver-1' });

    await service.runExpirySweep();

    expect(notifications.sendToUser.mock.calls.map((c) => c[1])).toEqual(['PLAN_EXPIRED']);
  });
});

describe('expiryReminderJob', () => {
  it('notifies each driver once about their earliest expiring plan', async () => {
    const { prisma, notifications, service } = makeDeps();
    prisma.driverSubscription.findMany.mockResolvedValue([
      { id: 'sub-1', driverId: 'driver-1', planName: 'Basic', expiresAt: new Date() },
      { id: 'sub-2', driverId: 'driver-1', planName: 'Pro', expiresAt: new Date() },
      { id: 'sub-3', driverId: 'driver-2', planName: 'Pro', expiresAt: new Date() },
    ]);
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));

    const notified = await service.runExpiryReminder();

    expect(notifications.sendToUser).toHaveBeenCalledTimes(2);
    expect(notifications.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-1' },
      'PLAN_EXPIRING_SOON',
      expect.objectContaining({ channels: ['in_app', 'push'], vars: { plan: 'Basic' } }),
    );
    expect(notified).toHaveLength(2);
  });
});

describe('lowBalanceWarningJob', () => {
  it('warns only drivers whose upcoming trip balance cannot cover commission', async () => {
    const { prisma, commission, notifications, service } = makeDeps();
    prisma.trip.findMany.mockResolvedValue([
      { id: 'trip-1', driverId: 'driver-1', destinationCity: 'Irbid', farePerSeat: 20 },
      { id: 'trip-2', driverId: 'driver-2', destinationCity: 'Zarqa', farePerSeat: 20 },
    ]);
    commission.getGatingSnapshot.mockImplementation(async (driverId: string) => {
      if (driverId === 'driver-1') return { current: { id: 'plan-1' }, minimum: 5, totalBalance: 1 };
      return { current: { id: 'plan-2' }, minimum: 5, totalBalance: 100 };
    });
    prisma.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }));

    const warned = await service.runLowBalanceWarning();

    expect(notifications.sendToUser).toHaveBeenCalledTimes(1);
    expect(notifications.sendToUser).toHaveBeenCalledWith(
      { id: 'driver-1' },
      'LOW_BALANCE_WARNING',
      expect.objectContaining({ channels: ['in_app', 'push'], vars: { route: 'Irbid' } }),
    );
    expect(warned).toHaveLength(1);
    expect(warned[0]?.driverId).toBe('driver-1');
  });

  it('skips drivers with no active plan', async () => {
    const { prisma, commission, notifications, service } = makeDeps();
    prisma.trip.findMany.mockResolvedValue([
      { id: 'trip-1', driverId: 'driver-1', destinationCity: 'Irbid', farePerSeat: 20 },
    ]);
    commission.getGatingSnapshot.mockResolvedValue({ current: null, minimum: 0, totalBalance: 0 });

    const warned = await service.runLowBalanceWarning();

    expect(notifications.sendToUser).not.toHaveBeenCalled();
    expect(warned).toHaveLength(0);
  });
});

describe('remaining jobs delegate to the owning services', () => {
  it('sosEscalation delegates to SosService.runEscalation', async () => {
    const { sos, service } = makeDeps();
    sos.runEscalation.mockResolvedValue({ alerted: 2, escalated: 1 });
    await expect(service.runSosEscalation()).resolves.toEqual({ alerted: 2, escalated: 1 });
  });

  it('dataRetention drops 30-day points but keeps SOS-linked ones for a year', async () => {
    const { prisma, service } = makeDeps();
    prisma.sosEvent.findMany.mockResolvedValue([{ tripId: 'sos-trip' }]);
    prisma.tripLocation.deleteMany.mockResolvedValue({ count: 1 });
    prisma.message.deleteMany.mockResolvedValue({ count: 2 });

    const out = await service.runDataRetention();

    expect(prisma.tripLocation.deleteMany).toHaveBeenCalledTimes(2);
    expect(prisma.tripLocation.deleteMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ tripId: { notIn: ['sos-trip'] } }) }),
    );
    expect(out).toEqual({ locationsDeleted: 2, messagesDeleted: 2 });
  });

  it('routeRetry recovers failed routes without throwing', async () => {
    const { prisma, routes, service } = makeDeps();
    prisma.trip.findMany.mockResolvedValue([{ id: 'trip-1' }, { id: 'trip-2' }]);
    routes.computeTripRoute.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false });

    await expect(service.runRouteRetry()).resolves.toEqual({ retried: 2, recovered: 1, stillFailing: 1 });
  });

  it('actualPath compacts completed trips missing a path', async () => {
    const { prisma, routes, service } = makeDeps();
    prisma.trip.findMany.mockResolvedValue([{ id: 'trip-1' }]);
    routes.compactActualPath.mockResolvedValue({ ok: true });

    await expect(service.runActualPath()).resolves.toEqual({ compacted: 1, skipped: 0 });
  });

  it('driverStats recomputes every active driver', async () => {
    const { stats, service } = makeDeps();
    stats.recomputeAllDrivers.mockResolvedValue([{ driverId: 'd1' }, { driverId: 'd2' }]);
    await expect(service.runDriverStats()).resolves.toEqual({ driversUpdated: 2 });
  });

  it('tripLifecycle delegates to TripExpiryService.refreshStaleTrips', async () => {
    const { tripExpiry, service } = makeDeps();
    tripExpiry.refreshStaleTrips.mockResolvedValue({
      autoCompleted: ['t1'],
      expiredUnoperated: [],
      noShowBookings: 0,
      errors: [],
      touched: 1,
    });
    const out = await service.runTripLifecycle();
    expect(tripExpiry.refreshStaleTrips).toHaveBeenCalledWith();
    expect(out.touched).toBe(1);
  });
});

describe('scheduler semantics', () => {
  it('cron handlers are safe no-ops in the test env', () => {
    const { prisma, service } = makeDeps();
    expect(process.env.NODE_ENV).toBe('test');
    service.expirySweep();
    service.expiryReminder();
    service.lowBalanceWarning();
    service.sosEscalation();
    service.dataRetention();
    service.routeRetry();
    service.actualPath();
    service.driverStats();
    service.tripLifecycle();
    expect(prisma.driverSubscription.findMany).not.toHaveBeenCalled();
  });

  it('exposes all 9 schedules', () => {
    const { service } = makeDeps();
    for (const name of [
      'expirySweep',
      'expiryReminder',
      'lowBalanceWarning',
      'sosEscalation',
      'dataRetention',
      'routeRetry',
      'actualPath',
      'driverStats',
      'tripLifecycle',
    ] as const) {
      expect(typeof service[name]).toBe('function');
    }
  });
});
