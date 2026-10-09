import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  AdminComplaintListQuery,
  DriverComplaintListQuery,
} from './dto/complaint-list.query.js';
import type { CreateComplaintDto } from './dto/create-complaint.dto.js';
import type { ResolveComplaintDto } from './dto/resolve-complaint.dto.js';

interface ComplaintWithNames {
  id: string;
  bookingId: string | null;
  reporterId: string;
  accusedId: string;
  category: string;
  description: string;
  evidenceUrls: string[];
  status: string;
  createdAt: Date;
  reporter?: { fullName: string | null } | null;
  accused?: { fullName: string | null } | null;
}

function serializeCreate(c: {
  id: string;
  accusedId: string;
  category: string;
  status: string;
  createdAt: Date;
}): Record<string, unknown> {
  return {
    id: c.id,
    accused_id: c.accusedId,
    category: c.category,
    status: c.status,
    created_at: c.createdAt,
  };
}

function serializeAdmin(c: ComplaintWithNames): Record<string, unknown> {
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

function serializeDriver(c: ComplaintWithNames, direction: string): Record<string, unknown> {
  return {
    id: c.id,
    category: c.category,
    description: c.description,
    status: c.status,
    direction,
    other_party:
      direction === 'filed'
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

function validationError(field: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [{ field, message }],
  });
}

// Port of Main Server/Services/complaintService.ts
@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    reporterId: string,
    data: CreateComplaintDto,
  ): Promise<{ complaint: Record<string, unknown>; already_filed: boolean }> {
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
        complaint: serializeCreate(existing as unknown as Parameters<typeof serializeCreate>[0]),
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
      complaint: serializeCreate(complaint as unknown as Parameters<typeof serializeCreate>[0]),
      already_filed: false,
    };
  }

  async listForDriver(
    userId: string,
    filters: DriverComplaintListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(filters);
    let where: Prisma.ComplaintWhereInput;
    if (filters.direction === 'filed') where = { reporterId: userId };
    else if (filters.direction === 'against') where = { accusedId: userId };
    else where = { OR: [{ reporterId: userId }, { accusedId: userId }] };
    if (filters.status) where = { ...where, status: filters.status };

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
        const dir = (c as unknown as ComplaintWithNames).reporterId === userId ? 'filed' : 'against';
        return serializeDriver(c as unknown as ComplaintWithNames, dir);
      }),
      pagination: buildPagination(count, page, limit),
    };
  }

  async listAdmin(
    filters: AdminComplaintListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(filters);
    const where: Prisma.ComplaintWhereInput = {
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
      data: rows.map((c) => serializeAdmin(c as unknown as ComplaintWithNames)),
      pagination: buildPagination(count, page, limit),
    };
  }

  async resolve(
    adminId: string,
    complaintId: string,
    data: ResolveComplaintDto,
  ): Promise<{ complaint: Record<string, unknown> }> {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException({ message: 'Complaint not found', code: 'COMPLAINT_NOT_FOUND' });
    }
    if (data.status === 'resolved' && !data.resolution) {
      throw validationError('resolution', 'Resolution is required when resolving a complaint');
    }
    const fields: Prisma.ComplaintUpdateInput = { status: data.status };
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
}
