import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { withSerializableRetry } from '../../prisma/transaction.js';
import { NotificationsService } from '../notifications/notifications.service.js';

// Port of Main Server/Services/balanceService.ts — the single gateway for
// EVERY balance mutation. NOTE: Sequelize row-level locks (LOCK.UPDATE) have
// no Prisma equivalent; mutations run in transactions without explicit
// FOR UPDATE. Documented deviation, acceptable for the workload.
export function round(n: unknown): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

type Tx = Prisma.TransactionClient;

export interface BlockingNotify {
  driverId: string;
  tripIds: string[];
  type: 'TRIP_UNAVAILABLE' | 'TRIP_REPUBLISHED';
}

export interface SubscriptionRow {
  id: string;
  driverId: string;
  planName: string;
  planCost: unknown;
  balance: unknown;
}

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private static queueOrder(): Prisma.DriverSubscriptionOrderByWithRelationInput[] {
    return [
      { plan: { isFree: 'desc' } },
      { planPeriodDays: 'asc' },
      { createdAt: 'asc' },
    ];
  }

  private static activeWhere(driverId: string): Prisma.DriverSubscriptionWhereInput {
    return { driverId, status: 'active', expiresAt: { gt: new Date() } };
  }

  async findCurrentSubscription(driverId: string, tx?: Tx): Promise<Record<string, unknown> | null> {
    const db = tx ?? this.prisma;
    return (await db.driverSubscription.findFirst({
      where: BalanceService.activeWhere(driverId),
      include: { plan: { select: { isFree: true, freeOffer: true } } },
      orderBy: BalanceService.queueOrder(),
    })) as unknown as Record<string, unknown> | null;
  }

  async getActiveSubscriptions(driverId: string, tx?: Tx): Promise<Record<string, unknown>[]> {
    const db = tx ?? this.prisma;
    return (await db.driverSubscription.findMany({
      where: BalanceService.activeWhere(driverId),
      include: { plan: { select: { isFree: true } } },
      orderBy: BalanceService.queueOrder(),
    })) as unknown as Record<string, unknown>[];
  }

  async recomputeCachedBalance(
    driverId: string,
    tx?: Tx,
  ): Promise<{ totalBalance: number; isInDebt: boolean }> {
    const run = async (db: Tx | PrismaService): Promise<{ totalBalance: number; isInDebt: boolean }> => {
      const user = await db.user.findUnique({ where: { id: driverId } });
      if (!user) return { totalBalance: 0, isInDebt: false };
      const subs = await db.driverSubscription.findMany({
        where: BalanceService.activeWhere(driverId),
      });
      const activeBalance = round(subs.reduce((sum, s) => sum + Number(s.balance), 0));
      const debt = Math.max(0, round(activeBalance - Number(user.totalBalance)));
      const total = round(activeBalance - debt);
      const isInDebt = total < 0;
      await db.user.update({ where: { id: driverId }, data: { totalBalance: total, isInDebt } });
      return { totalBalance: total, isInDebt };
    };
    if (tx) return run(tx);
    return this.prisma.$transaction((t) => run(t));
  }

  async creditOnApproval(
    subscription: SubscriptionRow,
    { transaction, extraBalance = 0, mergedBalance = 0 }: { transaction?: Tx; actorId?: string | null; extraBalance?: number; mergedBalance?: number } = {},
  ): Promise<{ balanceAdded: number; totalBalance: number; isInDebt: boolean; blockingNotify: BlockingNotify | null }> {
    const run = async (db: Tx | PrismaService) => {
      const subscriptionBalance = round(Number(subscription.planCost) + Number(extraBalance || 0));
      const totalDelta = round(subscriptionBalance - Number(mergedBalance || 0));
      const user = await db.user.findUnique({ where: { id: subscription.driverId } });
      if (!user) return { balanceAdded: 0, totalBalance: 0, isInDebt: false, blockingNotify: null };
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
      // When joining an outer money-flow transaction the blocking
      // notification is deferred: the caller sends it after commit.
      // When this method owns the transaction it is sent after commit below.
      const blockingNotify = !isInDebt ? await this.applyTripBlocking(subscription.driverId, db as Tx) : null;
      return { balanceAdded: totalDelta, totalBalance: newTotal, isInDebt, blockingNotify };
    };
    if (transaction) return run(transaction);
    const out = await withSerializableRetry(this.prisma, (t) => run(t));
    if (out.blockingNotify) await this.sendBlockingNotify(out.blockingNotify);
    return out;
  }

  async deductCommission(
    {
      driverId,
      amount,
    }: {
      driverId: string;
      amount: number;
    },
    transaction?: Tx,
  ): Promise<{
    commission: number;
    planName: string | null;
    balanceAfter: number;
    isInDebt: boolean;
    shortfall: number;
    tripsBlocked: boolean;
    blockingNotify: BlockingNotify | null;
  }> {
    const run = async (t: Tx | PrismaService) => {
      const activeSubs = await t.driverSubscription.findMany({
        where: BalanceService.activeWhere(driverId),
        orderBy: BalanceService.queueOrder(),
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
      let planName: string | null = null;
      let deducted = 0;
      void deducted;
      for (const sub of activeSubs) {
        if (remaining <= 0) break;
        const bal = Number(sub.balance);
        if (bal <= 0) continue;
        const take = Math.min(bal, remaining);
        await t.driverSubscription.update({
          where: { id: sub.id },
          data: { balance: round(bal - take) },
        });
        remaining = round(remaining - take);
        if (!planName) planName = sub.planName;
      }
      const newTotal = round(Number(user.totalBalance) - amount);
      const isInDebt = newTotal < 0;
      await t.user.update({ where: { id: driverId }, data: { totalBalance: newTotal, isInDebt } });

      let tripsBlocked = false;
      let blockingNotify: BlockingNotify | null = null;
      if (isInDebt) {
        // Deferred: the owner of the transaction sends this after commit.
        blockingNotify = await this.applyTripBlocking(driverId, t as Tx);
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
    if (transaction) return run(transaction);
    const out = await withSerializableRetry(this.prisma, (t) => run(t));
    if (out.blockingNotify) await this.sendBlockingNotify(out.blockingNotify);
    return out;
  }

  async expireSubscription(
    subscription: SubscriptionRow,
    tx?: Tx,
  ): Promise<{ removedBalance: number; totalBalance: number; isInDebt: boolean }> {
    const run = async (db: Tx | PrismaService) => {
      const balance = Number(subscription.balance);
      await db.driverSubscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' },
      });
      const user = await db.user.findUnique({ where: { id: subscription.driverId } });
      if (!user) return { removedBalance: balance, totalBalance: 0, isInDebt: false };
      const newTotal = round(Number(user.totalBalance) - balance);
      const isInDebt = newTotal < 0;
      await db.user.update({
        where: { id: subscription.driverId },
        data: { totalBalance: newTotal, isInDebt },
      });
      return { removedBalance: balance, totalBalance: newTotal, isInDebt };
    };
    if (tx) return run(tx);
    return this.prisma.$transaction((t) => run(t));
  }

  // Pure-DB half of syncTripBlocking: flips isBlockedByBalance and reports
  // the notification to send, but never sends it (callers notify after the
  // outermost commit so in-flight transactions are never announced).
  private async applyTripBlocking(driverId: string, db: Tx): Promise<BlockingNotify | null> {
    const activeCount = await db.driverSubscription.count({
      where: BalanceService.activeWhere(driverId),
    });
    const user = await db.user.findUnique({ where: { id: driverId } });
    if (!user) return null;
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
    if (!changed) return null;
    return {
      driverId,
      tripIds: trips.map((tr) => tr.id),
      type: blocked ? 'TRIP_UNAVAILABLE' : 'TRIP_REPUBLISHED',
    };
  }

  async sendBlockingNotify(notify: BlockingNotify): Promise<void> {
    try {
      await this.notifications.notifyBookedPassengers(notify.tripIds, notify.type, {
        data: { driver_id: notify.driverId },
      });
    } catch (err) {
      this.logger.warn(`blocking notification failed: ${(err as Error).message}`);
    }
  }

  async syncTripBlocking(
    driverId: string,
    tx?: Tx,
  ): Promise<{ blocked: boolean; changed: boolean }> {
    const run = async (db: Tx | PrismaService) => {
      const activeCount = await db.driverSubscription.count({
        where: BalanceService.activeWhere(driverId),
      });
      const user = await db.user.findUnique({ where: { id: driverId } });
      if (!user) return { blocked: false, changed: false };
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
        await this.notifications.notifyBookedPassengers(
          tripIds,
          blocked ? 'TRIP_UNAVAILABLE' : 'TRIP_REPUBLISHED',
          { data: { driver_id: driverId } },
        );
      }
      return { blocked, changed };
    };
    if (tx) return run(tx);
    return this.prisma.$transaction((t) => run(t));
  }

  async blockDriverTrips(driverId: string, tx?: Tx): Promise<{ blocked: boolean; changed: boolean }> {
    return this.syncTripBlocking(driverId, tx);
  }

  async unblockDriverTrips(driverId: string, tx?: Tx): Promise<{ blocked: boolean; changed: boolean }> {
    return this.syncTripBlocking(driverId, tx);
  }

  async getBalanceOverview(driverId: string): Promise<{
    total_balance: number;
    is_in_debt: boolean;
    current_plan: {
      id: string;
      plan_name: string;
      plan_percentage_cut: number;
      balance: number;
      expires_at: Date | null;
    } | null;
  } | null> {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) return null;
    const current = (await this.findCurrentSubscription(driverId)) as unknown as {
      id: string;
      planName: string;
      planPercentageCut: unknown;
      balance: unknown;
      expiresAt: Date | null;
    } | null;
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
}
