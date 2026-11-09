import { Injectable, Logger } from '@nestjs/common';
import { JORDAN_OFFSET_MS, jordanDateOnly, jordanMinutesOfDay, jordanWeekday } from '../../common/utils/jordan-time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TRIP_REMINDER_LEAD_MINUTES } from './trip.constants.js';

const DAY_MS = 24 * 3600 * 1000;

// Sends the driver a reminder once per trip occurrence. One-off trips use the
// departure timestamp; recurring series calculate their next occurrence in
// Jordan local time so every occurrence gets its own reminder.
@Injectable()
export class TripReminderService {
  private readonly logger = new Logger(TripReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private nextOccurrence(
    trip: {
      departureTime: Date;
      isRecurring: boolean;
      recurrenceDays: number[];
      recurrenceEndDate: Date | null;
    },
    now: Date,
  ): Date | null {
    const horizon = new Date(now.getTime() + TRIP_REMINDER_LEAD_MINUTES * 60000);
    if (!trip.isRecurring) {
      const departure = new Date(trip.departureTime);
      return departure > now && departure <= horizon ? departure : null;
    }
    if (trip.recurrenceDays.length === 0) return null;
    const minutes = jordanMinutesOfDay(trip.departureTime);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    for (let offset = 0; offset <= 1; offset++) {
      const day = jordanDateOnly(new Date(now.getTime() + offset * DAY_MS));
      const dayString = new Date(day.getTime() + JORDAN_OFFSET_MS).toISOString().slice(0, 10);
      const candidate = new Date(
        `${dayString}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`,
      );
      if (candidate < new Date(trip.departureTime)) continue;
      if (trip.recurrenceEndDate && candidate > new Date(trip.recurrenceEndDate)) continue;
      if (!trip.recurrenceDays.includes(jordanWeekday(candidate))) continue;
      if (candidate > now && candidate <= horizon) return candidate;
    }
    return null;
  }

  async sendDueReminders(): Promise<{ sent: number; skipped: number }> {
    const now = new Date();
    const horizon = new Date(now.getTime() + TRIP_REMINDER_LEAD_MINUTES * 60000);
    const trips = await this.prisma.trip.findMany({
      where: {
        status: { in: ['published', 'full'] },
        isModerated: false,
        OR: [
          { isRecurring: false, departureTime: { gt: now, lte: horizon } },
          {
            isRecurring: true,
            OR: [{ recurrenceEndDate: { gte: now } }, { recurrenceEndDate: null }],
          },
        ],
      },
      select: {
        id: true,
        driverId: true,
        originCity: true,
        destinationCity: true,
        departureTime: true,
        isRecurring: true,
        recurrenceDays: true,
        recurrenceEndDate: true,
      },
    });

    let sent = 0;
    let skipped = 0;
    for (const trip of trips) {
      const occurrence = this.nextOccurrence(trip, now);
      if (!occurrence) {
        skipped += 1;
        continue;
      }
      try {
        await this.prisma.tripReminder.create({
          data: {
            tripId: trip.id,
            userId: trip.driverId,
            kind: 'driver_start',
            occurrenceAt: occurrence,
          },
        });
      } catch {
        // Unique key already claimed for this occurrence.
        skipped += 1;
        continue;
      }

      try {
        const driver = await this.prisma.user.findUnique({
          where: { id: trip.driverId },
          select: { id: true, phone: true, fcmToken: true, locale: true },
        });
        if (driver) {
          await this.notifications.sendToUser(driver, 'TRIP_REMINDER', {
            channels: ['push', 'in_app'],
            vars: {
              route: `${trip.originCity} → ${trip.destinationCity}`,
              minutes: TRIP_REMINDER_LEAD_MINUTES,
            },
            data: {
              trip_id: trip.id,
              occurrence_at: occurrence.toISOString(),
              screen: 'trip_details',
            },
          });
        }
        sent += 1;
      } catch (err) {
        this.logger.warn(`trip reminder delivery failed: ${(err as Error).message}`);
        skipped += 1;
      }
    }
    return { sent, skipped };
  }
}
