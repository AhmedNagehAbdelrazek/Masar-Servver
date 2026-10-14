import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PenaltyService } from '../driver/penalty.service.js';
import type {
  PassengerBookingsQuery,
  PassengerComplaintsQuery,
  PassengerListQuery,
  PassengerRatingsQuery,
  PassengerRideRequestsQuery,
  PermanentSuspensionDto,
  SendPassengerNotificationDto,
  SendPassengerWarningDto,
  TemporarySuspensionDto,
} from './dto/admin-passengers.dto.js';

// Admin passenger surface for the dashboard cards + passenger dossier modals.
// Figma: 10062:4551 (الركاب), 10063:18152 (نظرة عامة), 10064:20466 (حالة الحساب),
// 10064:22193 (الحجوزات), 10064:23604 (طلبات الرحلات), 10069:27574/28429 (الشكاوى),
// 10069:30620 (التقييمات), 10063:18885/19165/18592/19348 (modals). Header/sidebar ignored.
// Mutations reuse PenaltyService.issue so status transitions, ends_at rules and
// enforcement revocation stay canonical. Audit is covered by the global AuditInterceptor.

const PASSENGER_ROLE = 'passenger' as const;

const ACTIVE_BUCKET: Prisma.UserWhereInput = {
  role: PASSENGER_ROLE,
  status: { in: ['active', 'warned'] },
};
const SUSPENDED_BUCKET: Prisma.UserWhereInput = { role: PASSENGER_ROLE, status: 'suspended' };
const BANNED_BUCKET: Prisma.UserWhereInput = { role: PASSENGER_ROLE, status: 'banned' };
const VIOLATIONS_BUCKET: Prisma.UserWhereInput = {
  role: PASSENGER_ROLE,
  OR: [{ strikes: { gt: 0 } }, { penalties: { some: {} } }],
};

function validationError(field: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [{ field, message }],
  });
}

// registeredAt/date chips: اليوم / هذا الأسبوع / هذا الشهر / هذا العام / أي وقت.
function dateGte(filter: string | undefined): Date | null {
  if (!filter || filter === 'any') return null;
  const now = new Date();
  switch (filter) {
    case 'today': {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 3600 * 1000);
    default:
      return null;
  }
}

function bookingStatusWhere(status: string): Prisma.BookingWhereInput['status'] {
  switch (status) {
    case 'in_progress':
      return 'confirmed';
    case 'upcoming':
      return 'pending';
    case 'canceled':
      return 'cancelled';
    default:
      return status as 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  }
}

const DURATION_DAYS: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7 };

@Injectable()
export class AdminPassengersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly penalties: PenaltyService,
  ) {}

  private async getPassengerOrThrow(passengerId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: passengerId } });
    if (!user || user.role !== PASSENGER_ROLE) {
      throw new NotFoundException({ message: 'PASSENGER_NOT_FOUND', code: 'PASSENGER_NOT_FOUND' });
    }
    return user;
  }

  private baseWhere(query: PassengerListQuery): Prisma.UserWhereInput {
    let where: Prisma.UserWhereInput;
    switch (query.accountStatus) {
      case 'active':
        where = { ...ACTIVE_BUCKET };
        break;
      case 'suspended_temporary':
        where = { ...SUSPENDED_BUCKET };
        break;
      case 'suspended_permanent':
        where = { ...BANNED_BUCKET };
        break;
      case 'with_violations':
        where = { ...VIOLATIONS_BUCKET };
        break;
      default:
        where = { role: PASSENGER_ROLE };
    }
    if (query.search) {
      const term = query.search;
      where = {
        ...where,
        OR: [
          { fullName: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term, mode: 'insensitive' } },
        ],
      };
    }
    const gte = dateGte(query.registeredAt);
    if (gte) where = { ...where, createdAt: { gte } };
    return where;
  }

  async getStats(): Promise<Record<string, unknown>> {
    const [total, active, suspendedTemporary, suspendedPermanent, withViolations] = await Promise.all([
      this.prisma.user.count({ where: { role: PASSENGER_ROLE } }),
      this.prisma.user.count({ where: ACTIVE_BUCKET }),
      this.prisma.user.count({ where: SUSPENDED_BUCKET }),
      this.prisma.user.count({ where: BANNED_BUCKET }),
      this.prisma.user.count({ where: VIOLATIONS_BUCKET }),
    ]);
    return {
      total_passengers: total,
      active: active,
      suspended_temporary: suspendedTemporary,
      suspended_permanent: suspendedPermanent,
      with_violations: withViolations,
    };
  }

  async listPassengers(
    query: PassengerListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(query);
    const where = this.baseWhere(query);
    const [rows, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: true,
          avgRating: true,
          createdAt: true,
          _count: { select: { bookings: true, complaintsAccused: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    const passengerIds = rows.map((r) => r.id);
    const [completed, cancelled] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['passengerId'],
        where: { passengerId: { in: passengerIds }, status: 'completed' },
        _count: { id: true },
      }),
      this.prisma.booking.groupBy({
        by: ['passengerId'],
        where: { passengerId: { in: passengerIds }, status: 'cancelled' },
        _count: { id: true },
      }),
    ]);
    const completedBy = new Map(completed.map((r) => [r.passengerId, r._count.id]));
    const cancelledBy = new Map(cancelled.map((r) => [r.passengerId, r._count.id]));
    return {
      data: rows.map((u) => ({
        id: u.id,
        full_name: u.fullName,
        phone: maskPhone(u.phone),
        account_status: u.status,
        avg_rating: Number(u.avgRating) || 0,
        completed_bookings: completedBy.get(u.id) ?? 0,
        cancelled_bookings: cancelledBy.get(u.id) ?? 0,
        complaints_against: u._count.complaintsAccused,
        total_bookings: u._count.bookings,
        created_at: u.createdAt,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async exportPassengers(query: PassengerListQuery = {}): Promise<string> {
    const where = this.baseWhere(query);
    const rows = await this.prisma.user.findMany({
      where,
      select: { id: true, fullName: true, phone: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    const esc = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['id,full_name,phone,account_status,created_at'];
    for (const u of rows) {
      lines.push(
        [u.id, esc(u.fullName), esc(maskPhone(u.phone)), u.status, u.createdAt.toISOString()].join(','),
      );
    }
    return lines.join('\n');
  }

  async getOverview(passengerId: string): Promise<Record<string, unknown>> {
    const user = await this.getPassengerOrThrow(passengerId);
    const [totalBookings, completedBookings, cancelledBookings, lastBooking, ratingAgg, ratingsCount] =
      await Promise.all([
        this.prisma.booking.count({ where: { passengerId } }),
        this.prisma.booking.count({ where: { passengerId, status: 'completed' } }),
        this.prisma.booking.count({ where: { passengerId, status: 'cancelled' } }),
        this.prisma.booking.findFirst({
          where: { passengerId },
          include: {
            trip: { select: { id: true, originCity: true, destinationCity: true, departureTime: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.rating.aggregate({ where: { raterId: passengerId }, _avg: { stars: true } }),
        this.prisma.rating.count({ where: { raterId: passengerId } }),
      ]);
    return {
      personal_info: {
        id: user.id,
        full_name: user.fullName,
        phone: maskPhone(user.phone),
        age: user.age != null ? Number(user.age) : null,
        gender: user.gender,
        city: null,
        account_status: user.status,
        registration_date: user.createdAt,
        last_login: user.lastLoginAt,
      },
      booking_stats: {
        total_bookings: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      last_booking: lastBooking
        ? {
            id: lastBooking.id,
            status: lastBooking.status,
            seats_booked: lastBooking.seatsBooked,
            price: Number(lastBooking.agreedFare),
            trip: lastBooking.trip,
          }
        : null,
      ratings_summary: {
        given_count: ratingsCount,
        given_avg: ratingAgg._avg.stars != null ? Number(ratingAgg._avg.stars) : 0,
      },
    };
  }

  async getAccountLog(passengerId: string): Promise<Record<string, unknown>> {
    await this.getPassengerOrThrow(passengerId);
    const [penalties, complaints] = await Promise.all([
      this.prisma.penalty.findMany({ where: { userId: passengerId }, orderBy: { startsAt: 'desc' } }),
      this.prisma.complaint.findMany({
        where: { OR: [{ reporterId: passengerId }, { accusedId: passengerId }] },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const log: Record<string, unknown>[] = [
      ...penalties.map((p) => ({
        title: p.penaltyType || p.type,
        reason: p.reason,
        related_trip_id: p.tripId ?? null,
        date: p.startsAt,
        type: p.type,
        status: !p.endsAt ? 'active' : new Date(p.endsAt) > new Date() ? 'active' : 'resolved',
      })),
      ...complaints.map((c) => ({
        title: c.category,
        reason: c.description,
        related_trip_id: null,
        date: c.createdAt,
        type: 'enquiry',
        status: ['open', 'reviewing'].includes(c.status) ? 'pending' : 'resolved',
        direction: c.reporterId === passengerId ? 'filed' : 'against',
      })),
    ].sort((a, b) => new Date(b.date as unknown as string).getTime() - new Date(a.date as unknown as string).getTime());
    return {
      summary: {
        penalties: penalties.length,
        warnings: penalties.filter((p) => p.type === 'warning').length,
        suspensions: penalties.filter((p) => p.type === 'suspension').length,
        bans: penalties.filter((p) => p.type === 'ban').length,
        complaints_against: complaints.filter((c) => c.accusedId === passengerId).length,
        complaints_filed: complaints.filter((c) => c.reporterId === passengerId).length,
      },
      log,
    };
  }

  async listBookings(
    passengerId: string,
    query: PassengerBookingsQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    const { page, limit, offset } = parsePagination(query);
    const where: Prisma.BookingWhereInput = { passengerId };
    if (query.status && query.status !== 'all') where.status = bookingStatusWhere(query.status);
    const gte = dateGte(query.date);
    if (gte) where.createdAt = { gte };
    const [rows, count] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          trip: {
            select: {
              id: true,
              originCity: true,
              destinationCity: true,
              departureTime: true,
              driver: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return {
      data: rows.map((b) => ({
        id: b.id,
        reference_code: b.referenceCode,
        date_time: b.createdAt,
        seats: b.seatsBooked,
        seat_price: Number(b.agreedFare),
        status: b.status,
        trip: b.trip,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async listTripRequests(
    passengerId: string,
    query: PassengerRideRequestsQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    const { page, limit, offset } = parsePagination(query);
    const where: Prisma.RideRequestWhereInput = { passengerId };
    if (query.status && query.status !== 'all') {
      const s = query.status === 'upcoming' ? 'open' : query.status === 'canceled' ? 'cancelled' : query.status;
      where.status = s as 'open' | 'offered' | 'accepted' | 'expired' | 'cancelled';
    }
    const gte = dateGte(query.date);
    if (gte) where.createdAt = { gte };
    const [rows, count] = await Promise.all([
      this.prisma.rideRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.rideRequest.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        id: r.id,
        origin_city: r.originCity,
        destination_city: r.destinationCity,
        seats_needed: r.seatsNeeded,
        status: r.status,
        created_at: r.createdAt,
        expires_at: r.expiresAt,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async listComplaints(
    passengerId: string,
    query: PassengerComplaintsQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    const { page, limit, offset } = parsePagination(query);
    const direction = query.direction;
    const where: Prisma.ComplaintWhereInput = direction === 'filed'
      ? { reporterId: passengerId }
      : direction === 'against'
        ? { accusedId: passengerId }
        : { OR: [{ reporterId: passengerId }, { accusedId: passengerId }] };
    const [rows, count] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          reporter: { select: { id: true, fullName: true } },
          accused: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return {
      data: rows.map((c) => ({
        id: c.id,
        complaint_no: c.id,
        direction: c.reporterId === passengerId ? 'filed' : 'against',
        other_party: c.reporterId === passengerId ? c.accused : c.reporter,
        reason: c.category,
        description: c.description,
        status: c.status,
        created_at: c.createdAt,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async listRatings(
    passengerId: string,
    query: PassengerRatingsQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    const { page, limit, offset } = parsePagination(query);
    const direction = query.direction ?? 'given';
    const where: Prisma.RatingWhereInput = direction === 'given'
      ? { raterId: passengerId }
      : { rateeId: passengerId };
    const [rows, count] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        include: {
          rater: { select: { id: true, fullName: true } },
          ratee: { select: { id: true, fullName: true } },
          booking: {
            select: {
              id: true,
              trip: { select: { id: true, originCity: true, destinationCity: true, driverId: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.rating.count({ where }),
    ]);
    return {
      data: rows.map((r) => ({
        id: r.id,
        direction,
        stars: r.stars,
        review: r.review,
        tags: r.tags,
        rater: r.rater,
        ratee: r.ratee,
        booking_id: r.bookingId,
        trip: r.booking?.trip ?? null,
        created_at: r.createdAt,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async sendNotification(
    adminId: string,
    passengerId: string,
    dto: SendPassengerNotificationDto,
  ): Promise<{ notification: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    const notification = await this.prisma.notification.create({
      data: {
        userId: passengerId,
        type: 'ADMIN_NOTICE',
        title: dto.title,
        body: dto.body,
        data: { category: dto.type, sent_by: adminId },
        sentVia: ['in_app'],
      },
    });
    return {
      notification: {
        id: notification.id,
        user_id: notification.userId,
        title: notification.title,
        category: dto.type,
        created_at: notification.createdAt,
      },
    };
  }

  async sendWarning(
    adminId: string,
    passengerId: string,
    dto: SendPassengerWarningDto,
  ): Promise<{ penalty: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    return this.penalties.issue(adminId, {
      user_id: passengerId,
      type: 'warning',
      reason: dto.reason,
      details: dto.notes ?? null,
    });
  }

  async suspendTemporary(
    adminId: string,
    passengerId: string,
    dto: TemporarySuspensionDto,
  ): Promise<{ penalty: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    const days = dto.duration === 'custom' ? dto.durationDays : DURATION_DAYS[dto.duration];
    if (!days) throw validationError('durationDays', 'DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
    const endsAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    return this.penalties.issue(adminId, {
      user_id: passengerId,
      type: 'suspension',
      reason: dto.reason,
      details: dto.notes ?? `Temporary suspension for ${days} day(s)`,
      ends_at: endsAt,
    });
  }

  async suspendPermanent(
    adminId: string,
    passengerId: string,
    dto: PermanentSuspensionDto,
  ): Promise<{ penalty: Record<string, unknown> }> {
    await this.getPassengerOrThrow(passengerId);
    if (dto.confirmReviewedLog !== true) {
      throw validationError('confirmReviewedLog', 'CONFIRM_REVIEWED_LOG_REQUIRED');
    }
    return this.penalties.issue(adminId, {
      user_id: passengerId,
      type: 'ban',
      reason: dto.reason,
      details: dto.notes ?? null,
      confirm_reviewed_log: true,
    });
  }
}
