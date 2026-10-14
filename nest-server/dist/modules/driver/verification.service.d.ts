import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
type Tx = Prisma.TransactionClient;
export declare class VerificationService {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    recordStatusChange(driverId: string, fromStatus: string | null, toStatus: string, opts?: {
        reason?: string | null;
        markedFields?: string[] | null;
        changedBy?: string | null;
        tx?: Tx;
    }): Promise<unknown>;
    alertAdminsOfNewSubmission(driverId: string, fullName?: string | null): Promise<number>;
    private resolveImageUrls;
    private buildDocuments;
    getQueue(filters?: {
        status?: string;
        search?: string;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        requests: Record<string, unknown>[];
        meta: Record<string, unknown>;
    }>;
    private syncUserVerification;
    approveDriver(adminId: string, driverId: string): Promise<{
        driver_id: string;
        id_verified: boolean;
        notified: boolean;
    }>;
    rejectDriver(adminId: string, driverId: string, reason: string, fieldsToFix?: string[]): Promise<{
        driver_id: string;
        id_verified: boolean;
        reason: string;
        notified: boolean;
    }>;
    approveVehicle(adminId: string, vehicleId: string): Promise<{
        vehicle_id: string;
        is_verified: boolean;
        notified: boolean;
    }>;
    rejectVehicle(adminId: string, vehicleId: string, reason: string, fieldsToFix?: string[]): Promise<{
        vehicle_id: string;
        is_verified: boolean;
        reason: string;
        notified: boolean;
    }>;
}
export {};
