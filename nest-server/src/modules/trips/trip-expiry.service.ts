import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { SeatLockService } from './seat-lock.service.js';
import { TRIP_ABANDON_AFTER_MINUTES, TRIP_ABANDON_WARN_MINUTES, TRIP_DURATION_HOURS } from './trip.constants.js';
import type { TripsService } from './trips.service.js';
import { TripsService as TripsServiceToken } from './trips.service.js';

export interface SweepResult {
  autoCompleted: string[];
  expiredUnoperated: string[];
  abandoned: string[];
  warned: string[];
  noShowBookings: number;
  errors: { tripId: string | null; message: string }[];
  touched: number;
}

const STARTED_STATUSES = ['in_progress', 'ongoing'] as const;
const UNOPERATED_STATUSES = ['published', 'full'] as const;

// Port of main-server/Services/tripExpiryService.ts. refreshStaleTrips
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

  private async lastActivityAt(trip: {
    id: string;
    startedAt: Date | null;
    updatedAt: Date;
    departureTime: Date;
  }): Promise<Date> {
    const point = await this.prisma.tripLocation.findFirst({
      where: { tripId: trip.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return point?.createdAt ?? trip.startedAt ?? trip.departureTime;
  }

  private async warnOrAbandonStartedTrip(
    trip: {
      id: string;
      driverId: string;
      status: string;
      startedAt: Date | null;
      updatedAt: Date;
      departureTime: Date;
      abandonWarnedAt: Date | null;
      originCity?: string;
      destinationCity?: string;
    },
    result: SweepResult,
  ): Promise<void> {
    const lastActivity = await this.lastActivityAt(trip);
    const idleMinutes = (Date.now() - lastActivity.getTime()) / 60000;
    if (idleMinutes >= TRIP_ABANDON_AFTER_MINUTES) {
      await this.trips.abandonTrip(trip.driverId, trip.id, 'no_driver_activity');
      result.abandoned.push(trip.id);
      return;
    }
    if (idleMinutes >= TRIP_ABANDON_WARN_MINUTES && !trip.abandonWarnedAt) {
      const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
      if (driver) {
        try {
          await this.notifications.sendToUser(driver, 'TRIP_ABANDON_WARNING', {
            channels: ['sms'],
            vars: {
              route: trip.originCity && trip.destinationCity
                ? `${trip.originCity} → ${trip.destinationCity}`
                : 'your active trip',
            },
            data: { trip_id: trip.id },
          });
        } catch {
          // best-effort
        }
      }
      await this.prisma.trip.update({
        where: { id: trip.id },
        data: { abandonWarnedAt: new Date() },
      });
      result.warned.push(trip.id);
    }
  }

  private async closeOutStaleTrip(
    trip: {
      id: string;
      driverId: string;
      status: string;
      startedAt: Date | null;
      updatedAt: Date;
      departureTime: Date;
      abandonWarnedAt: Date | null;
      originCity?: string;
      destinationCity?: string;
    },
    result: SweepResult,
  ): Promise<void> {
    try {
      if ((STARTED_STATUSES as readonly string[]).includes(trip.status)) {
        await this.warnOrAbandonStartedTrip(trip, result);
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
      abandoned: [],
      warned: [],
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
            { status: { in: [...STARTED_STATUSES] } },
          ],
        },
        select: {
          id: true,
          driverId: true,
          status: true,
          startedAt: true,
          updatedAt: true,
          departureTime: true,
          originCity: true,
          destinationCity: true,
          abandonWarnedAt: true,
        },
      });
      for (const trip of trips) {
        await this.closeOutStaleTrip(trip, result);
      }
      result.touched =
        result.autoCompleted.length +
        result.expiredUnoperated.length +
        result.abandoned.length +
        result.warned.length;
      return result;
    } catch (err) {
      result.errors.push({ tripId: null, message: (err as Error).message });
      return result;
    }
  }
}
