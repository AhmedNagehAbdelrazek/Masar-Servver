import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminComplaintListQuery, DriverComplaintListQuery } from './dto/complaint-list.query.js';
import type { CreateComplaintDto } from './dto/create-complaint.dto.js';
import type { ResolveComplaintDto } from './dto/resolve-complaint.dto.js';
export declare class ComplaintsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    resolve(adminId: string, complaintId: string, data: ResolveComplaintDto): Promise<{
        complaint: Record<string, unknown>;
    }>;
}
