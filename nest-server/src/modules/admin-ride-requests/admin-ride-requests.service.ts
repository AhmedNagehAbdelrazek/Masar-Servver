import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AdminRideRequestListQuery } from './dto/admin-ride-requests.dto.js';

// Admin ride-requests surface (طلبات الرحلات — requests passengers create when
// no trip fits). Figma: 10631:10466 (list + cards), 10632:19244 (بيانات الطلب),
// 10632:11486 (قيد البحث), 10643:10725 (توجد مطابقة), 10654:10335 (مكتملة),
// 10654:11518 (منتهية), 10673:11331 (ملغي). Header/sidebar ignored.
// Read-only v1: Figma shows no admin action buttons, only عرض التفاصيل /
// عرض الرحلة / عرض السائق / عرض الراكب links. Audit is covered by the global
// AuditInterceptor.
//
// Schema notes: RideRequest is single-shot (originTime/arrivalDeadline) while
// Figma shows multi-slot recurring requests (3 مواعيد, متكرر, time window +
// preferred time). Slots/recurring/window/gender are read from the
// attributesPreferred JSON when present; otherwise a single slot is
// synthesized from originTime/arrivalDeadline. Display numbers (RQ-/TR-) have
// no backing column — raw ids are returned (reference-code migration is a
// follow-up, same as the bookings patch).

// RequestOfferStatus: sent|accepted|declined|expired. A sent offer already
// means توجد مطابقة (a trip was proposed); accepted means it was taken.
const MATCHED_OFFER = ['sent', 'offered'] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RequestPrefs {
  slots?: { date?: string; preferred?: boolean; label?: string }[];
  recurring?: boolean;
  timeFrom?: string;
  timeTo?: string;
  preferredTime?: string;
  gender?: string;
}

function prefsOf(value: unknown): RequestPrefs {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as RequestPrefs;
}

function slotList(
  prefs: RequestPrefs,
  originTime: Date | null,
  arrivalDeadline: Date | null,
): { date: string | null; preferred: boolean }[] {
  if (Array.isArray(prefs.slots) && prefs.slots.length > 0) {
    return prefs.slots.map((s) => ({ date: s?.date ?? null, preferred: s?.preferred === true }));
  }
  const single = originTime ?? arrivalDeadline;
  return [{ date: single ? single.toISOString() : null, preferred: true }];
}

@Injectable()
export class AdminRideRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<Record<string, unknown>> {
    const [total, open, offered, accepted, cancelled, expired] = await Promise.all([
      this.prisma.rideRequest.count(),
      this.prisma.rideRequest.count({ where: { status: 'open' } }),
      this.prisma.rideRequest.count({ where: { status: 'offered' } }),
      this.prisma.rideRequest.count({ where: { status: 'accepted' } }),
      this.prisma.rideRequest.count({ where: { status: 'cancelled' } }),
      this.prisma.rideRequest.count({ where: { status: 'expired' } }),
    ]);
    return {
      total_requests: total,
      searching: open,
      matched: offered,
      completed: accepted,
      cancelled,
      expired,
    };
  }

  async listRequests(
    query: AdminRideRequestListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(query);
    const where: Prisma.RideRequestWhereInput = {};
    if (query.status && query.status !== 'all') {
      where.status = query.status as 'open' | 'offered' | 'accepted' | 'expired' | 'cancelled';
    }
    if (query.search) {
      const term = query.search;
      // UUID columns support equals only — contains applies to text columns.
      where.OR = UUID_RE.test(term)
        ? [{ id: term }]
        : [
            { passenger: { fullName: { contains: term, mode: 'insensitive' } } },
            { passenger: { phone: { contains: term, mode: 'insensitive' } } },
          ];
    }
    if (query.from || query.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.from) createdAt.gte = new Date(`${query.from}T00:00:00.000Z`);
      if (query.to) createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);
      where.createdAt = createdAt;
    }
    const [rows, count] = await Promise.all([
      this.prisma.rideRequest.findMany({
        where,
        include: {
          passenger: { select: { id: true, fullName: true, phone: true } },
          offers: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.rideRequest.count({ where }),
    ]);
    return {
      data: rows.map((r) => {
        const prefs = prefsOf(r.attributesPreferred);
        const slots = slotList(prefs, r.originTime, r.arrivalDeadline);
        return {
          id: r.id,
          request_no: r.id,
          passenger: r.passenger
            ? { id: r.passenger.id, name: r.passenger.fullName, phone: maskPhone(r.passenger.phone) }
            : null,
          route: `${r.originCity} ← ${r.destinationCity}`,
          created_at: r.createdAt,
          slots_count: slots.length,
          slots_label: slots.length > 1 ? `${slots.length} مواعيد` : null,
          seats_needed: r.seatsNeeded,
          gender: prefs.gender ?? null,
          status: r.status,
          offers_count: r.offers.length,
        };
      }),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getDetail(requestId: string): Promise<Record<string, unknown>> {
    const request = await this.prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: {
        passenger: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            age: true,
            gender: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        offers: {
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
                driver: { select: { id: true, fullName: true, phone: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    const prefs = prefsOf(request.attributesPreferred);
    const slots = slotList(prefs, request.originTime, request.arrivalDeadline);
    const offers = request.offers as unknown as {
      id: string;
      status: string;
      driverId: string;
      offeredFare: unknown;
      createdAt: Date;
      trip: {
        id: string;
        originCity: string;
        destinationCity: string;
        departureTime: Date;
        totalSeats: number;
        availableSeats: number;
        farePerSeat: unknown;
        status: string;
        driver: { id: string; fullName: string | null; phone: string } | null;
      } | null;
    }[];
    const matched = offers.find((o) => o.status === 'accepted' && o.trip)
      ?? offers.find((o) => (MATCHED_OFFER as readonly string[]).includes(o.status) && o.trip)
      ?? null;

    const log: Record<string, unknown>[] = [
      { event: 'created', at: request.createdAt },
      { event: 'search_started', at: request.createdAt },
    ];
    const firstMatch = [...offers].reverse().find((o) => o.trip);
    if (firstMatch?.trip) {
      log.push({
        event: 'matched',
        trip_id: firstMatch.trip.id,
        at: (firstMatch as { createdAt: Date }).createdAt,
      });
    }
    if (request.status === 'accepted') log.push({ event: 'completed', at: request.updatedAt });
    if (request.status === 'cancelled') {
      log.push({ event: 'cancelled', at: request.updatedAt, note: request.note });
    }
    if (request.status === 'expired') {
      log.push({ event: 'expired', at: request.expiresAt });
    }

    const [totalBookings, completedBookings, cancelledBookings] = await Promise.all([
      this.prisma.booking.count({ where: { passengerId: request.passengerId } }),
      this.prisma.booking.count({ where: { passengerId: request.passengerId, status: 'completed' } }),
      this.prisma.booking.count({ where: { passengerId: request.passengerId, status: 'cancelled' } }),
    ]);

    return {
      request: {
        id: request.id,
        request_no: request.id,
        seats_needed: request.seatsNeeded,
        slots_count: slots.length,
        recurring: prefs.recurring === true,
        status: request.status,
        origin_city: request.originCity,
        origin_place: request.originPlace,
        destination_city: request.destinationCity,
        destination_place: request.destinationPlace,
        time_from: prefs.timeFrom ?? null,
        time_to: prefs.timeTo ?? null,
        preferred_time: prefs.preferredTime ?? null,
        gender: prefs.gender ?? null,
        max_budget: request.maxBudget != null ? Number(request.maxBudget) : null,
        currency: request.currency,
        note: request.note,
        created_date: request.createdAt,
        expires_at: request.expiresAt,
      },
      slots,
      passenger: request.passenger
        ? { ...request.passenger, phone: maskPhone(request.passenger.phone) }
        : null,
      passenger_activity: {
        total_bookings: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      match:
        matched?.trip != null
          ? {
              offer_id: matched.id,
              offer_status: matched.status,
              matched_at: (matched as { createdAt: Date }).createdAt,
              trip: {
                id: matched.trip.id,
                route: `${matched.trip.originCity} ← ${matched.trip.destinationCity}`,
                departure_time: matched.trip.departureTime,
                seats_booked: request.seatsNeeded,
                seat_price: Number(matched.trip.farePerSeat),
                total_seats: Number(matched.trip.totalSeats),
                available_seats: Number(matched.trip.availableSeats),
                status: matched.trip.status,
              },
              driver: matched.trip.driver
                ? { ...matched.trip.driver, phone: maskPhone(matched.trip.driver.phone) }
                : null,
            }
          : null,
      cancellation:
        request.status === 'cancelled'
          ? { reason: request.note, cancelled_at: request.updatedAt }
          : null,
      expiry:
        request.status === 'expired' ? { expired_at: request.expiresAt } : null,
      log,
    };
  }
}
