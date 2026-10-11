import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService, type NotifyUser } from '../notifications/notifications.service.js';

// Port of Main Server/Services/delayService.ts.
function serializeDelay(event: {
  id: string;
  bookingId: string;
  party: string;
  delayMinutes: number;
  reason: string | null;
  reportedBy: string;
  createdAt: Date;
}): Record<string, unknown> {
  return {
    id: event.id,
    booking_id: event.bookingId,
    party: event.party,
    delay_minutes: event.delayMinutes,
    reason: event.reason,
    reported_by: event.reportedBy,
    created_at: event.createdAt,
  };
}

@Injectable()
export class DelayService {
  private readonly logger = new Logger(DelayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async loadBookingForUser(
    userId: string,
    bookingId: string,
  ): Promise<{ id: string; passengerId: string; tripId: string; trip: { driverId: string } | null }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: { select: { driverId: true } } },
    });
    if (!booking) throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    const trip = booking.trip as unknown as { driverId: string } | null;
    if (booking.passengerId !== userId && (!trip || trip.driverId !== userId)) {
      throw new ForbiddenException({
        message: 'YOU_ARE_NOT_PART_OF_THIS_BOOKING',
        code: 'FORBIDDEN',
      });
    }
    return { id: booking.id, passengerId: booking.passengerId, tripId: booking.tripId, trip };
  }

  async reportDelay(
    userId: string,
    bookingId: string,
    { party, delay_minutes, reason }: { party: string; delay_minutes: number; reason?: string | null },
  ): Promise<{ delay_event: Record<string, unknown> }> {
    const booking = await this.loadBookingForUser(userId, bookingId);
    const isPassenger = booking.passengerId === userId;
    const isDriver = booking.trip !== null && booking.trip.driverId === userId;
    if (party !== 'driver' && party !== 'passenger') {
      throw new UnprocessableEntityException({
        message: 'PARTY_MUST_BE_DRIVER_OR_PASSENGER',
        code: 'VALIDATION_ERROR',
      });
    }
    if (party === 'passenger' && !isPassenger) {
      throw new ForbiddenException({
        message: 'ONLY_THE_BOOKING_PASSENGER_CAN_REPORT_A_PASSENGER_DELAY',
        code: 'FORBIDDEN',
      });
    }
    if (party === 'driver' && !isDriver) {
      throw new ForbiddenException({
        message: 'ONLY_THE_TRIP_DRIVER_CAN_REPORT_A_DRIVER_DELAY',
        code: 'FORBIDDEN',
      });
    }
    const event = await this.prisma.delayEvent.create({
      data: {
        bookingId,
        party: party as 'driver' | 'passenger',
        delayMinutes: delay_minutes,
        reason: reason ?? null,
        reportedBy: userId,
      },
    });
    try {
      const counterpartyId = party === 'driver' ? booking.passengerId : (booking.trip?.driverId ?? null);
      if (counterpartyId) {
        const counterparty = await this.prisma.user.findUnique({ where: { id: counterpartyId } });
        if (counterparty) {
          await this.notifications.sendToUser(counterparty as unknown as NotifyUser, 'DELAY_REPORTED', {
            vars: { delay_minutes: String(delay_minutes), reason: reason ?? 'Not specified.' },
            data: { trip_id: booking.tripId, booking_id: bookingId },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`delay notify failed: ${(err as Error).message}`);
    }
    return { delay_event: serializeDelay(event as unknown as Parameters<typeof serializeDelay>[0]) };
  }

  async listDelays(
    userId: string,
    bookingId: string,
    filters: { party?: string; page?: unknown; limit?: unknown } = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.loadBookingForUser(userId, bookingId);
    const { page, limit, offset } = parsePagination(filters);
    const [rows, count] = await Promise.all([
      this.prisma.delayEvent.findMany({
        where: {
          bookingId,
          ...(filters.party ? { party: filters.party as 'driver' | 'passenger' } : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.delayEvent.count({
        where: {
          bookingId,
          ...(filters.party ? { party: filters.party as 'driver' | 'passenger' } : {}),
        },
      }),
    ]);
    return {
      data: rows.map((r) => serializeDelay(r as unknown as Parameters<typeof serializeDelay>[0])),
      pagination: buildPagination(count, page, limit),
    };
  }
}
