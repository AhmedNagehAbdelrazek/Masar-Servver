import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService, type NotifyUser } from '../notifications/notifications.service.js';

const BLOCKED_TRIP_STATUSES = ['published', 'full', 'in_progress', 'ongoing'] as const;
const BLOCKED_BOOKING_STATUSES = ['pending', 'confirmed'] as const;

/**
 * Mirrors main-server/Services/accountBlockingService.ts. A suspension/ban
 * removes current and future inventory, not only the user's sessions.
 */
@Injectable()
export class AccountBlockingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async blockInventory(
    actorId: string,
    user: { id: string; role: string },
    reason: string,
  ): Promise<Record<string, number> | null> {
    if (user.role === 'driver') return this.blockDriverTrips(actorId, user.id, reason);
    if (user.role === 'passenger') return this.blockPassengerBookings(actorId, user.id, reason);
    return null;
  }

  private async blockDriverTrips(
    actorId: string,
    driverId: string,
    reason: string,
  ): Promise<Record<string, number>> {
    const trips = await this.prisma.trip.findMany({
      where: { driverId, status: { in: [...BLOCKED_TRIP_STATUSES] } },
      include: {
        bookings: {
          where: { status: { in: [...BLOCKED_BOOKING_STATUSES] } },
          include: {
            passenger: {
              select: { id: true, fullName: true, phone: true, fcmToken: true, locale: true },
            },
          },
        },
      },
    });

    let tripsCancelled = 0;
    let bookingsCancelled = 0;

    for (const trip of trips) {
      const bookings = trip.bookings.filter((booking) =>
        BLOCKED_BOOKING_STATUSES.includes(booking.status as (typeof BLOCKED_BOOKING_STATUSES)[number]),
      );
      await this.prisma.$transaction(async (tx) => {
        if (bookings.length > 0) {
          await tx.booking.updateMany({
            where: {
              id: { in: bookings.map((booking) => booking.id) },
              status: { in: [...BLOCKED_BOOKING_STATUSES] },
            },
            data: {
              status: 'cancelled',
              cancellationReason: reason,
              cancelledBy: actorId,
              cancelledAt: new Date(),
            },
          });
        }
        await tx.trip.updateMany({
          where: { id: trip.id, status: { in: [...BLOCKED_TRIP_STATUSES] } },
          data: {
            status: 'cancelled',
            isModerated: true,
            moderationReason: reason,
            moderatedBy: actorId,
          },
        });
      });

      tripsCancelled += 1;
      bookingsCancelled += bookings.length;

      for (const booking of bookings) {
        if (!booking.passenger) continue;
        try {
          await this.notifications.sendToUser(
            booking.passenger as unknown as NotifyUser,
            'TRIP_CANCELLED',
            {
              channels: ['in_app', 'push'],
              vars: {
                route: `${trip.originCity} → ${trip.destinationCity}`,
                reason,
              },
              data: {
                trip_id: trip.id,
                booking_id: booking.id,
                reason,
                source: 'account_block',
              },
            },
          );
        } catch {
          // Notifications are best-effort.
        }
      }
    }

    return { trips_cancelled: tripsCancelled, bookings_cancelled: bookingsCancelled };
  }

  private async blockPassengerBookings(
    actorId: string,
    passengerId: string,
    reason: string,
  ): Promise<Record<string, number>> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        passengerId,
        status: { in: [...BLOCKED_BOOKING_STATUSES] },
        trip: { status: { in: [...BLOCKED_TRIP_STATUSES] } },
      },
      include: {
        passenger: { select: { id: true, fullName: true } },
        trip: {
          include: {
            driver: { select: { id: true, fullName: true, fcmToken: true, locale: true } },
          },
        },
      },
    });

    let bookingsCancelled = 0;

    for (const booking of bookings) {
      const bookedSeats = booking.seatNumbers.length
        ? booking.seatNumbers
        : booking.seatNumber != null
          ? [booking.seatNumber]
          : [];

      const claimed = await this.prisma.$transaction(async (tx) => {
        const claimedBooking = await tx.booking.updateMany({
          where: {
            id: booking.id,
            status: { in: [...BLOCKED_BOOKING_STATUSES] },
          },
          data: {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledBy: actorId,
            cancelledAt: new Date(),
          },
        });
        if (claimedBooking.count === 0) return false;

        const freshTrip = await tx.trip.findUnique({ where: { id: booking.tripId } });
        if (freshTrip) {
          const availableSeats = Math.min(
            freshTrip.totalSeats,
            freshTrip.availableSeats + booking.seatsBooked,
          );
          await tx.trip.update({
            where: { id: freshTrip.id },
            data: {
              availableSeats,
              ...(freshTrip.status === 'full' && availableSeats > 0
                ? { status: 'published' }
                : {}),
            },
          });
        }

        if (bookedSeats.length > 0) {
          await tx.tripSeat.updateMany({
            where: { tripId: booking.tripId, seatNumber: { in: bookedSeats } },
            data: { seatType: 'available' },
          });
        }
        return true;
      });

      if (!claimed) continue;
      bookingsCancelled += 1;

      if (booking.trip?.driver) {
        try {
          await this.notifications.sendToUser(
            booking.trip.driver as unknown as NotifyUser,
            'BOOKING_CANCELLED_DRIVER',
            {
              channels: ['in_app', 'push'],
              vars: {
                passenger: booking.passenger?.fullName || 'راكب',
                seat_number: bookedSeats.join('، '),
                route: `${booking.trip.originCity} → ${booking.trip.destinationCity}`,
              },
              data: {
                booking_id: booking.id,
                trip_id: booking.tripId,
                reason,
                source: 'account_block',
              },
            },
          );
        } catch {
          // Notifications are best-effort.
        }
      }
    }

    const requests = await this.prisma.rideRequest.updateMany({
      where: {
        passengerId,
        status: { in: ['open', 'offered', 'accepted'] },
      },
      data: { status: 'cancelled' },
    });

    return {
      bookings_cancelled: bookingsCancelled,
      requests_cancelled: requests.count,
    };
  }
}
