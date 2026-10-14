import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { AdminUserListQuery, UpdateUserStatusDto, UserIdParam } from './dto/admin-moderation.dto.js';
export declare class AdminUsersController {
    private readonly admin;
    constructor(admin: AdminModerationService);
    listUsers(query: AdminUserListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    updateUserStatus(params: UserIdParam, dto: UpdateUserStatusDto, user?: AuthUser): Promise<{
        user: Record<string, unknown>;
    }>;
}
