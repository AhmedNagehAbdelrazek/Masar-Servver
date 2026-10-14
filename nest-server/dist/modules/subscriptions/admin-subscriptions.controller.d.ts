import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminSubscriptionListQuery, RejectSubscriptionDto, SubscriptionIdParam } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';
export declare class AdminSubscriptionsController {
    private readonly subscriptions;
    constructor(subscriptions: SubscriptionsService);
    getStats(): Promise<Record<string, unknown>>;
    listPending(query: AdminSubscriptionListQuery): Promise<{
        pending: Record<string, unknown>[];
    }>;
    getDetail(params: SubscriptionIdParam): Promise<Record<string, unknown>>;
    approveSubscription(params: SubscriptionIdParam, user?: AuthUser): Promise<{
        message: string;
        subscription_id: string;
        balance_added: number;
    }>;
    rejectSubscription(params: SubscriptionIdParam, dto: RejectSubscriptionDto, user?: AuthUser): Promise<{
        message: string;
        subscription_id: string;
    }>;
}
