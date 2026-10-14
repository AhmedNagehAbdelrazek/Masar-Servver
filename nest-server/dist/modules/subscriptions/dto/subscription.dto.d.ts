export declare class CreateSubscriptionDto {
    plan_id: string;
    payment_method_id: string;
    screenshot_id: number;
    resubmit?: boolean;
}
export declare class RejectSubscriptionDto {
    reason: string;
}
export declare class SubscriptionIdParam {
    subscription_id: string;
}
export declare class AdminSubscriptionListQuery {
    search?: string;
    status?: string;
    plan_id?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: number;
    limit?: number;
}
