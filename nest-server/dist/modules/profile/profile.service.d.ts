import { PrismaService } from '../../prisma/prisma.service.js';
export declare class ProfileService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMyProfile(passengerId: string): Promise<{
        passenger_profile: {
            full_name: string | null;
            age: number | null;
            gender: string | null;
            phone: string | null;
            national_id: string | null;
            home_address: string | null;
        };
    }>;
    updateMyProfile(passengerId: string, payload: {
        preferred_gender?: string;
        smoking_preference?: string;
        saved_routes?: unknown;
        national_id?: string;
        home_address?: string;
        emergency_contacts?: unknown;
    }): Promise<{
        passenger_profile: Record<string, unknown>;
    }>;
    getAccountSummary(passengerId: string): Promise<{
        account_summary: {
            type: string;
            count: number;
        }[];
    }>;
}
