import { PrismaService } from '../../prisma/prisma.service.js';
import { VerificationService } from './verification.service.js';
export interface VerificationPackage {
    full_name?: string;
    national_id?: string;
    license_number?: string;
    license_expiry?: string;
    user_identification_front?: number;
    user_identification_back?: number;
    lincese_front?: number;
    lincese_back?: number;
    personal_image_with_id?: number;
    vehicle?: {
        manufacturer: string;
        model: string;
        vehicle_type: string;
        model_year?: number;
        plate_number: string;
        code_number?: string;
        color?: string;
        seats: number;
        registration_doc_front?: number;
        registration_doc_back?: number;
        vehicle_photo_front?: number;
        vehicle_photo_back?: number;
    };
}
export declare class DriverVerificationService {
    private readonly prisma;
    private readonly verification;
    constructor(prisma: PrismaService, verification: VerificationService);
    private loadDriverData;
    private buildDriverPayload;
    private buildVehiclePayload;
    getStatus(driverId: string): Promise<Record<string, unknown>>;
    getSubmission(driverId: string): Promise<Record<string, unknown>>;
    private verifyDocumentIds;
    submitOrResubmit(driverId: string, body: VerificationPackage): Promise<{
        status: string;
        submitted_at: Date;
    }>;
}
