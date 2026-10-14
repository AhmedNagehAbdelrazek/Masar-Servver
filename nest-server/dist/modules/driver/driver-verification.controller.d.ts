import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { DriverVerificationService } from './driver-verification.service.js';
import { SubmitVerificationDto } from './dto/verification.dto.js';
export declare class DriverVerificationController {
    private readonly verification;
    constructor(verification: DriverVerificationService);
    getStatus(user?: AuthUser): Promise<{
        status: string;
        data: unknown;
    }>;
    getSubmission(user?: AuthUser): Promise<{
        status: string;
        data: unknown;
    }>;
    submit(dto: SubmitVerificationDto, user?: AuthUser): Promise<{
        status: string;
        data: unknown;
    }>;
}
