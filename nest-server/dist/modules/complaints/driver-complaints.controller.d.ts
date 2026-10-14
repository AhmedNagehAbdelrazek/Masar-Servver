import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { DriverComplaintListQuery } from './dto/complaint-list.query.js';
export declare class DriverComplaintsController {
    private readonly complaints;
    constructor(complaints: ComplaintsService);
    getComplaints(query: DriverComplaintListQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
