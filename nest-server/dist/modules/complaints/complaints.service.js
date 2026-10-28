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
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PenaltyService } from '../driver/penalty.service.js';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEMP_DURATION_DAYS = { '1d': 1, '3d': 3, '7d': 7 };
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
        reporter_role: c.reporter?.role ?? null,
        accused_name: c.accused ? c.accused.fullName : null,
        accused_role: c.accused?.role ?? null,
        booking_id: c.bookingId,
        trip_id: c.booking ? c.booking.tripId : null,
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
    penalties;
    constructor(prisma, penalties) {
        this.prisma = prisma;
        this.penalties = penalties;
    }
    async create(reporterId, data) {
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
        if (filters.search) {
            const term = filters.search;
            const searchOr = UUID_RE.test(term)
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
        const bookingIds = [...new Set(rows.map((r) => r.bookingId).filter((v) => v != null))];
        const tripByBooking = new Map();
        if (bookingIds.length > 0) {
            const bookings = await this.prisma.booking.findMany({
                where: { id: { in: bookingIds } },
                select: { id: true, tripId: true },
            });
            for (const b of bookings)
                tripByBooking.set(b.id, b.tripId);
        }
        return {
            data: rows.map((c) => serializeAdmin({
                ...c,
                booking: c.bookingId ? { tripId: tripByBooking.get(c.bookingId) ?? '' } : null,
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getStats() {
        const [total, open, reviewing, resolved, dismissed] = await Promise.all([
            this.prisma.complaint.count(),
            this.prisma.complaint.count({ where: { status: 'open' } }),
            this.prisma.complaint.count({ where: { status: 'reviewing' } }),
            this.prisma.complaint.count({ where: { status: 'resolved' } }),
            this.prisma.complaint.count({ where: { status: 'dismissed' } }),
        ]);
        return { total_complaints: total, open, reviewing, resolved, dismissed };
    }
    async getDetail(complaintId) {
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
        const [booking, penalty, reviewer] = await Promise.all([
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
            this.prisma.penalty.findFirst({
                where: { complaintId },
                orderBy: { startsAt: 'desc' },
            }),
            complaint.resolvedBy
                ? this.prisma.user.findUnique({
                    where: { id: complaint.resolvedBy },
                    select: { id: true, fullName: true },
                })
                : null,
        ]);
        const penaltyIssuer = penalty?.issuedBy
            ? await this.prisma.user.findUnique({
                where: { id: penalty.issuedBy },
                select: { id: true, fullName: true },
            })
            : null;
        const log = [{ event: 'filed', at: complaint.createdAt }];
        if (complaint.resolvedAt) {
            if (complaint.status === 'reviewing' || complaint.updatedAt < complaint.resolvedAt) {
                log.push({ event: 'reviewing', at: complaint.updatedAt });
            }
            log.push({ event: 'decided', at: complaint.resolvedAt, status: complaint.status });
        }
        else if (complaint.status === 'reviewing') {
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
            review_result: complaint.resolvedAt != null
                ? {
                    reviewed_by: reviewer,
                    ended_at: complaint.resolvedAt,
                    action: penalty
                        ? {
                            id: penalty.id,
                            type: penalty.type,
                            reason: penalty.reason,
                            executed_by: penaltyIssuer,
                            executed_at: penalty.startsAt,
                            ends_at: penalty.endsAt,
                            active: !penalty.endsAt || new Date(penalty.endsAt) > new Date(),
                        }
                        : null,
                }
                : null,
            log,
        };
    }
    async penalize(adminId, complaintId, dto) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint) {
            throw new NotFoundException({ message: 'COMPLAINT_NOT_FOUND', code: 'COMPLAINT_NOT_FOUND' });
        }
        if (dto.kind === 'temporary') {
            const days = dto.duration === 'custom' ? dto.durationDays : dto.duration != null ? TEMP_DURATION_DAYS[dto.duration] : undefined;
            if (!days) {
                throw validationError('durationDays', 'DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
            }
            return this.penalties.issue(adminId, {
                user_id: complaint.accusedId,
                type: 'suspension',
                reason: dto.reason,
                details: dto.notes ?? `Temporary suspension for ${days} day(s)`,
                complaint_id: complaintId,
                ends_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
            });
        }
        if (dto.kind === 'permanent') {
            if (dto.confirmReviewedLog !== true) {
                throw validationError('confirmReviewedLog', 'CONFIRM_REVIEWED_LOG_REQUIRED');
            }
            return this.penalties.issue(adminId, {
                user_id: complaint.accusedId,
                type: 'ban',
                reason: dto.reason,
                details: dto.notes ?? null,
                complaint_id: complaintId,
                confirm_reviewed_log: true,
            });
        }
        return this.penalties.issue(adminId, {
            user_id: complaint.accusedId,
            type: 'warning',
            reason: dto.reason,
            details: dto.notes ?? null,
            complaint_id: complaintId,
        });
    }
    async resolve(adminId, complaintId, data) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint) {
            throw new NotFoundException({ message: 'COMPLAINT_NOT_FOUND', code: 'COMPLAINT_NOT_FOUND' });
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
    __metadata("design:paramtypes", [PrismaService,
        PenaltyService])
], ComplaintsService);
export { ComplaintsService };
//# sourceMappingURL=complaints.service.js.map