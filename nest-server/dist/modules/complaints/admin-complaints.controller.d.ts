import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { AdminComplaintListQuery } from './dto/complaint-list.query.js';
import { ComplaintPenaltyDto } from './dto/complaint-penalty.dto.js';
import { ComplaintIdParam, ResolveComplaintDto } from './dto/resolve-complaint.dto.js';
export declare class AdminComplaintsController {
    private readonly complaints;
    constructor(complaints: ComplaintsService);
    getStats(): Promise<Record<string, unknown>>;
    listComplaints(query: AdminComplaintListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getDetail(params: ComplaintIdParam): Promise<Record<string, unknown>>;
    penalize(params: ComplaintIdParam, dto: ComplaintPenaltyDto, user?: AuthUser): Promise<{
        penalty: Record<string, unknown>;
    }>;
    resolveComplaint(params: ComplaintIdParam, dto: ResolveComplaintDto, user?: AuthUser): Promise<{
        complaint: Record<string, unknown>;
    }>;
}
