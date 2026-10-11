import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { SeatLockService } from './seat-lock.service.js';
import { TRIP_DURATION_HOURS } from './trip.constants.js';
import type { TripsService } from './trips.service.js';
import { TripsService as TripsServiceToken } from './trips.service.js';

export interface SweepResult {
  autoCompleted: string[];
  expiredUnoperated: string[];
  noShowBookings: number;
  errors: { tripId: string | null; message: string }[];
  touched: number;
}

const STARTED_STATUSES = ['in_progress', 'ongoing'] as const;
const UNOPERATED_STATUSES = ['published', 'full'] as const;

// Port of Main Server/Services/tripExpiryService.ts. refreshStaleTrips
// tolerates non-array arguments (node-cron invokes tasks with a context
// object) by running a global sweep instead.
@Injectable()
export class TripExpiryService {
  private readonly logger = new Logger(TripExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TripsServiceToken))
    private readonly trips: TripsService,
    private readonly seatLocks: SeatLockService,
    private readonly notifications: NotificationsService,
    private readonly home: HomeService,
  ) {}

  private unoperatedCutoff(now: Date): Date {
    return now;
  }

  private lifecycleCutoff(now: Date): Date {
    return new Date(now.getTime() - TRIP_DURATION_HOURS * 3600 * 1000);
  }

  private async expireUnoperatedTrip(tripId: string): Promise<number> {
    await this.prisma.trip.update({ where: { id: tripId }, data: { status: 'cancelled' } });
    const updated = await this.prisma.booking.updateMany({
      where: { tripId, status: { in: ['confirmed', 'pending'] } },
      data: { status: 'no_show' },
    });
    const seats = await this.prisma.tripSeat.findMany({
      where: { tripId },
      select: { seatNumber: true },
    });
    for (const s of seats) {
      try {
        await this.seatLocks.releaseSeatLock(tripId, s.seatNumber);
      } catch {
        // best-effort
      }
    }
    try {
      await this.notifications.notifyConfirmedPassengers([tripId], 'TRIP_CANCELLED', {
        data: { trip_id: tripId },
      });
    } catch {
      // best-effort
    }
    try {
      await this.home.invalidateHomeForTrip(tripId, '');
    } catch {
      // best-effort
    }
    return updated.count;
  }

  private async closeOutStaleTrip(
    trip: { id: string; driverId: string; status: string },
    result: SweepResult,
  ): Promise<void> {
    try {
      if ((STARTED_STATUSES as readonly string[]).includes(trip.status)) {
        await this.trips.completeTrip(trip.driverId, trip.id);
        result.autoCompleted.push(trip.id);
      } else {
        result.noShowBookings += await this.expireUnoperatedTrip(trip.id);
        result.expiredUnoperated.push(trip.id);
      }
    } catch (err) {
      result.errors.push({ tripId: trip.id, message: (err as Error).message });
    }
  }

  async refreshStaleTrips(tripIds?: unknown): Promise<SweepResult> {
    const result: SweepResult = {
      autoCompleted: [],
      expiredUnoperated: [],
      noShowBookings: 0,
      errors: [],
      touched: 0,
    };
    try {
      const now = new Date();
      const scoped = Array.isArray(tripIds) ? tripIds.filter((id): id is string => typeof id === 'string') : null;
      const trips = await this.prisma.trip.findMany({
        where: {
          isRecurring: false,
          ...(scoped ? { id: { in: scoped } } : {}),
          OR: [
            { status: { in: [...UNOPERATED_STATUSES] }, departureTime: { lte: this.unoperatedCutoff(now) } },
            { status: { in: [...STARTED_STATUSES] }, departureTime: { lte: this.lifecycleCutoff(now) } },
          ],
        },
        select: { id: true, driverId: true, status: true },
      });
      for (const trip of trips) {
        await this.closeOutStaleTrip(trip, result);
      }
      result.touched = result.autoCompleted.length + result.expiredUnoperated.length;
      return result;
    } catch (err) {
      result.errors.push({ tripId: null, message: (err as Error).message });
      return result;
    }
  }
}
