import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreateSubscriptionDto } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';
export declare class SubscriptionsController {
    private readonly subscriptions;
    constructor(subscriptions: SubscriptionsService);
    createSubscription(dto: CreateSubscriptionDto, user?: AuthUser): Promise<{
        subscription_id: string;
        status: string;
        message: string;
    }>;
    getMySubscriptions(user?: AuthUser): Promise<{
        subscriptions: Record<string, unknown>[];
    }>;
    getCurrentSubscription(user?: AuthUser): Promise<Record<string, unknown>>;
}
