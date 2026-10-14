var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JobsService_1;
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
const LAST_RUN_TTL_SECONDS = 3 * 24 * 60 * 60;
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const LOCATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const SOS_LOCATION_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const MESSAGE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
function lastRunKey(name) {
    return `jobs:lastrun:${name}`;
}
let JobsService = JobsService_1 = class JobsService {
    prisma;
    redis;
    balance;
    notifications;
    commission;
    sos;
    tripExpiry;
    routes;
    stats;
    logger = new Logger(JobsService_1.name);
    running = new Set();
    constructor(prisma, redis, balance, notifications, commission, sos, tripExpiry, routes, stats) {
        this.prisma = prisma;
        this.redis = redis;
        this.balance = balance;
        this.notifications = notifications;
        this.commission = commission;
        this.sos = sos;
        this.tripExpiry = tripExpiry;
        this.routes = routes;
        this.stats = stats;
    }
    async guarded(name, fn) {
        if (this.running.has(name)) {
            this.logger.warn(`[jobs] ${name}: previous run still in progress, skipping this tick`);
            return undefined;
        }
        this.running.add(name);
        try {
            let result;
            try {
                result = await fn();
            }
            catch (err) {
                this.logger.error(`[jobs] ${name} failed: ${err.message}`);
                return undefined;
            }
            try {
                await this.redis.setKey(lastRunKey(name), new Date().toISOString(), LAST_RUN_TTL_SECONDS);
            }
            catch (err) {
                this.logger.warn(`[jobs] ${name} lastrun record failed: ${err.message}`);
            }
            return result;
        }
        finally {
            this.running.delete(name);
        }
    }
    async runExpirySweep() {
        const now = new Date();
        const due = await this.prisma.driverSubscription.findMany({
            where: { status: 'active', expiresAt: { lte: now } },
        });
        const byDriver = new Map();
        for (const sub of due) {
            const arr = byDriver.get(sub.driverId) ?? [];
            arr.push(sub);
            byDriver.set(sub.driverId, arr);
        }
        const results = [];
        for (const [driverId, subs] of byDriver) {
            const outcome = await this.prisma.$transaction(async (t) => {
                const expired = [];
                for (const sub of subs) {
                    const res = await this.balance.expireSubscription({ id: sub.id, driverId: sub.driverId, planName: sub.planName, planCost: sub.planCost, balance: sub.balance }, t);
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
            }
            catch (err) {
                this.logger.warn(`[expirySweepJob] notification failed: ${err.message}`);
            }
            results.push(outcome);
        }
        return results;
    }
    async runExpiryReminder() {
        const now = new Date();
        const horizon = new Date(now.getTime() + REMINDER_WINDOW_MS);
        const expiring = await this.prisma.driverSubscription.findMany({
            where: { status: 'active', expiresAt: { gt: now, lte: horizon } },
            orderBy: { expiresAt: 'asc' },
        });
        const byDriver = new Map();
        for (const sub of expiring) {
            if (!byDriver.has(sub.driverId))
                byDriver.set(sub.driverId, sub);
        }
        const notified = [];
        for (const [driverId, sub] of byDriver) {
            try {
                const user = await this.prisma.user.findUnique({ where: { id: driverId } });
                if (!user)
                    continue;
                await this.notifications.sendToUser({ id: driverId }, 'PLAN_EXPIRING_SOON', {
                    channels: ['in_app', 'push'],
                    vars: { plan: sub.planName },
                    data: { subscription_id: sub.id, expires_at: sub.expiresAt },
                });
                notified.push({ driverId, subscriptionId: sub.id, planName: sub.planName });
            }
            catch (err) {
                this.logger.warn(`[expiryReminderJob] notification failed: ${err.message}`);
            }
        }
        return notified;
    }
    async runLowBalanceWarning() {
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
        const byDriver = new Map();
        for (const trip of upcoming) {
            if (!byDriver.has(trip.driverId))
                byDriver.set(trip.driverId, trip);
        }
        const warned = [];
        for (const [driverId, trip] of byDriver) {
            try {
                const { current, minimum, totalBalance } = await this.commission.getGatingSnapshot(driverId, Number(trip.farePerSeat));
                if (!current || totalBalance >= minimum)
                    continue;
                const user = await this.prisma.user.findUnique({ where: { id: driverId } });
                if (!user)
                    continue;
                await this.notifications.sendToUser({ id: driverId }, 'LOW_BALANCE_WARNING', {
                    channels: ['in_app', 'push'],
                    vars: { route: trip.destinationCity || '' },
                    data: { trip_id: trip.id, required: minimum, balance: totalBalance },
                });
                warned.push({ driverId, tripId: trip.id, minimum, balance: totalBalance });
            }
            catch (err) {
                this.logger.warn(`[lowBalanceWarningJob] notification failed: ${err.message}`);
            }
        }
        return warned;
    }
    async runSosEscalation() {
        return this.sos.runEscalation();
    }
    async runDataRetention() {
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
        }
        else {
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
    async runRouteRetry() {
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
                if (out.ok)
                    result.recovered += 1;
                else
                    result.stillFailing += 1;
            }
            catch (err) {
                result.stillFailing += 1;
                this.logger.warn(`[routeRetryJob] trip ${t.id} failed: ${err.message}`);
            }
        }
        if (result.stillFailing > 0) {
            this.logger.warn(`[routeRetryJob] ${result.stillFailing} trip(s) still without a route`);
        }
        return result;
    }
    async runActualPath() {
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
                if (out.ok)
                    result.compacted += 1;
                else
                    result.skipped += 1;
            }
            catch (err) {
                result.skipped += 1;
                this.logger.warn(`[actualPathJob] trip ${t.id} failed: ${err.message}`);
            }
        }
        return result;
    }
    async runDriverStats() {
        const updated = await this.stats.recomputeAllDrivers();
        return { driversUpdated: updated.length };
    }
    async runTripLifecycle() {
        const result = await this.tripExpiry.refreshStaleTrips();
        if (result.touched > 0) {
            this.logger.log(`[tripLifecycleJob] closed ${result.autoCompleted.length} completed + ${result.expiredUnoperated.length} unoperated (${result.noShowBookings} no-show bookings), ${result.errors.length} error(s)`);
        }
        return result;
    }
    isTestEnv() {
        return process.env.NODE_ENV === 'test';
    }
    expirySweep() {
        if (this.isTestEnv())
            return;
        void this.guarded('expirySweep', () => this.runExpirySweep());
    }
    expiryReminder() {
        if (this.isTestEnv())
            return;
        void this.guarded('expiryReminder', () => this.runExpiryReminder());
    }
    lowBalanceWarning() {
        if (this.isTestEnv())
            return;
        void this.guarded('lowBalanceWarning', () => this.runLowBalanceWarning());
    }
    sosEscalation() {
        if (this.isTestEnv())
            return;
        void this.guarded('sosEscalation', () => this.runSosEscalation());
    }
    dataRetention() {
        if (this.isTestEnv())
            return;
        void this.guarded('dataRetention', () => this.runDataRetention());
    }
    routeRetry() {
        if (this.isTestEnv())
            return;
        void this.guarded('routeRetry', () => this.runRouteRetry());
    }
    actualPath() {
        if (this.isTestEnv())
            return;
        void this.guarded('actualPath', () => this.runActualPath());
    }
    driverStats() {
        if (this.isTestEnv())
            return;
        void this.guarded('driverStats', () => this.runDriverStats());
    }
    tripLifecycle() {
        if (this.isTestEnv())
            return;
        void this.guarded('tripLifecycle', () => this.runTripLifecycle());
    }
};
__decorate([
    Cron(process.env.JOB_EXPIRY_SWEEP_CRON ?? '0 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "expirySweep", null);
__decorate([
    Cron(process.env.JOB_REMINDER_CRON ?? '0 9 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "expiryReminder", null);
__decorate([
    Cron('0 12 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "lowBalanceWarning", null);
__decorate([
    Cron('*/1 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "sosEscalation", null);
__decorate([
    Cron('0 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "dataRetention", null);
__decorate([
    Cron('*/2 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "routeRetry", null);
__decorate([
    Cron(process.env.JOB_PATH_COMPACT_CRON ?? '*/10 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "actualPath", null);
__decorate([
    Cron('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "driverStats", null);
__decorate([
    Cron('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], JobsService.prototype, "tripLifecycle", null);
JobsService = JobsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        RedisService,
        BalanceService,
        NotificationsService,
        CommissionService,
        SosService,
        TripExpiryService,
        RouteService,
        DriverStatsService])
], JobsService);
export { JobsService };
//# sourceMappingURL=jobs.service.js.map