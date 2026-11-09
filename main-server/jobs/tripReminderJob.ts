// @ts-nocheck
import { Op } from 'sequelize';
import { Trip, TripReminder, User } from '../Models';
import notificationService from '../Services/notificationService';
import {
  jordanDateOnly,
  jordanMinutesOfDay,
  jordanWeekday,
} from '../utils/time';
import { TRIP_REMINDER_LEAD_MINUTES } from '../config/constants';

const DAY_MS = 24 * 3600 * 1000;

function nextOccurrence(trip, now) {
  const horizon = new Date(now.getTime() + TRIP_REMINDER_LEAD_MINUTES * 60000);
  if (!trip.isRecurring) {
    const departure = new Date(trip.departureTime);
    return departure > now && departure <= horizon ? departure : null;
  }
  const days = trip.recurrenceDays || [];
  if (days.length === 0) return null;
  const minutes = jordanMinutesOfDay(trip.departureTime);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  for (let offset = 0; offset <= 1; offset++) {
    const day = jordanDateOnly(new Date(now.getTime() + offset * DAY_MS));
    const dayString = new Date(day.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const candidate = new Date(
      `${dayString}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`
    );
    if (candidate < new Date(trip.departureTime)) continue;
    if (trip.recurrenceEndDate && candidate > new Date(trip.recurrenceEndDate)) continue;
    if (!days.includes(jordanWeekday(candidate))) continue;
    if (candidate > now && candidate <= horizon) return candidate;
  }
  return null;
}

async function runTripReminder() {
  const now = new Date();
  const horizon = new Date(now.getTime() + TRIP_REMINDER_LEAD_MINUTES * 60000);
  const trips = await Trip.findAll({
    where: {
      status: { [Op.in]: ['published', 'full'] },
      isModerated: false,
      [Op.or]: [
        { isRecurring: false, departureTime: { [Op.gt]: now, [Op.lte]: horizon } },
        {
          isRecurring: true,
          [Op.or]: [{ recurrenceEndDate: { [Op.gte]: now } }, { recurrenceEndDate: null }],
        },
      ],
    },
    attributes: [
      'id',
      'driverId',
      'originCity',
      'destinationCity',
      'departureTime',
      'isRecurring',
      'recurrenceDays',
      'recurrenceEndDate',
    ],
  });

  let sent = 0;
  let skipped = 0;
  for (const trip of trips) {
    const occurrence = nextOccurrence(trip, now);
    if (!occurrence) {
      skipped += 1;
      continue;
    }
    let claimed = false;
    try {
      await TripReminder.create({
        tripId: trip.id,
        userId: trip.driverId,
        kind: 'driver_start',
        occurrenceAt: occurrence,
      });
      claimed = true;
    } catch (err) {
      // Unique key already claimed for this occurrence.
      skipped += 1;
    }
    if (!claimed) continue;

    try {
      const driver = await User.findByPk(trip.driverId, {
        attributes: ['id', 'phone', 'fcmToken', 'locale'],
      });
      if (driver) {
        await notificationService.sendToUser(driver, 'TRIP_REMINDER', {
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
      console.warn('[tripReminderJob] reminder delivery failed:', err.message);
      skipped += 1;
    }
  }
  return { sent, skipped };
}

module.exports = { runTripReminder };
export { runTripReminder };
export default { runTripReminder };
