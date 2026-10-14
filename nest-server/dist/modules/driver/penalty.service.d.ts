import { PrismaService } from '../../prisma/prisma.service.js';
import { EnforcementService } from './enforcement.service.js';
export declare class PenaltyService {
    private readonly prisma;
    private readonly enforcement;
    private readonly logger;
    constructor(prisma: PrismaService, enforcement: EnforcementService);
    listForDriver(userId: string, filters?: {
        active?: string | boolean;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    issue(actorId: string, payload: {
        user_id: string;
        type: string;
        reason: string;
        details?: string | null;
        complaint_id?: string | null;
        ends_at?: string | null;
    }): Promise<{
        penalty: Record<string, unknown>;
    }>;
}
