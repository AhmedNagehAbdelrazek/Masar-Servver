export declare class AdminUserListQuery {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class UserIdParam {
    user_id: string;
}
export declare class UpdateUserStatusDto {
    status: string;
    reason?: string;
}
export declare class ModerateTripDto {
    action: 'unpublish' | 'block' | 'restore';
    reason?: string;
}
export declare class IssuePenaltyDto {
    user_id: string;
    type: string;
    reason: string;
    complaint_id?: string;
    details?: string;
    ends_at?: string;
}
