import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { BalanceService } from '../modules/balance/balance.service.js';
import { DriverStatsService } from '../modules/driver/driver-stats.service.js';
import { RouteService } from '../modules/maps/route.service.js';
import { NotificationsService } from '../modules/notifications/notifications.service.js';
import { SosService } from '../modules/sos/sos.service.js';
import { CommissionService } from '../modules/subscriptions/commission.service.js';
import { TripExpiryService } from '../modules/trips/trip-expiry.service.js';

// Nest port of Main Server/jobs/* (9 schedules). Schedule strings match
// jobs/index.ts exactly. Overlap guard + `jobs:lastrun:*` keys (3d TTL)
// mirror the Express scheduler semantics. Cron handlers are safe no-ops in
// test env (NODE_ENV=test never ran jobs in Express either); the public
// run* methods hold the bodies so tests can invoke them directly.
const LAST_RUN_TTL_SECONDS = 3 * 24 * 60 * 60;
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const LOCATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const SOS_LOCATION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const MESSAGE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

function lastRunKey(name: string): string {
  return `jobs:lastrun:${name}`;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly running = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly balance: BalanceService,
    private readonly notifications: NotificationsService,
    private readonly commission: CommissionService,
    private readonly sos: SosService,
    private readonly tripExpiry: TripExpiryService,
    private readonly routes: RouteService,
    private readonly stats: DriverStatsService,
  ) {}

  private async guarded<T>(name: string, fn: () => Promise<T>): Promise<T | undefined> {
    if (this.running.has(name)) {
      this.logger.warn(`[jobs] ${name}: previous run still in progress, skipping this tick`);
      return undefined;
    }
    this.running.add(name);
    try {
      let result: T;
      try {
        result = await fn();
      } catch (err) {
        // A failing job must never crash the process (cron handlers are
        // fire-and-forget `void` calls — an unhandled rejection kills Node).
        // Log and skip; the next tick retries.
        this.logger.error(`[jobs] ${name} failed: ${(err as Error).message}`);
        return undefined;
      }
      try {
        await this.redis.setKey(lastRunKey(name), new Date().toISOString(), LAST_RUN_TTL_SECONDS);
      } catch (err) {
        this.logger.warn(`[jobs] ${name} lastrun record failed: ${(err as Error).message}`);
      }
      return result;
    } finally {
      this.running.delete(name);
    }
  }

  // Port of jobs/expirySweepJob.ts: flip expired actives, recompute cached
  // balances, sync trip blocking, notify PLAN_EXPIRED (+ DEBT when in debt).
  async runExpirySweep(): Promise<
    { driverId: string; expired: { id: string; planName: string; removedBalance: number }[]; totalBalance: number; isInDebt: boolean }[]
  > {
    const now = new Date();
    const due = await this.prisma.driverSubscription.findMany({
      where: { status: 'active', expiresAt: { lte: now } },
    });
    const byDriver = new Map<string, typeof due>();
    for (const sub of due) {
      const arr = byDriver.get(sub.driverId) ?? [];
      arr.push(sub);
      byDriver.set(sub.driverId, arr);
    }

    const results: { driverId: string; expired: { id: string; planName: string; removedBalance: number }[]; totalBalance: number; isInDebt: boolean }[] = [];
    for (const [driverId, subs] of byDriver) {
      const outcome = await this.prisma.$transaction(async (t) => {
        const expired: { id: string; planName: string; removedBalance: number }[] = [];
        for (const sub of subs) {
          const res = await this.balance.expireSubscription(
            { id: sub.id, driverId: sub.driverId, planName: sub.planName, planCost: sub.planCost, balance: sub.balance },
            t,
          );
          expired.push({ id: sub.id, planName: sub.planName, removedBalance: res.removedBalance });
        }
        const cached = await this.balance.recomputeCachedBalance(driverId, t);
        await this.balance.syncTripBlocking(driverId, t);
        return { driverId, expired, totalBalance: cached.totalBalance, isInDebt: cached.isInDebt };
      });

      try {
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (user) {
          for (const entry of outcome.expired) {
            await this.notifications.sendToUser({ id: driverId }, 'PLAN_EXPIRED', {
              channels: ['in_app', 'push'],
              vars: { plan: entry.planName },
              data: { subscription_id: entry.id },
            });
          }
          if (outcome.isInDebt) {
            await this.notifications.sendToUser({ id: driverId }, 'DEBT', {
              channels: ['in_app', 'push'],
              vars: { balance: Number(outcome.totalBalance).toFixed(2) },
              data: { subscriptions: outcome.expired.map((e) => e.id) },
            });
          }
        }
      } catch (err) {
        this.logger.warn(`[expirySweepJob] notification failed: ${(err as Error).message}`);
      }
      results.push(outcome);
    }
    return results;
  }

  // Port of jobs/expiryReminderJob.ts: one PLAN_EXPIRING_SOON per driver
  // (earliest expiring active sub within 24h).
  async runExpiryReminder(): Promise<{ driverId: string; subscriptionId: string; planName: string }[]> {
    const now = new Date();
    const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);
    const expiring = await this.prisma.driverSubscription.findMany({
      where: { status: 'active', expiresAt: { gt: now, lte: horizon } },
      orderBy: { expiresAt: 'asc' },
    });
    const byDriver = new Map<string, (typeof expiring)[number]>();
    for (const sub of expiring) {
      if (!byDriver.has(sub.driverId)) byDriver.set(sub.driverId, sub);
    }
    const notified: { driverId: string; subscriptionId: string; planName: string }[] = [];
    for (const [driverId, sub] of byDriver) {
      try {
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user) continue;
        await this.notifications.sendToUser({ id: driverId }, 'PLAN_EXPIRING_SOON', {
          channels: ['in_app', 'push'],
          vars: { plan: sub.planName },
          data: { subscription_id: sub.id, expires_at: sub.expiresAt },
        });
        notified.push({ driverId, subscriptionId: sub.id, planName: sub.planName });
      } catch (err) {
        this.logger.warn(`[expiryReminderJob] notification failed: ${(err as Error).message}`);
      }
    }
    return notified;
  }

  // Port of jobs/lowBalanceWarningJob.ts: warn drivers whose upcoming-trip
  // balance cannot cover commission.
  async runLowBalanceWarning(): Promise<{ driverId: string; tripId: string; minimum: number; balance: number }[]> {
    const now = new Date();
    const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);
    const upcoming = await this.prisma.trip.findMany({
      where: {
        status: { in: ['published', 'full'] },
        isBlockedByBalance: false,
        departureTime: { gt: now, lte: horizon },
      },
      orderBy: { departureTime: 'asc' },
    });
    const byDriver = new Map<string, (typeof upcoming)[number]>();
    for (const trip of upcoming) {
      if (!byDriver.has(trip.driverId)) byDriver.set(trip.driverId, trip);
    }
    const warned: { driverId: string; tripId: string; minimum: number; balance: number }[] = [];
    for (const [driverId, trip] of byDriver) {
      try {
        const { current, minimum, totalBalance } = await this.commission.getGatingSnapshot(
          driverId,
          Number(trip.farePerSeat),
        );
        if (!current || totalBalance >= minimum) continue;
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user) continue;
        await this.notifications.sendToUser({ id: driverId }, 'LOW_BALANCE_WARNING', {
          channels: ['in_app', 'push'],
          vars: { route: trip.destinationCity || '' },
          data: { trip_id: trip.id, required: minimum, balance: totalBalance },
        });
        warned.push({ driverId, tripId: trip.id, minimum, balance: totalBalance });
      } catch (err) {
        this.logger.warn(`[lowBalanceWarningJob] notification failed: ${(err as Error).message}`);
      }
    }
    return warned;
  }

  // Port of jobs/sosEscalationJob.ts: delegates to SosService.runEscalation.
  async runSosEscalation(): Promise<{ alerted: number; escalated: number }> {
    return this.sos.runEscalation();
  }

  // Port of jobs/dataRetentionJob.ts: raw points older than 30d go, except
  // SOS-linked trips (1 year); messages older than 1 year go.
  async runDataRetention(): Promise<{ locationsDeleted: number; messagesDeleted: number }> {
    const now = Date.now();
    const results = { locationsDeleted: 0, messagesDeleted: 0 };
    const locationCutoff = new Date(now - LOCATION_RETENTION_MS);
    const messageCutoff = new Date(now - MESSAGE_RETENTION_MS);

    const sosRows = await this.prisma.sosEvent.findMany({
      select: { tripId: true },
      distinct: ['tripId'],
    });
    const sosTripIds = [...new Set((sosRows || []).map((r) => r.tripId).filter(Boolean))];

    if (sosTripIds.length === 0) {
      const deleted = await this.prisma.tripLocation.deleteMany({
        where: { createdAt: { lt: locationCutoff } },
      });
      results.locationsDeleted = deleted.count;
    } else {
      const plain = await this.prisma.tripLocation.deleteMany({
        where: { createdAt: { lt: locationCutoff }, tripId: { notIn: sosTripIds } },
      });
      results.locationsDeleted += plain.count;
      const sosCutoff = new Date(now - SOS_LOCATION_RETENTION_MS);
      const sos = await this.prisma.tripLocation.deleteMany({
        where: { createdAt: { lt: sosCutoff }, tripId: { in: sosTripIds } },
      });
      results.locationsDeleted += sos.count;
    }

    const messages = await this.prisma.message.deleteMany({
      where: { createdAt: { lt: messageCutoff } },
    });
    results.messagesDeleted = messages.count;
    return results;
  }

  // Port of jobs/routeRetryJob.ts: retry trips stuck in pending/failed
  // (updated within 7 days, max 20 oldest-first).
  async runRouteRetry(): Promise<{ retried: number; recovered: number; stillFailing: number }> {
    const result = { retried: 0, recovered: 0, stillFailing: 0 };
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trips = await this.prisma.trip.findMany({
      where: { routeStatus: { in: ['pending', 'failed'] }, updatedAt: { gt: weekAgo } },
      select: { id: true },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    });
    for (const t of trips) {
      result.retried += 1;
      try {
        const out = await this.routes.computeTripRoute(t.id);
        if (out.ok) result.recovered += 1;
        else result.stillFailing += 1;
      } catch (err) {
        result.stillFailing += 1;
        this.logger.warn(`[routeRetryJob] trip ${t.id} failed: ${(err as Error).message}`);
      }
    }
    if (result.stillFailing > 0) {
      this.logger.warn(`[routeRetryJob] ${result.stillFailing} trip(s) still without a route`);
    }
    return result;
  }

  // Port of jobs/actualPathJob.ts: compact completed trips missing a path.
  async runActualPath(): Promise<{ compacted: number; skipped: number }> {
    const result = { compacted: 0, skipped: 0 };
    const trips = await this.prisma.trip.findMany({
      where: { status: 'completed', actualPathPolyline: null },
      select: { id: true },
      orderBy: { updatedAt: 'asc' },
      take: 50,
    });
    for (const t of trips) {
      try {
        const out = await this.routes.compactActualPath(t.id);
        if (out.ok) result.compacted += 1;
        else result.skipped += 1;
      } catch (err) {
        result.skipped += 1;
        this.logger.warn(`[actualPathJob] trip ${t.id} failed: ${(err as Error).message}`);
      }
    }
    return result;
  }

  // Port of jobs/driverStatsJob.ts: recompute every active driver (audit
  // tracking is covered Nest-side by the global AuditInterceptor — skip
  // auditService.track per conventions).
  async runDriverStats(): Promise<{ driversUpdated: number }> {
    const updated = await this.stats.recomputeAllDrivers();
    return { driversUpdated: updated.length };
  }

  // Port of jobs/tripLifecycleJob.ts: close out stale trips via the same
  // sweep the read paths use.
  async runTripLifecycle(): Promise<{
    autoCompleted: string[];
    expiredUnoperated: string[];
    noShowBookings: number;
    errors: { tripId: string | null; message: string }[];
    touched: number;
  }> {
    const result = await this.tripExpiry.refreshStaleTrips();
    if (result.touched > 0) {
      this.logger.log(
        `[tripLifecycleJob] closed ${result.autoCompleted.length} completed + ${result.expiredUnoperated.length} unoperated (${result.noShowBookings} no-show bookings), ${result.errors.length} error(s)`,
      );
    }
    return result;
  }

  private isTestEnv(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  @Cron(process.env.JOB_EXPIRY_SWEEP_CRON ?? '0 0 * * *')
  expirySweep(): void {
    if (this.isTestEnv()) return;
    void this.guarded('expirySweep', () => this.runExpirySweep());
  }

  @Cron(process.env.JOB_REMINDER_CRON ?? '0 9 * * *')
  expiryReminder(): void {
    if (this.isTestEnv()) return;
    void this.guarded('expiryReminder', () => this.runExpiryReminder());
  }

  @Cron('0 12 * * *')
  lowBalanceWarning(): void {
    if (this.isTestEnv()) return;
    void this.guarded('lowBalanceWarning', () => this.runLowBalanceWarning());
  }

  @Cron('*/1 * * * *')
  sosEscalation(): void {
    if (this.isTestEnv()) return;
    void this.guarded('sosEscalation', () => this.runSosEscalation());
  }

  @Cron('0 3 * * *')
  dataRetention(): void {
    if (this.isTestEnv()) return;
    void this.guarded('dataRetention', () => this.runDataRetention());
  }

  @Cron('*/2 * * * *')
  routeRetry(): void {
    if (this.isTestEnv()) return;
    void this.guarded('routeRetry', () => this.runRouteRetry());
  }

  @Cron(process.env.JOB_PATH_COMPACT_CRON ?? '*/10 * * * *')
  actualPath(): void {
    if (this.isTestEnv()) return;
    void this.guarded('actualPath', () => this.runActualPath());
  }

  @Cron('0 2 * * *')
  driverStats(): void {
    if (this.isTestEnv()) return;
    void this.guarded('driverStats', () => this.runDriverStats());
  }

  @Cron('*/15 * * * *')
  tripLifecycle(): void {
    if (this.isTestEnv()) return;
    void this.guarded('tripLifecycle', () => this.runTripLifecycle());
  }
}
