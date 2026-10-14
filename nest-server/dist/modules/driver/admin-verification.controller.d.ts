import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { DriverIdParam, RejectVerificationDto, VehicleIdParam, VerificationQueueQuery } from './dto/verification.dto.js';
import { VerificationService } from './verification.service.js';
export declare class AdminVerificationController {
    private readonly verification;
    constructor(verification: VerificationService);
    getQueue(query: VerificationQueueQuery): Promise<{
        status: string;
        data: unknown;
    }>;
    approveDriver(params: DriverIdParam, user?: AuthUser): Promise<{
        driver_id: string;
        id_verified: boolean;
        notified: boolean;
    }>;
    rejectDriver(params: DriverIdParam, dto: RejectVerificationDto, user?: AuthUser): Promise<{
        driver_id: string;
        id_verified: boolean;
        reason: string;
        notified: boolean;
    }>;
    approveVehicle(params: VehicleIdParam, user?: AuthUser): Promise<{
        vehicle_id: string;
        is_verified: boolean;
        notified: boolean;
    }>;
    rejectVehicle(params: VehicleIdParam, dto: RejectVerificationDto, user?: AuthUser): Promise<{
        vehicle_id: string;
        is_verified: boolean;
        reason: string;
        notified: boolean;
    }>;
}
