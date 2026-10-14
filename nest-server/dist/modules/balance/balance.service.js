var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BalanceService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { withSerializableRetry } from '../../prisma/transaction.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
let BalanceService = BalanceService_1 = class BalanceService {
    prisma;
    notifications;
    logger = new Logger(BalanceService_1.name);
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    static queueOrder() {
        return [
            { plan: { isFree: 'desc' } },
            { planPeriodDays: 'asc' },
            { createdAt: 'asc' },
        ];
    }
    static activeWhere(driverId) {
        return { driverId, status: 'active', expiresAt: { gt: new Date() } };
    }
    async findCurrentSubscription(driverId, tx) {
        const db = tx ?? this.prisma;
        return (await db.driverSubscription.findFirst({
            where: BalanceService_1.activeWhere(driverId),
            include: { plan: { select: { isFree: true, freeOffer: true } } },
            orderBy: BalanceService_1.queueOrder(),
        }));
    }
    async getActiveSubscriptions(driverId, tx) {
        const db = tx ?? this.prisma;
        return (await db.driverSubscription.findMany({
            where: BalanceService_1.activeWhere(driverId),
            include: { plan: { select: { isFree: true } } },
            orderBy: BalanceService_1.queueOrder(),
        }));
    }
    async recomputeCachedBalance(driverId, tx) {
        const run = async (db) => {
            const user = await db.user.findUnique({ where: { id: driverId } });
            if (!user)
                return { totalBalance: 0, isInDebt: false };
            const subs = await db.driverSubscription.findMany({
                where: BalanceService_1.activeWhere(driverId),
            });
            const activeBalance = round(subs.reduce((sum, s) => sum + Number(s.balance), 0));
            const debt = Math.max(0, round(activeBalance - Number(user.totalBalance)));
            const total = round(activeBalance - debt);
            const isInDebt = total < 0;
            await db.user.update({ where: { id: driverId }, data: { totalBalance: total, isInDebt } });
            return { totalBalance: total, isInDebt };
        };
        if (tx)
            return run(tx);
        return this.prisma.$transaction((t) => run(t));
    }
    async creditOnApproval(subscription, { transaction, extraBalance = 0, mergedBalance = 0 } = {}) {
        const run = async (db) => {
            const subscriptionBalance = round(Number(subscription.planCost) + Number(extraBalance || 0));
            const totalDelta = round(subscriptionBalance - Number(mergedBalance || 0));
            const user = await db.user.findUnique({ where: { id: subscription.driverId } });
            if (!user)
                return { balanceAdded: 0, totalBalance: 0, isInDebt: false, blockingNotify: null };
            const newTotal = round(Number(user.totalBalance) + totalDelta);
            const isInDebt = newTotal < 0;
            await db.driverSubscription.update({
                where: { id: subscription.id },
                data: { balance: subscriptionBalance },
            });
            await db.user.update({
                where: { id: subscription.driverId },
                data: { totalBalance: newTotal, isInDebt },
            });
            const blockingNotify = !isInDebt ? await this.applyTripBlocking(subscription.driverId, db) : null;
            return { balanceAdded: totalDelta, totalBalance: newTotal, isInDebt, blockingNotify };
        };
        if (transaction)
            return run(transaction);
        const out = await withSerializableRetry(this.prisma, (t) => run(t));
        if (out.blockingNotify)
            await this.sendBlockingNotify(out.blockingNotify);
        return out;
    }
    async deductCommission({ driverId, amount, }, transaction) {
        const run = async (t) => {
            const activeSubs = await t.driverSubscription.findMany({
                where: BalanceService_1.activeWhere(driverId),
                orderBy: BalanceService_1.queueOrder(),
            });
            const user = await t.user.findUnique({ where: { id: driverId } });
            if (!user) {
                return {
                    commission: round(amount),
                    planName: null,
                    balanceAfter: 0,
                    isInDebt: false,
                    shortfall: round(amount),
                    tripsBlocked: false,
                    blockingNotify: null,
                };
            }
            let remaining = round(amount);
            let planName = null;
            let deducted = 0;
            void deducted;
            for (const sub of activeSubs) {
                if (remaining <= 0)
                    break;
                const bal = Number(sub.balance);
                if (bal <= 0)
                    continue;
                const take = Math.min(bal, remaining);
                await t.driverSubscription.update({
                    where: { id: sub.id },
                    data: { balance: round(bal - take) },
                });
                remaining = round(remaining - take);
                if (!planName)
                    planName = sub.planName;
            }
            const newTotal = round(Number(user.totalBalance) - amount);
            const isInDebt = newTotal < 0;
            await t.user.update({ where: { id: driverId }, data: { totalBalance: newTotal, isInDebt } });
            let tripsBlocked = false;
            let blockingNotify = null;
            if (isInDebt) {
                blockingNotify = await this.applyTripBlocking(driverId, t);
                tripsBlocked = true;
            }
            return {
                commission: round(amount),
                planName,
                balanceAfter: newTotal,
                isInDebt,
                shortfall: remaining,
                tripsBlocked,
                blockingNotify,
            };
        };
        if (transaction)
            return run(transaction);
        const out = await withSerializableRetry(this.prisma, (t) => run(t));
        if (out.blockingNotify)
            await this.sendBlockingNotify(out.blockingNotify);
        return out;
    }
    async expireSubscription(subscription, tx) {
        const run = async (db) => {
            const balance = Number(subscription.balance);
            await db.driverSubscription.update({
                where: { id: subscription.id },
                data: { status: 'expired' },
            });
            const user = await db.user.findUnique({ where: { id: subscription.driverId } });
            if (!user)
                return { removedBalance: balance, totalBalance: 0, isInDebt: false };
            const newTotal = round(Number(user.totalBalance) - balance);
            const isInDebt = newTotal < 0;
            await db.user.update({
                where: { id: subscription.driverId },
                data: { totalBalance: newTotal, isInDebt },
            });
            return { removedBalance: balance, totalBalance: newTotal, isInDebt };
        };
        if (tx)
            return run(tx);
        return this.prisma.$transaction((t) => run(t));
    }
    async applyTripBlocking(driverId, db) {
        const activeCount = await db.driverSubscription.count({
            where: BalanceService_1.activeWhere(driverId),
        });
        const user = await db.user.findUnique({ where: { id: driverId } });
        if (!user)
            return null;
        const blocked = user.isInDebt || activeCount === 0;
        const trips = await db.trip.findMany({
            where: {
                driverId,
                status: { in: ['published', 'full', 'in_progress', 'ongoing'] },
            },
            select: { id: true, isBlockedByBalance: true },
        });
        let changed = false;
        for (const trip of trips) {
            if (trip.isBlockedByBalance !== blocked) {
                await db.trip.update({ where: { id: trip.id }, data: { isBlockedByBalance: blocked } });
                changed = true;
            }
        }
        if (!changed)
            return null;
        return {
            driverId,
            tripIds: trips.map((tr) => tr.id),
            type: blocked ? 'TRIP_UNAVAILABLE' : 'TRIP_REPUBLISHED',
        };
    }
    async sendBlockingNotify(notify) {
        try {
            await this.notifications.notifyBookedPassengers(notify.tripIds, notify.type, {
                data: { driver_id: notify.driverId },
            });
        }
        catch (err) {
            this.logger.warn(`blocking notification failed: ${err.message}`);
        }
    }
    async syncTripBlocking(driverId, tx) {
        const run = async (db) => {
            const activeCount = await db.driverSubscription.count({
                where: BalanceService_1.activeWhere(driverId),
            });
            const user = await db.user.findUnique({ where: { id: driverId } });
            if (!user)
                return { blocked: false, changed: false };
            const blocked = user.isInDebt || activeCount === 0;
            const trips = await db.trip.findMany({
                where: {
                    driverId,
                    status: { in: ['published', 'full', 'in_progress', 'ongoing'] },
                },
                select: { id: true, isBlockedByBalance: true },
            });
            let changed = false;
            for (const trip of trips) {
                if (trip.isBlockedByBalance !== blocked) {
                    await db.trip.update({ where: { id: trip.id }, data: { isBlockedByBalance: blocked } });
                    changed = true;
                }
            }
            if (changed) {
                const tripIds = trips.map((tr) => tr.id);
                await this.notifications.notifyBookedPassengers(tripIds, blocked ? 'TRIP_UNAVAILABLE' : 'TRIP_REPUBLISHED', { data: { driver_id: driverId } });
            }
            return { blocked, changed };
        };
        if (tx)
            return run(tx);
        return this.prisma.$transaction((t) => run(t));
    }
    async blockDriverTrips(driverId, tx) {
        return this.syncTripBlocking(driverId, tx);
    }
    async unblockDriverTrips(driverId, tx) {
        return this.syncTripBlocking(driverId, tx);
    }
    async getBalanceOverview(driverId) {
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user)
            return null;
        const current = (await this.findCurrentSubscription(driverId));
        return {
            total_balance: Number(user.totalBalance),
            is_in_debt: user.isInDebt,
            current_plan: current
                ? {
                    id: current.id,
                    plan_name: current.planName,
                    plan_percentage_cut: Number(current.planPercentageCut),
                    balance: Number(current.balance),
                    expires_at: current.expiresAt,
                }
                : null,
        };
    }
};
BalanceService = BalanceService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService])
], BalanceService);
export { BalanceService };
//# sourceMappingURL=balance.service.js.map