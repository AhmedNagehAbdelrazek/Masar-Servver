import { PrismaService } from '../../prisma/prisma.service.js';
import type { AdminUserListQuery, UpdateUserStatusDto } from './dto/admin-moderation.dto.js';
export declare class AdminModerationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listUsers(filters?: AdminUserListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    updateUserStatus(actorId: string, userId: string, dto: UpdateUserStatusDto): Promise<{
        user: Record<string, unknown>;
    }>;
}
