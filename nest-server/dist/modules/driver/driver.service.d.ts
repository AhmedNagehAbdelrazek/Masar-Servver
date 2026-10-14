import { PrismaService } from '../../prisma/prisma.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { DashboardService } from './dashboard.service.js';
import { DeletionService } from './deletion.service.js';
import { DriverProfileService } from './driver-profile.service.js';
import { EarningsService } from './earnings.service.js';
import { PenaltyService } from './penalty.service.js';
import { PersonalDataService, type PersonalDataPayload } from './personal-data.service.js';
import { StatsService } from './stats.service.js';
export declare class DriverService {
    private readonly prisma;
    private readonly profiles;
    private readonly personalData;
    private readonly deletion;
    private readonly penalties;
    private readonly earnings;
    private readonly stats;
    private readonly dashboard;
    private readonly home;
    constructor(prisma: PrismaService, profiles: DriverProfileService, personalData: PersonalDataService, deletion: DeletionService, penalties: PenaltyService, earnings: EarningsService, stats: StatsService, dashboard: DashboardService, home: HomeService);
    private assertDriverEligible;
    getProfile(userId: string): Promise<{
        profile: Record<string, unknown>;
    }>;
    getFullProfile(driverId: string): Promise<Record<string, unknown>>;
    getPersonalData(userId: string): Promise<{
        personal_data: Record<string, unknown>;
        vehicle: Record<string, unknown> | null;
        editable_now: string[];
        locked_fields: string[];
        rejected_fields: string[];
    }>;
    updatePersonalData(userId: string, payload: PersonalDataPayload): Promise<Record<string, unknown>>;
    getAccountStatus(driverId: string): Promise<Record<string, unknown>>;
    requestDeleteAccount(userId: string, opts: {
        reason?: string | null;
        confirmation?: boolean;
    }): Promise<{
        request_id: string;
        status: string;
        estimated_completion: Date;
    }>;
    cancelDeleteAccount(userId: string): Promise<{
        request_id: string;
        status: string;
    }>;
    getPenalties(userId: string, filters: {
        active?: string | boolean;
        page?: unknown;
        limit?: unknown;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getEarnings(userId: string, filters: {
        period?: string;
        from?: string;
        to?: string;
    }): Promise<{
        period: string;
        currency: string;
        total: number;
        breakdown: {
            bucket: string;
            earnings: number;
            trips: number;
        }[];
    }>;
    getStats(userId: string): Promise<{
        stats: {
            total_trips: number;
            total_bookings: number;
            no_show_rate: number;
            response_rate: number;
            avg_rating: number;
            total_earnings: number;
            completed_trips: number;
            cancelled_trips: number;
        };
    }>;
    getDashboard(userId: string): Promise<Record<string, unknown>>;
    getHome(userId: string): Promise<Record<string, unknown>>;
    getSubscription(userId: string): Promise<Record<string, unknown>>;
}
