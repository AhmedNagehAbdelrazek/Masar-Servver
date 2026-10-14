import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { withSerializableRetry } from '../../prisma/transaction.js';
import type {
  AdminBookingListQuery,
  AdminCancelBookingDto,
} from './dto/admin-bookings.dto.js';

// Admin bookings surface (متابعة حجوزات الركاب وحالاتها).
// Figma: 10558:38631 (list + cards), 10563:40148 (detail مؤكد),
// 10571:42365 / 10613:8891 / 10613:9448 / 10613:17653 (detail ملغاة variants),
// 10571:41682 (إلغاء الحجز modal). Header/sidebar ignored.
// Cancel mirrors BookingsService.cancelBooking (conditional claim + seat
// release + TripSeat release) with the admin as cancelledBy and no 1-hour
// window — admin override. Payment is cash (نقدًا مباشرة للسائق) so there is
// no refund leg. Audit is covered by the global AuditInterceptor.

const UPCOMING_TRIP = ['published', 'full'] as const;
const ACTIVE_TRIP = ['in_progress', 'ongoing'] as const;
@Injectable()
export class AdminBookingsService {
  private readonly logger = new Logger(AdminBookingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<Record<string, unknown>> {
    const [total, completed, cancelled, upcoming, inProgress] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'completed' } }),
      this.prisma.booking.count({ where: { status: 'cancelled' } }),
      this.prisma.booking.count({
        where: {
          status: { in: ['pending', 'confirmed'] },
          trip: { status: { in: [...UPCOMING_TRIP] } },
        },
      }),
      this.prisma.booking.count({
        where: { status: 'confirmed', trip: { status: { in: [...ACTIVE_TRIP] } } },
      }),
    ]);
    return {
      total_bookings: total,
      upcoming,
      in_progress: inProgress,
      completed,
      cancelled,
    };
  }

  private listWhere(query: AdminBookingListQuery): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = {};
    switch (query.status) {
      case 'upcoming':
        where.status = { in: ['pending', 'confirmed'] };
        where.trip = { status: { in: [...UPCOMING_TRIP] } };
        break;
      case 'in_progress':
        where.status = 'confirmed';
        where.trip = { status: { in: [...ACTIVE_TRIP] } };
        break;
      case 'completed':
        where.status = 'completed';
        break;
      case 'cancelled':
        where.status = 'cancelled';
        break;
      default:
        break;
    }
    if (query.search) {
      const term = query.search;
      where.OR = [
        { referenceCode: { contains: term, mode: 'insensitive' } },
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
    return where;
  }

  async listBookings(
    query: AdminBookingListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(query);
    const where = this.listWhere(query);
    const [rows, count] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          passenger: { select: { id: true, fullName: true, phone: true } },
          trip: {
            select: {
              id: true,
              originCity: true,
              destinationCity: true,
              departureTime: true,
              totalSeats: true,
              availableSeats: true,
              status: true,
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
        booking_no: b.referenceCode,
        passenger: b.passenger
          ? { id: b.passenger.id, name: b.passenger.fullName, phone: maskPhone(b.passenger.phone) }
          : null,
        route:
          b.trip != null ? `${b.trip.originCity} ← ${b.trip.destinationCity}` : null,
        booking_date: b.createdAt,
        trip_no: b.trip?.id ?? b.tripId,
        trip_status: b.trip?.status ?? null,
        seats: b.trip != null
          ? `${b.seatsBooked} / ${Number(b.trip.totalSeats)}`
          : `${b.seatsBooked}`,
        seat_price: Number(b.agreedFare),
        status: b.status,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getDetail(bookingId: string): Promise<Record<string, unknown>> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
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
        trip: {
          include: {
            driver: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                age: true,
                createdAt: true,
                lastLoginAt: true,
              },
            },
          },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    }
    const trip = booking.trip as unknown as Record<string, unknown> | null;
    const [totalBookings, completedBookings, cancelledBookings, lastBooking] = await Promise.all([
      this.prisma.booking.count({ where: { passengerId: booking.passengerId } }),
      this.prisma.booking.count({ where: { passengerId: booking.passengerId, status: 'completed' } }),
      this.prisma.booking.count({ where: { passengerId: booking.passengerId, status: 'cancelled' } }),
      this.prisma.booking.findFirst({
        where: { passengerId: booking.passengerId },
        include: {
          trip: { select: { id: true, originCity: true, destinationCity: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const timeline: Record<string, unknown>[] = [
      { event: 'created', at: booking.createdAt },
    ];
    if (booking.status !== 'pending' && booking.status !== 'cancelled') {
      timeline.push({ event: 'confirmed', at: booking.updatedAt });
    }
    if (trip) {
      timeline.push({
        event: 'linked_to_trip',
        trip_id: (trip as { id: string }).id,
        at: booking.createdAt,
      });
    }
    if (booking.status === 'cancelled') {
      timeline.push({
        event: 'cancelled',
        at: booking.cancelledAt,
        reason: booking.cancellationReason,
        cancelled_by: booking.cancelledBy,
      });
    }
    if (booking.status === 'completed') {
      timeline.push({ event: 'completed', at: booking.completedAt });
    }
    return {
      booking: {
        id: booking.id,
        booking_no: booking.referenceCode,
        trip_no: booking.tripId,
        status: booking.status,
        created_date: booking.createdAt,
        seats_booked: booking.seatsBooked,
        seat_numbers: booking.seatNumbers,
        seat_price: Number(booking.agreedFare),
        total_price: Number(booking.agreedFare) * Number(booking.seatsBooked),
        currency: booking.currency,
        payment_status: booking.paymentStatus,
        cancellation_reason: booking.cancellationReason,
        cancelled_by: booking.cancelledBy,
        cancelled_at: booking.cancelledAt,
      },
      timeline,
      trip: trip
        ? {
            id: (trip as { id: string }).id,
            origin_city: (trip as { originCity: string }).originCity,
            destination_city: (trip as { destinationCity: string }).destinationCity,
            departure_time: (trip as { departureTime: Date }).departureTime,
            arrival_time: (trip as { arrivalTime: Date | null }).arrivalTime,
            seats_booked: booking.seatsBooked,
            total_seats: Number((trip as { totalSeats: number }).totalSeats),
            available_seats: Number((trip as { availableSeats: number }).availableSeats),
            status: (trip as { status: string }).status,
          }
        : null,
      driver: booking.trip && (booking.trip as unknown as { driver: unknown }).driver
        ? {
            ...(booking.trip as unknown as { driver: Record<string, unknown> }).driver,
            phone: maskPhone(
              ((booking.trip as unknown as { driver: { phone: string } }).driver.phone),
            ),
          }
        : null,
      passenger: booking.passenger
        ? { ...booking.passenger, phone: maskPhone(booking.passenger.phone) }
        : null,
      passenger_activity: {
        total_bookings: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        last_booking: lastBooking
          ? {
              id: lastBooking.id,
              reference_code: lastBooking.referenceCode,
              status: lastBooking.status,
              trip: lastBooking.trip,
              created_at: lastBooking.createdAt,
            }
          : null,
      },
    };
  }

  async cancelBooking(
    adminId: string,
    bookingId: string,
    dto: AdminCancelBookingDto,
  ): Promise<{ booking: Record<string, unknown> }> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ConflictException({
        message: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
        code: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
      });
    }
    const reason = dto.notes ? `${dto.reason}: ${dto.notes}` : dto.reason;
    const updated = await withSerializableRetry(this.prisma, async (tx) => {
      const claimed = await tx.booking.updateMany({
        where: { id: bookingId, status: { in: ['pending', 'confirmed'] } },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: adminId,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException({
          message: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
          code: 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED',
        });
      }
      const freshTrip = await tx.trip.findUnique({ where: { id: booking.tripId } });
      if (freshTrip) {
        const availableSeats = Number(freshTrip.availableSeats) + Number(booking.seatsBooked);
        await tx.trip.update({
          where: { id: booking.tripId },
          data: {
            availableSeats,
            ...(freshTrip.status === 'full' && availableSeats > 0 && availableSeats <= Number(freshTrip.totalSeats)
              ? { status: 'published' }
              : {}),
          },
        });
      }
      const bookedSeats =
        booking.seatNumbers && booking.seatNumbers.length > 0
          ? booking.seatNumbers
          : booking.seatNumber != null
            ? [booking.seatNumber]
            : [];
      if (bookedSeats.length > 0) {
        const rows = await tx.tripSeat.findMany({
          where: { tripId: booking.tripId, seatNumber: { in: bookedSeats } },
        });
        for (const row of rows) {
          if (row.seatType !== 'available') {
            await tx.tripSeat.update({ where: { id: row.id }, data: { seatType: 'available' } });
          }
        }
      }
      return tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    });
    try {
      await this.prisma.notification.create({
        data: {
          userId: booking.passengerId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking cancelled',
          body: `Your booking ${booking.referenceCode} was cancelled by support. Reason: ${dto.reason}`,
          data: { booking_id: bookingId, reason: dto.reason },
          sentVia: ['in_app'],
        },
      });
    } catch (err) {
      this.logger.warn(`[admin-bookings] cancel notification failed: ${(err as Error).message}`);
    }
    return {
      booking: {
        id: updated.id,
        reference_code: updated.referenceCode,
        status: updated.status,
        cancellation_reason: updated.cancellationReason,
        cancelled_by: updated.cancelledBy,
        cancelled_at: updated.cancelledAt,
      },
    };
  }
}
