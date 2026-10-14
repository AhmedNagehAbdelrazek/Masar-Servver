import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { AdminComplaintListQuery } from './dto/complaint-list.query.js';
import { ComplaintIdParam, ResolveComplaintDto } from './dto/resolve-complaint.dto.js';
export declare class AdminComplaintsController {
    private readonly complaints;
    constructor(complaints: ComplaintsService);
    listComplaints(query: AdminComplaintListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    resolveComplaint(params: ComplaintIdParam, dto: ResolveComplaintDto, user?: AuthUser): Promise<{
        complaint: Record<string, unknown>;
    }>;
}
