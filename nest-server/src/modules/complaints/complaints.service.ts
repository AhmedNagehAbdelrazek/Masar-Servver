import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { daysAgo, percentChange } from '../../common/utils/stat-change.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PenaltyService } from '../driver/penalty.service.js';
import {
  AdminComplaintListQuery,
  DriverComplaintListQuery,
} from './dto/complaint-list.query.js';
import type { ComplaintPenaltyDto } from './dto/complaint-penalty.dto.js';
import type { CreateComplaintDto } from './dto/create-complaint.dto.js';
import type { ResolveComplaintDto } from './dto/resolve-complaint.dto.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMP_DURATION_DAYS: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7 };

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
  reporter?: { fullName: string | null; role?: string } | null;
  accused?: { fullName: string | null; role?: string } | null;
  booking?: { tripId: string } | null;
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
    reporter_role: c.reporter?.role ?? null,
    accused_name: c.accused ? c.accused.fullName : null,
    accused_role: c.accused?.role ?? null,
    booking_id: c.bookingId,
    trip_id: c.booking ? c.booking.tripId : null,
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

// Port of main-server/Services/complaintService.ts
@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly penalties: PenaltyService,
  ) {}

  private async recordComplaintEvent(
    complaintId: string,
    actorId: string | null,
    event: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tableName: 'complaints',
          recordId: complaintId,
          action: 'UPDATE',
          newData: { event, ...payload } as Prisma.InputJsonValue,
          performedBy: actorId,
        },
      });
    } catch (err) {
      this.logger.warn(`complaint event log failed: ${(err as Error).message}`);
    }
  }

  async create(
    reporterId: string,
    data: CreateComplaintDto,
  ): Promise<{ complaint: Record<string, unknown>; already_filed: boolean }> {
    if (data.accused_id === reporterId) {
      throw validationError('accused_id', 'You cannot file a complaint against yourself');
    }
    const accused = await this.prisma.user.findUnique({ where: { id: data.accused_id } });
    if (!accused) {
      throw new NotFoundException({ message: 'ACCUSED_USER_NOT_FOUND', code: 'ACCUSED_USER_NOT_FOUND' });
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

    // Driver no-show complaints are tied to a completed booking. The passenger
    // must be the booking passenger and must not have been confirmed as riding.
    if (data.booking_id && data.category === 'no_show') {
      const booking = await this.prisma.booking.findUnique({
        where: { id: data.booking_id },
        include: { trip: { select: { id: true, driverId: true, status: true } } },
      });
      if (!booking) {
        throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
      }
      if (booking.trip.driverId === reporterId) {
        if (booking.passengerId !== data.accused_id) {
          throw validationError('accused_id', 'Accused user must be the booking passenger');
        }
        if (booking.trip.status !== 'completed') {
          throw new ConflictException({
            message: 'TRIP_MUST_BE_COMPLETED_BEFORE_REPORTING_A_NO_SHOW',
            code: 'TRIP_NOT_COMPLETED',
          });
        }
        const notOnTrip = booking.driverConfirmedOnTrip === false || booking.status === 'no_show';
        if (!notOnTrip) {
          throw new ConflictException({
            message: 'PASSENGER_IS_NOT_MARKED_AS_NO_SHOW',
            code: 'PASSENGER_IS_NOT_MARKED_AS_NO_SHOW',
          });
        }
      }
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
    // UUID columns support equals only — contains applies to text columns.
    if (filters.search) {
      const term = filters.search;
      const searchOr: Prisma.ComplaintWhereInput[] = UUID_RE.test(term)
        ? [{ id: term }]
        : [
            { reporter: { fullName: { contains: term, mode: 'insensitive' } } },
            { accused: { fullName: { contains: term, mode: 'insensitive' } } },
          ];
      where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: searchOr }];
    }
    const [rows, count] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          reporter: { select: { fullName: true, role: true } },
          accused: { select: { fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);
    // Complaint has no booking relation (bookingId scalar only) — resolve
    // linked trip ids in one batched query for the table's الرحلة column.
    const bookingIds = [...new Set(rows.map((r) => r.bookingId).filter((v): v is string => v != null))];
    const tripByBooking = new Map<string, string>();
    if (bookingIds.length > 0) {
      const bookings = await this.prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: { id: true, tripId: true },
      });
      for (const b of bookings) tripByBooking.set(b.id, b.tripId);
    }
    return {
      data: rows.map((c) =>
        serializeAdmin({
          ...(c as unknown as ComplaintWithNames),
          booking: c.bookingId ? { tripId: tripByBooking.get(c.bookingId) ?? '' } : null,
        }),
      ),
      pagination: buildPagination(count, page, limit),
    };
  }

  // Figma 10678:13079 cards: إجمالي / مفتوحة / قيد المراجعة / تم حلها / مغلقة.
  async getStats(): Promise<Record<string, unknown>> {
    const [total, open, reviewing, resolved, dismissed] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.complaint.count({ where: { status: 'open' } }),
      this.prisma.complaint.count({ where: { status: 'reviewing' } }),
      this.prisma.complaint.count({ where: { status: 'resolved' } }),
      this.prisma.complaint.count({ where: { status: 'dismissed' } }),
    ]);
    const totalBefore = await this.prisma.complaint.count({
      where: { createdAt: { lte: daysAgo(7) } },
    });
    return {
      total_complaints: total,
      open,
      reviewing,
      resolved,
      dismissed,
      changes: {
        total_complaints: percentChange(total, totalBefore),
      },
    };
  }

  // Figma 10681:11590 + resolved variants (10698:23006, 10699:24545/25044):
  // status chips, linked trip card, complaint + evidence, reporter/accused
  // cards, penalty availability, سجل الشكوى + نتيجة المراجعة when resolved.
  async getDetail(complaintId: string): Promise<Record<string, unknown>> {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        reporter: {
          select: { id: true, fullName: true, role: true, phone: true, createdAt: true },
        },
        accused: {
          select: {
            id: true,
            fullName: true,
            role: true,
            phone: true,
            status: true,
            avgRating: true,
            createdAt: true,
            _count: { select: { ratingsReceived: true } },
          },
        },
      },
    });
    if (!complaint) {
      throw new NotFoundException({ message: 'COMPLAINT_NOT_FOUND', code: 'COMPLAINT_NOT_FOUND' });
    }
    const [booking, penalties, auditLogs, reviewer] = await Promise.all([
      complaint.bookingId
        ? this.prisma.booking.findUnique({
          where: { id: complaint.bookingId },
          include: {
            trip: {
              select: {
                id: true,
                originCity: true,
                destinationCity: true,
                departureTime: true,
                totalSeats: true,
                availableSeats: true,
                farePerSeat: true,
                status: true,
              },
            },
          },
        })
        : null,
      this.prisma.penalty.findMany({
        where: { complaintId },
        orderBy: { startsAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        where: { tableName: 'complaints', recordId: complaintId },
        orderBy: { createdAt: 'asc' },
      }),
      complaint.resolvedBy
        ? this.prisma.user.findUnique({
          where: { id: complaint.resolvedBy },
          select: { id: true, fullName: true },
        })
        : null,
    ]);
    const penalty = penalties[0] ?? null;
    const actorIds = [...new Set([
      ...penalties.map((row) => row.issuedBy).filter((id): id is string => Boolean(id)),
      ...auditLogs.map((row) => row.performedBy).filter((id): id is string => Boolean(id)),
      complaint.resolvedBy,
    ].filter((id): id is string => Boolean(id)))];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, fullName: true },
      })
      : [];
    const actorById = new Map(actors.map((user) => [user.id, { id: user.id, name: user.fullName }]));

    const history: Record<string, unknown>[] = [
      {
        event: 'filed',
        at: complaint.createdAt,
        by: complaint.reporter
          ? { id: complaint.reporter.id, name: complaint.reporter.fullName }
          : null,
      },
      ...auditLogs.map((entry) => {
        const data = (entry.newData ?? {}) as Record<string, unknown>;
        return {
          event: String(data.event ?? 'updated'),
          at: entry.createdAt,
          by: entry.performedBy
            ? actorById.get(entry.performedBy) ?? { id: entry.performedBy, name: null }
            : null,
          reason: data.reason ?? null,
          action: data.action_type ?? null,
          penalty_id: data.penalty_id ?? null,
          note: data.note ?? null,
        };
      }),
      ...penalties.map((row) => ({
        event: 'penalty',
        at: row.startsAt,
        by: row.issuedBy
          ? actorById.get(row.issuedBy) ?? { id: row.issuedBy, name: null }
          : null,
        reason: row.reason,
        action: row.type,
        penalty_id: row.id,
        ends_at: row.endsAt,
      })),
    ].sort((a, b) => new Date(a.at as unknown as string).getTime() - new Date(b.at as unknown as string).getTime());
    const log: Record<string, unknown>[] = [{ event: 'filed', at: complaint.createdAt }];
    if (complaint.resolvedAt) {
      if (complaint.status === 'reviewing' || complaint.updatedAt < complaint.resolvedAt) {
        log.push({ event: 'reviewing', at: complaint.updatedAt });
      }
      log.push({ event: 'decided', at: complaint.resolvedAt, status: complaint.status });
    } else if (complaint.status === 'reviewing') {
      log.push({ event: 'reviewing', at: complaint.updatedAt });
    }
    return {
      complaint: {
        id: complaint.id,
        category: complaint.category,
        description: complaint.description,
        evidence_urls: complaint.evidenceUrls,
        status: complaint.status,
        resolution: complaint.resolution,
        created_at: complaint.createdAt,
      },
      reporter: complaint.reporter
        ? { ...complaint.reporter, phone: maskPhone(complaint.reporter.phone) }
        : null,
      accused: complaint.accused
        ? {
          ...complaint.accused,
          phone: maskPhone(complaint.accused.phone),
          avg_rating: Number(complaint.accused.avgRating) || 0,
          ratings_count: complaint.accused._count.ratingsReceived,
        }
        : null,
      trip: booking?.trip
        ? {
          id: booking.trip.id,
          route: `${booking.trip.originCity} ← ${booking.trip.destinationCity}`,
          departure_time: booking.trip.departureTime,
          seats_booked: booking.seatsBooked,
          total_seats: Number(booking.trip.totalSeats),
          available_seats: Number(booking.trip.availableSeats),
          seat_price: Number(booking.trip.farePerSeat),
          status: booking.trip.status,
          booking_id: booking.id,
        }
        : null,
      penalty_action: complaint.accused
        ? { accused_id: complaint.accused.id, accused_status: complaint.accused.status }
        : null,
      review_result:
        complaint.resolvedAt != null
          ? {
            reviewed_by: reviewer,
            ended_at: complaint.resolvedAt,
            action: penalty
              ? {
                id: penalty.id,
                type: penalty.type,
                reason: penalty.reason,
                executed_by: penalty.issuedBy
                  ? actorById.get(penalty.issuedBy) ?? { id: penalty.issuedBy, name: null }
                  : null,
                executed_at: penalty.startsAt,
                ends_at: penalty.endsAt,
                active: !penalty.endsAt || new Date(penalty.endsAt) > new Date(),
              }
              : null,
          }
          : null,
      history,
      log,
    };
  }

  // Figma 10681:19490 (إجراءات العقوبة): optional action against the accused,
  // linked to the complaint. Modal shapes mirror the passenger patch
  // (10683:11753/11689/11615). Resolution itself stays on PUT resolve.
  async penalize(
    adminId: string,
    complaintId: string,
    dto: ComplaintPenaltyDto,
  ): Promise<Record<string, unknown>> {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException({ message: 'COMPLAINT_NOT_FOUND', code: 'COMPLAINT_NOT_FOUND' });
    }
    let result: { penalty: Record<string, unknown> };
    if (dto.kind === 'temporary') {
      const days = dto.duration === 'custom' ? dto.durationDays : dto.duration != null ? TEMP_DURATION_DAYS[dto.duration] : undefined;
      if (!days) {
        throw validationError('durationDays', 'DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
      }
      result = await this.penalties.issue(adminId, {
        user_id: complaint.accusedId,
        type: 'suspension',
        reason: dto.reason,
        details: dto.notes ?? `Temporary suspension for ${days} day(s)`,
        complaint_id: complaintId,
        ends_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
      });
    } else if (dto.kind === 'permanent') {
      if (dto.confirmReviewedLog !== true) {
        throw validationError('confirmReviewedLog', 'CONFIRM_REVIEWED_LOG_REQUIRED');
      }
      result = await this.penalties.issue(adminId, {
        user_id: complaint.accusedId,
        type: 'ban',
        reason: dto.reason,
        details: dto.notes ?? null,
        complaint_id: complaintId,
        confirm_reviewed_log: true,
      });
    } else {
      result = await this.penalties.issue(adminId, {
        user_id: complaint.accusedId,
        type: 'warning',
        reason: dto.reason,
        details: dto.notes ?? null,
        complaint_id: complaintId,
      });
    }

    // Every enforcement action is also the ticket decision.
    const actionLabel = dto.kind === 'warning' ? 'إنذار' : dto.kind === 'temporary' ? 'إيقاف مؤقت' : 'إيقاف نهائي';
    const resolvedAt = new Date();
    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'resolved',
        resolution: `${actionLabel}: ${dto.reason}`,
        resolvedBy: adminId,
        resolvedAt,
      },
    });
    await this.recordComplaintEvent(complaintId, adminId, 'resolved', {
      reason: dto.reason,
      action_type: result.penalty?.type ?? dto.kind,
      penalty_id: result.penalty?.id ?? null,
      note: dto.notes ?? null,
    });

    return {
      ...result,
      complaint: {
        id: updated.id,
        status: updated.status,
        resolution: updated.resolution,
        resolved_by: updated.resolvedBy,
        resolved_at: updated.resolvedAt,
      },
    };
  }

  async resolve(
    adminId: string,
    complaintId: string,
    data: ResolveComplaintDto,
  ): Promise<{ complaint: Record<string, unknown> }> {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException({ message: 'COMPLAINT_NOT_FOUND', code: 'COMPLAINT_NOT_FOUND' });
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
    if (data.status === 'resolved' || data.status === 'dismissed') {
      await this.recordComplaintEvent(
        complaintId,
        adminId,
        data.status === 'dismissed' ? 'dismissed' : 'resolved',
        { reason: fields.resolution ?? data.resolution ?? null },
      );
    } else if (data.status === 'reviewing') {
      await this.recordComplaintEvent(complaintId, adminId, 'reviewing', {
        reason: data.resolution ?? null,
      });
    }
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

  async reopen(
    adminId: string,
    complaintId: string,
    reason?: string | null,
  ): Promise<{ complaint: Record<string, unknown> }> {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException({ message: 'COMPLAINT_NOT_FOUND', code: 'COMPLAINT_NOT_FOUND' });
    }
    if (!['resolved', 'dismissed'].includes(complaint.status)) {
      throw new ConflictException({
        message: 'COMPLAINT_IS_NOT_RESOLVED',
        code: 'COMPLAINT_IS_NOT_RESOLVED',
      });
    }
    const previousStatus = complaint.status;
    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'reviewing',
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
      },
    });
    await this.recordComplaintEvent(complaintId, adminId, 'reopened', {
      reason: reason || 'Reopened by administrator',
      previous_status: previousStatus,
    });
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
