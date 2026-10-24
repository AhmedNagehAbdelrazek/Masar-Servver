import { PrismaService } from '../../prisma/prisma.service.js';
import { BalanceService } from '../balance/balance.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
interface SubscriptionRow {
    id: string;
    planName: string;
    planPeriodDays: number;
    planPercentageCut: unknown;
    planCost: unknown;
    balance: unknown;
    status: string;
    adminNotes: string | null;
    createdAt: Date;
    approvedAt: Date | null;
    expiresAt: Date | null;
    freeOffer: unknown;
    freeTripsUsed: number;
}
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly balance;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, balance: BalanceService, notifications: NotificationsService);
    private toSubscriptionDTO;
    private toCurrentDTO;
    createSubscription(driverId: string, data: {
        plan_id: string;
        payment_method_id: string;
        screenshot_id: number;
        resubmit?: boolean;
    }): Promise<SubscriptionRow>;
    getMySubscriptions(driverId: string): Promise<Record<string, unknown>[]>;
    getCurrentSubscription(driverId: string): Promise<Record<string, unknown>>;
    private queryPendingRows;
    listPending(filters?: {
        status?: string;
        sort?: string;
        search?: string;
        plan_id?: string;
        from?: string;
        to?: string;
    }): Promise<Record<string, unknown>[]>;
    getStats(): Promise<Record<string, unknown>>;
    private queryDetailRow;
    getDetail(subscriptionId: string): Promise<Record<string, unknown>>;
    approve(subscriptionId: string, _actorId: string): Promise<{
        message: string;
        subscription_id: string;
        balance_added: number;
    }>;
    reject(subscriptionId: string, reason: string, _actorId: string): Promise<{
        message: string;
        subscription_id: string;
    }>;
    getCurrentActivePlan(driverId: string): Promise<unknown>;
}
export {};
