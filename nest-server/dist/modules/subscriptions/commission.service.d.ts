import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BalanceService, type BlockingNotify } from '../balance/balance.service.js';
type Tx = Prisma.TransactionClient;
export declare class CommissionService {
    private readonly prisma;
    private readonly balance;
    constructor(prisma: PrismaService, balance: BalanceService);
    minimumBalanceForPlan(plan: {
        planPercentageCut: unknown;
    } | null, farePerSeat: number): number;
    getGatingSnapshot(driverId: string, farePerSeat: number): Promise<{
        current: unknown;
        minimum: number;
        totalBalance: number;
    }>;
    getTotalFare(tripId: string, tx?: Tx): Promise<number>;
    deductCommission(trip: {
        id: string;
        driverId: string;
    }, actorId?: string | null, tx?: Tx): Promise<{
        commission: number;
        rate: number;
        totalFare: number;
        planName: string | null;
        balanceAfter: number;
        isInDebt: boolean;
        shortfall: number;
        tripsBlocked: boolean;
        blockingNotify: BlockingNotify | null;
    }>;
}
export {};
