import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { EarningsQuery, PenaltyListQuery } from './dto/driver-query.dto.js';
import { UpdatePersonalDataDto } from './dto/personal-data.dto.js';
import { DriverService } from './driver.service.js';
export declare class DriverController {
    private readonly driver;
    constructor(driver: DriverService);
    getProfile(user?: AuthUser): Promise<{
        profile: Record<string, unknown>;
    }>;
    getFullProfile(user?: AuthUser): Promise<Record<string, unknown>>;
    getPersonalData(user?: AuthUser): Promise<{
        personal_data: Record<string, unknown>;
        vehicle: Record<string, unknown> | null;
        editable_now: string[];
        locked_fields: string[];
        rejected_fields: string[];
    }>;
    updatePersonalData(dto: UpdatePersonalDataDto, user?: AuthUser): Promise<Record<string, unknown>>;
    getAccountStatus(user?: AuthUser): Promise<Record<string, unknown>>;
    requestDeleteAccount(body: {
        reason?: string;
        confirmation?: boolean;
    }, user?: AuthUser): Promise<{
        request_id: string;
        status: string;
        estimated_completion: Date;
    }>;
    cancelDeleteAccount(user?: AuthUser): Promise<{
        request_id: string;
        status: string;
    }>;
    getPenalties(query: PenaltyListQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getEarnings(query: EarningsQuery, user?: AuthUser): Promise<{
        period: string;
        currency: string;
        total: number;
        breakdown: {
            bucket: string;
            earnings: number;
            trips: number;
        }[];
    }>;
    getHome(user?: AuthUser): Promise<Record<string, unknown>>;
    getSubscription(user?: AuthUser): Promise<Record<string, unknown>>;
    getStats(user?: AuthUser): Promise<{
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
}
