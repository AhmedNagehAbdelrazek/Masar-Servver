import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
export declare class DelayService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private loadBookingForUser;
    reportDelay(userId: string, bookingId: string, { party, delay_minutes, reason }: {
        party: string;
        delay_minutes: number;
        reason?: string | null;
    }): Promise<{
        delay_event: Record<string, unknown>;
    }>;
    listDelays(userId: string, bookingId: string, filters?: {
        party?: string;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
