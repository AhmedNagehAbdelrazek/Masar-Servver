import { PrismaService } from '../../prisma/prisma.service.js';
export declare const EDITABLE_ANYTIME: string[];
export declare const LOCKED_WHEN_VERIFIED: string[];
export interface PersonalDataPayload {
    full_name?: string;
    display_name?: string | null;
    email?: string | null;
    phone?: string;
    age?: number | null;
    avatar_url?: string | null;
    national_id?: string;
    vehicle?: {
        manufacturer?: string;
        model?: string;
        model_year?: number;
        color?: string;
        plate_number?: string;
        total_seats?: number;
    };
}
export declare class PersonalDataService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    buildPersonalDataView(userId: string): Promise<{
        personal_data: Record<string, unknown>;
        vehicle: Record<string, unknown> | null;
        editable_now: string[];
        locked_fields: string[];
        rejected_fields: string[];
    }>;
    private assertUniqueness;
    updatePersonalData(userId: string, payload: PersonalDataPayload): Promise<Record<string, unknown>>;
    private extractLockedAttempts;
    private statusOf;
}
