import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export declare function addBusinessDays(from: Date, days: number): Date;
export declare class DeletionService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    hasPendingRequest(userId: string): Promise<boolean>;
    private alertAdmins;
    requestDeletion(userId: string, { reason, confirmation }?: {
        reason?: string | null | undefined;
        confirmation?: boolean | undefined;
    }): Promise<{
        request_id: string;
        status: string;
        estimated_completion: Date;
    }>;
    cancelDeletionRequest(userId: string): Promise<{
        request_id: string;
        status: string;
    }>;
}
