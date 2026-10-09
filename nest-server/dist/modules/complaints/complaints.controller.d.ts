import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { CreateComplaintDto } from './dto/create-complaint.dto.js';
export declare class ComplaintsController {
    private readonly complaints;
    constructor(complaints: ComplaintsService);
    createComplaint(dto: CreateComplaintDto, user?: AuthUser): Promise<{
        complaint: Record<string, unknown>;
        already_filed: boolean;
    }>;
}
