import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export declare function round(n: unknown): number;
type Tx = Prisma.TransactionClient;
export interface SubscriptionRow {
    id: string;
    driverId: string;
    planName: string;
    planCost: unknown;
    balance: unknown;
}
export declare class BalanceService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private static queueOrder;
    private static activeWhere;
    findCurrentSubscription(driverId: string, tx?: Tx): Promise<Record<string, unknown> | null>;
    getActiveSubscriptions(driverId: string, tx?: Tx): Promise<Record<string, unknown>[]>;
    recomputeCachedBalance(driverId: string, tx?: Tx): Promise<{
        totalBalance: number;
        isInDebt: boolean;
    }>;
    creditOnApproval(subscription: SubscriptionRow, { transaction, extraBalance, mergedBalance }?: {
        transaction?: Tx;
        actorId?: string | null;
        extraBalance?: number;
        mergedBalance?: number;
    }): Promise<{
        balanceAdded: number;
        totalBalance: number;
        isInDebt: boolean;
    }>;
    deductCommission({ driverId, amount, }: {
        driverId: string;
        amount: number;
    }): Promise<{
        commission: number;
        planName: string | null;
        balanceAfter: number;
        isInDebt: boolean;
        shortfall: number;
        tripsBlocked: boolean;
    }>;
    expireSubscription(subscription: SubscriptionRow, tx?: Tx): Promise<{
        removedBalance: number;
        totalBalance: number;
        isInDebt: boolean;
    }>;
    syncTripBlocking(driverId: string, tx?: Tx): Promise<{
        blocked: boolean;
        changed: boolean;
    }>;
    blockDriverTrips(driverId: string, tx?: Tx): Promise<{
        blocked: boolean;
        changed: boolean;
    }>;
    unblockDriverTrips(driverId: string, tx?: Tx): Promise<{
        blocked: boolean;
        changed: boolean;
    }>;
    getBalanceOverview(driverId: string): Promise<{
        total_balance: number;
        is_in_debt: boolean;
        current_plan: {
            id: string;
            plan_name: string;
            plan_percentage_cut: number;
            balance: number;
            expires_at: Date | null;
        } | null;
    } | null>;
}
export {};
