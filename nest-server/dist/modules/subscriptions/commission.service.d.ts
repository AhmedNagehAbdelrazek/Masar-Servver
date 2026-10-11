import { PrismaService } from '../../prisma/prisma.service.js';
import { BalanceService } from '../balance/balance.service.js';
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
    getTotalFare(tripId: string): Promise<number>;
    deductCommission(trip: {
        id: string;
        driverId: string;
    }, actorId?: string | null): Promise<{
        commission: number;
        rate: number;
        totalFare: number;
        planName: string | null;
        balanceAfter: number;
        isInDebt: boolean;
        shortfall: number;
        tripsBlocked: boolean;
    }>;
}
