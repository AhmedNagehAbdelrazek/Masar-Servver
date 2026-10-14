import { PrismaService } from '../../prisma/prisma.service.js';
import { PenaltyService } from '../driver/penalty.service.js';
import { AdminComplaintListQuery, DriverComplaintListQuery } from './dto/complaint-list.query.js';
import type { ComplaintPenaltyDto } from './dto/complaint-penalty.dto.js';
import type { CreateComplaintDto } from './dto/create-complaint.dto.js';
import type { ResolveComplaintDto } from './dto/resolve-complaint.dto.js';
export declare class ComplaintsService {
    private readonly prisma;
    private readonly penalties;
    constructor(prisma: PrismaService, penalties: PenaltyService);
    create(reporterId: string, data: CreateComplaintDto): Promise<{
        complaint: Record<string, unknown>;
        already_filed: boolean;
    }>;
    listForDriver(userId: string, filters?: DriverComplaintListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    listAdmin(filters?: AdminComplaintListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    getStats(): Promise<Record<string, unknown>>;
    getDetail(complaintId: string): Promise<Record<string, unknown>>;
    penalize(adminId: string, complaintId: string, dto: ComplaintPenaltyDto): Promise<{
        penalty: Record<string, unknown>;
    }>;
    resolve(adminId: string, complaintId: string, data: ResolveComplaintDto): Promise<{
        complaint: Record<string, unknown>;
    }>;
}
