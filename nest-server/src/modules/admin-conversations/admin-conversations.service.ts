import {
  BadRequestException,
  ForbiddenException,
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
  AdminConversationListQuery,
  AdminThreadQuery,
  ConversationPenaltyDto,
} from './dto/admin-conversations.dto.js';

// Admin conversations surface (المحادثات).
// Figma: 10757:13462 (list + cards), 10781:13068 (trip-chat detail),
// 10785:17149 + 10791:31478/31414/31340 (penalty actions), 10791:30877
// (related actions), 10791:32955 (فتح محادثة — wired to the EXISTING
// support:{ticketId} socket room + ticket message REST, no new endpoints).
// Live chat stays on sockets (chat:join/send on booking:/support: rooms);
// admin is review-only in trip rooms (member = passenger|driver, same as
// ChatService), so the thread read here is REST-only by design. Audit is
// covered by the global AuditInterceptor.

const ACTIVE_WINDOW_MS = 7 * 24 * 3600 * 1000;
const TEMP_DURATION_DAYS: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validationError(field: string, message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: [{ field, message }],
  });
}

function dateGte(filter: string | undefined): Date | null {
  if (!filter || filter === 'any') return null;
  const now = Date.now();
  switch (filter) {
    case 'today': {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case 'week':
      return new Date(now - 7 * 24 * 3600 * 1000);
    case 'month':
      return new Date(now - 30 * 24 * 3600 * 1000);
    case 'year':
      return new Date(now - 365 * 24 * 3600 * 1000);
    default:
      return null;
  }
}

function serializeMessage(row: {
  id: string;
  senderId: string;
  message: string;
  messageType: string;
  bookingId: string | null;
  supportTicketId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  sender?: { fullName: string | null } | null;
}): Record<string, unknown> {
  return {
    id: row.id,
    sender_id: row.senderId,
    sender_name: row.sender ? row.sender.fullName : null,
    message: row.message,
    message_type: row.messageType,
    booking_id: row.bookingId,
    support_ticket_id: row.supportTicketId,
    is_read: row.isRead,
    read_at: row.readAt ? row.readAt.toISOString() : null,
    created_at: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

@Injectable()
export class AdminConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly penalties: PenaltyService,
  ) {}

  async getStats(): Promise<Record<string, unknown>> {
    const since = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const [tripGroups, adminCount, tripActive, adminActive] = await Promise.all([
      this.prisma.message.groupBy({ by: ['bookingId'], where: { bookingId: { not: null } } }),
      this.prisma.supportTicket.count(),
      this.prisma.message.groupBy({
        by: ['bookingId'],
        where: { bookingId: { not: null }, createdAt: { gte: since } },
      }),
      this.prisma.message.groupBy({
        by: ['supportTicketId'],
        where: { supportTicketId: { not: null }, createdAt: { gte: since } },
      }),
    ]);
    return {
      total_conversations: tripGroups.length + adminCount,
      trip_conversations: tripGroups.length,
      admin_conversations: adminCount,
      active: tripActive.length + adminActive.length,
    };
  }

  private async listTripConversations(
    query: AdminConversationListQuery,
    page: number,
    limit: number,
    offset: number,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    // Optional party/trip pre-filter for search (booking ids stay UUID — no
    // contains operator, so match through the booking's relations).
    let bookingIds: string[] | undefined;
    if (query.search) {
      const term = query.search;
      const or: Prisma.BookingWhereInput[] = [
        { passenger: { fullName: { contains: term, mode: 'insensitive' } } },
        { passenger: { phone: { contains: term, mode: 'insensitive' } } },
        { trip: { driver: { fullName: { contains: term, mode: 'insensitive' } } } },
        // Trip id is a UUID column (equals only) — never contains.
        ...(UUID_RE.test(term) ? [{ trip: { id: term } } as Prisma.BookingWhereInput] : []),
      ];
      const bookings = await this.prisma.booking.findMany({
        where: { OR: or },
        select: { id: true },
        take: 500,
      });
      bookingIds = bookings.map((b) => b.id);
      if (bookingIds.length === 0) {
        return { data: [], pagination: buildPagination(0, page, limit) };
      }
    }
    const gte = dateGte(query.date);
    const where: Prisma.MessageWhereInput = {
      bookingId: { not: null },
      ...(bookingIds ? { bookingId: { in: bookingIds } } : {}),
      // Date chips filter on activity within the period (approximation of
      // "last message in period", documented in the validation doc).
      ...(gte ? { createdAt: { gte } } : {}),
    };
    const groups = await this.prisma.message.groupBy({
      by: ['bookingId'],
      where,
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
    });
    const count = groups.length;
    const slice = groups.slice(offset, offset + limit);
    const data: Record<string, unknown>[] = [];
    for (const g of slice) {
      if (!g.bookingId) continue;
      const [booking, last] = await Promise.all([
        this.prisma.booking.findUnique({
          where: { id: g.bookingId },
          include: {
            passenger: { select: { id: true, fullName: true, phone: true } },
            trip: {
              select: {
                id: true,
                originCity: true,
                destinationCity: true,
                status: true,
                driver: { select: { id: true, fullName: true, phone: true } },
              },
            },
          },
        }),
        this.prisma.message.findFirst({
          where: { bookingId: g.bookingId },
          include: { sender: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      if (!booking) continue;
      data.push({
        booking_id: booking.id,
        trip_no: booking.trip?.id ?? booking.tripId,
        driver: booking.trip?.driver
          ? { ...booking.trip.driver, phone: maskPhone(booking.trip.driver.phone) }
          : null,
        passenger: booking.passenger
          ? { ...booking.passenger, phone: maskPhone(booking.passenger.phone) }
          : null,
        route: booking.trip ? `${booking.trip.originCity} ← ${booking.trip.destinationCity}` : null,
        last_message: last ? last.message : null,
        last_message_at: last ? last.createdAt : null,
        trip_status: booking.trip?.status ?? null,
      });
    }
    return { data, pagination: buildPagination(count, page, limit) };
  }

  private async listAdminConversations(
    query: AdminConversationListQuery,
    page: number,
    limit: number,
    offset: number,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const where: Prisma.SupportTicketWhereInput = {};
    if (query.search) {
      const term = query.search;
      where.OR = [
        { user: { fullName: { contains: term, mode: 'insensitive' } } },
        { subject: { contains: term, mode: 'insensitive' } },
      ];
    }
    const gte = dateGte(query.date);
    if (gte) where.updatedAt = { gte };
    const [rows, count] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    const data: Record<string, unknown>[] = [];
    for (const t of rows) {
      const last = await this.prisma.message.findFirst({
        where: { supportTicketId: t.id },
        orderBy: { createdAt: 'desc' },
      });
      data.push({
        ticket_id: t.id,
        user: t.user ? { ...t.user, phone: maskPhone(t.user.phone) } : null,
        subject: t.subject,
        category: t.category,
        status: t.status,
        trip_id: t.tripId,
        last_message: last ? last.message : null,
        last_message_at: last ? last.createdAt : t.updatedAt,
      });
    }
    return { data, pagination: buildPagination(count, page, limit) };
  }

  async listConversations(
    query: AdminConversationListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(query);
    if ((query.type ?? 'trip') === 'admin') {
      return this.listAdminConversations(query, page, limit, offset);
    }
    return this.listTripConversations(query, page, limit, offset);
  }

  private async bookingParties(bookingId: string): Promise<{ passengerId: string; driverId: string }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { select: { driverId: true } } },
    });
    if (!booking || !booking.trip) {
      throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    }
    return { passengerId: booking.passengerId, driverId: booking.trip.driverId };
  }

  async getTripThread(
    bookingId: string,
    query: AdminThreadQuery = {},
  ): Promise<Record<string, unknown>> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        passenger: { select: { id: true, fullName: true, phone: true, createdAt: true } },
        trip: {
          select: {
            id: true,
            driverId: true,
            originCity: true,
            destinationCity: true,
            departureTime: true,
            status: true,
            driver: {
              select: { id: true, fullName: true, phone: true, avgRating: true, createdAt: true },
            },
          },
        },
      },
    });
    if (!booking || !booking.trip) {
      throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    }
    // Same cursor shape as ChatService.listBookingMessages (before_id +
    // createdAt desc), admin-scoped: no membership check by design.
    const { page: p, limit: l, offset } = parsePagination(query);
    const where: Prisma.MessageWhereInput = { bookingId };
    if (query.before_id) {
      const before = await this.prisma.message.findUnique({
        where: { id: query.before_id },
        select: { id: true, bookingId: true, createdAt: true },
      });
      if (!before || before.bookingId !== bookingId) {
        throw new BadRequestException({ message: 'INVALID_BEFORE_ID', code: 'INVALID_BEFORE_ID' });
      }
      where.createdAt = { lt: before.createdAt };
    }
    const [rows, count, penalties] = await Promise.all([
      this.prisma.message.findMany({
        where: { ...where },
        include: { sender: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: l,
      }),
      this.prisma.message.count({ where: { bookingId } }),
      this.prisma.penalty.findMany({
        where: { userId: { in: [booking.passengerId, booking.trip.driverId] } },
        include: { complaint: { select: { id: true, category: true } } },
        orderBy: { startsAt: 'desc' },
        take: 5,
      }),
    ]);
    return {
      trip: {
        id: booking.trip.id,
        route: `${booking.trip.originCity} ← ${booking.trip.destinationCity}`,
        departure_time: booking.trip.departureTime,
        status: booking.trip.status,
        booking_id: booking.id,
      },
      driver: booking.trip.driver
        ? {
          ...booking.trip.driver,
          phone: maskPhone(booking.trip.driver.phone),
          avg_rating: Number(booking.trip.driver.avgRating) || 0,
        }
        : null,
      passenger: booking.passenger
        ? { ...booking.passenger, phone: maskPhone(booking.passenger.phone) }
        : null,
      penalty_action: {
        passenger_id: booking.passengerId,
        driver_id: booking.trip.driverId,
      },
      related_actions: penalties.map((pen) => ({
        id: pen.id,
        type: pen.type,
        reason: pen.reason,
        user_id: pen.userId,
        complaint: pen.complaint,
        starts_at: pen.startsAt,
      })),
      thread: {
        data: rows.map((r) =>
          serializeMessage({
            ...(r as unknown as Parameters<typeof serializeMessage>[0]),
            bookingId: r.bookingId,
            supportTicketId: r.supportTicketId,
          }),
        ),
        pagination: buildPagination(count, p, l),
      },
    };
  }

  async penalize(
    adminId: string,
    bookingId: string,
    dto: ConversationPenaltyDto,
  ): Promise<{ penalty: Record<string, unknown> }> {
    const { passengerId, driverId } = await this.bookingParties(bookingId);
    if (dto.target_user_id !== passengerId && dto.target_user_id !== driverId) {
      throw new ForbiddenException({
        message: 'TARGET_MUST_BE_A_PARTY_OF_THE_BOOKING',
        code: 'FORBIDDEN',
      });
    }
    if (dto.kind === 'temporary') {
      const days = dto.duration === 'custom' ? dto.durationDays : dto.duration != null ? TEMP_DURATION_DAYS[dto.duration] : undefined;
      if (!days) {
        throw validationError('durationDays', 'DURATION_DAYS_REQUIRED_FOR_CUSTOM_DURATION');
      }
      return this.penalties.issue(adminId, {
        user_id: dto.target_user_id,
        type: 'suspension',
        reason: dto.reason,
        details: dto.notes ?? `Temporary suspension for ${days} day(s)`,
        ends_at: new Date(Date.now() + days * 24 * 3600 * 1000).toISOString(),
      });
    }
    if (dto.kind === 'permanent') {
      if (dto.confirmReviewedLog !== true) {
        throw validationError('confirmReviewedLog', 'CONFIRM_REVIEWED_LOG_REQUIRED');
      }
      return this.penalties.issue(adminId, {
        user_id: dto.target_user_id,
        type: 'ban',
        reason: dto.reason,
        details: dto.notes ?? null,
        confirm_reviewed_log: true,
      });
    }
    return this.penalties.issue(adminId, {
      user_id: dto.target_user_id,
      type: 'warning',
      reason: dto.reason,
      details: dto.notes ?? null,
    });
  }
}
