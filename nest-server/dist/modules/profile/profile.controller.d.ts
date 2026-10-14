import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { HomeService } from '../subscriptions/home.service.js';
import { UpdatePassengerProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';
export declare class ProfileController {
    private readonly profile;
    private readonly home;
    constructor(profile: ProfileService, home: HomeService);
    getMyProfile(user?: AuthUser): Promise<{
        passenger_profile: {
            full_name: string | null;
            age: number | null;
            gender: string | null;
            phone: string | null;
            national_id: string | null;
            home_address: string | null;
        };
    }>;
    updateMyProfile(dto: UpdatePassengerProfileDto, user?: AuthUser): Promise<{
        passenger_profile: Record<string, unknown>;
    }>;
    getAccountSummary(user?: AuthUser): Promise<{
        account_summary: {
            type: string;
            count: number;
        }[];
    }>;
    getPassengerHome(user?: AuthUser): Promise<Record<string, unknown>>;
}
