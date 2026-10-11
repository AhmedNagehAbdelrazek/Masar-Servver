import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BalanceService, round, type BlockingNotify } from '../balance/balance.service.js';

type Tx = Prisma.TransactionClient;

// Port of Main Server/Services/commissionService.ts.
@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balance: BalanceService,
  ) {}

  minimumBalanceForPlan(
    plan: { planPercentageCut: unknown } | null,
    farePerSeat: number,
  ): number {
    const rate = plan ? Number(plan.planPercentageCut) : 0;
    return round(Number(farePerSeat) * (rate / 100));
  }

  async getGatingSnapshot(
    driverId: string,
    farePerSeat: number,
  ): Promise<{ current: unknown; minimum: number; totalBalance: number }> {
    const current = await this.balance.findCurrentSubscription(driverId);
    if (!current) return { current: null, minimum: 0, totalBalance: 0 };
    const overview = await this.balance.getBalanceOverview(driverId);
    return {
      current,
      minimum: this.minimumBalanceForPlan(
        current as unknown as { planPercentageCut: unknown },
        farePerSeat,
      ),
      totalBalance: overview ? Number(overview.total_balance) : 0,
    };
  }

  async getTotalFare(tripId: string, tx?: Tx): Promise<number> {
    const db = tx ?? this.prisma;
    const bookings = await db.booking.findMany({
      where: { tripId, status: { in: ['confirmed', 'completed'] } },
      select: { agreedFare: true },
    });
    return round(bookings.reduce((sum, b) => sum + Number(b.agreedFare), 0));
  }

  async deductCommission(
    trip: { id: string; driverId: string },
    actorId: string | null = null,
    tx?: Tx,
  ): Promise<{
    commission: number;
    rate: number;
    totalFare: number;
    planName: string | null;
    balanceAfter: number;
    isInDebt: boolean;
    shortfall: number;
    tripsBlocked: boolean;
    blockingNotify: BlockingNotify | null;
  }> {
    const totalFare = await this.getTotalFare(trip.id, tx);
    const current = (await this.balance.findCurrentSubscription(trip.driverId, tx)) as unknown as {
      planPercentageCut: unknown;
    } | null;
    const rate = current ? Number(current.planPercentageCut) : 0;
    const commission = round(totalFare * (rate / 100));
    const result = await this.balance.deductCommission(
      {
        driverId: trip.driverId,
        amount: commission,
      },
      tx,
    );
    void actorId;
    return {
      commission,
      rate,
      totalFare,
      planName: result.planName,
      balanceAfter: result.balanceAfter,
      isInDebt: result.isInDebt,
      shortfall: result.shortfall,
      tripsBlocked: result.tripsBlocked,
      blockingNotify: result.blockingNotify,
    };
  }
}
