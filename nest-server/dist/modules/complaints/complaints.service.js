var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
function serializeCreate(c) {
    return {
        id: c.id,
        accused_id: c.accusedId,
        category: c.category,
        status: c.status,
        created_at: c.createdAt,
    };
}
function serializeAdmin(c) {
    return {
        id: c.id,
        category: c.category,
        description: c.description,
        status: c.status,
        reporter_name: c.reporter ? c.reporter.fullName : null,
        accused_name: c.accused ? c.accused.fullName : null,
        booking_id: c.bookingId,
        evidence_urls: c.evidenceUrls,
        created_at: c.createdAt,
    };
}
function serializeDriver(c, direction) {
    return {
        id: c.id,
        category: c.category,
        description: c.description,
        status: c.status,
        direction,
        other_party: direction === 'filed'
            ? c.accused
                ? c.accused.fullName
                : null
            : c.reporter
                ? c.reporter.fullName
                : null,
        evidence_urls: c.evidenceUrls,
        created_at: c.createdAt,
    };
}
function validationError(field, message) {
    return new UnprocessableEntityException({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ field, message }],
    });
}
let ComplaintsService = class ComplaintsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(reporterId, data) {
        if (data.accused_id === reporterId) {
            throw validationError('accused_id', 'You cannot file a complaint against yourself');
        }
        const accused = await this.prisma.user.findUnique({ where: { id: data.accused_id } });
        if (!accused) {
            throw new NotFoundException({ message: 'Accused user not found', code: 'ACCUSED_USER_NOT_FOUND' });
        }
        const existing = await this.prisma.complaint.findFirst({
            where: {
                reporterId,
                accusedId: data.accused_id,
                bookingId: data.booking_id ?? null,
                category: data.category,
                status: 'open',
            },
        });
        if (existing) {
            return {
                complaint: serializeCreate(existing),
                already_filed: true,
            };
        }
        const complaint = await this.prisma.complaint.create({
            data: {
                bookingId: data.booking_id ?? null,
                reporterId,
                accusedId: data.accused_id,
                category: data.category,
                description: data.description,
                evidenceUrls: data.evidence_urls ?? [],
                status: 'open',
            },
        });
        return {
            complaint: serializeCreate(complaint),
            already_filed: false,
        };
    }
    async listForDriver(userId, filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        let where;
        if (filters.direction === 'filed')
            where = { reporterId: userId };
        else if (filters.direction === 'against')
            where = { accusedId: userId };
        else
            where = { OR: [{ reporterId: userId }, { accusedId: userId }] };
        if (filters.status)
            where = { ...where, status: filters.status };
        const [rows, count] = await Promise.all([
            this.prisma.complaint.findMany({
                where,
                include: {
                    reporter: { select: { fullName: true } },
                    accused: { select: { fullName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.complaint.count({ where }),
        ]);
        return {
            data: rows.map((c) => {
                const dir = c.reporterId === userId ? 'filed' : 'against';
                return serializeDriver(c, dir);
            }),
            pagination: buildPagination(count, page, limit),
        };
    }
    async listAdmin(filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const where = {
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.category ? { category: filters.category } : {}),
        };
        const [rows, count] = await Promise.all([
            this.prisma.complaint.findMany({
                where,
                include: {
                    reporter: { select: { fullName: true } },
                    accused: { select: { fullName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.complaint.count({ where }),
        ]);
        return {
            data: rows.map((c) => serializeAdmin(c)),
            pagination: buildPagination(count, page, limit),
        };
    }
    async resolve(adminId, complaintId, data) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint) {
            throw new NotFoundException({ message: 'Complaint not found', code: 'COMPLAINT_NOT_FOUND' });
        }
        if (data.status === 'resolved' && !data.resolution) {
            throw validationError('resolution', 'Resolution is required when resolving a complaint');
        }
        const fields = { status: data.status };
        if (data.status === 'resolved') {
            fields.resolution = data.resolution;
            fields.resolvedBy = adminId;
            fields.resolvedAt = new Date();
        }
        if (data.status === 'dismissed') {
            fields.resolution = data.resolution ?? 'Complaint dismissed';
            fields.resolvedBy = adminId;
            fields.resolvedAt = new Date();
        }
        const updated = await this.prisma.complaint.update({ where: { id: complaintId }, data: fields });
        return {
            complaint: {
                id: updated.id,
                status: updated.status,
                resolution: updated.resolution,
                resolved_by: updated.resolvedBy,
                resolved_at: updated.resolvedAt,
            },
        };
    }
};
ComplaintsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ComplaintsService);
export { ComplaintsService };
//# sourceMappingURL=complaints.service.js.map