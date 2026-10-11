import { ConflictException } from '@nestjs/common';
import { jordanDateOnly, jordanMinutesOfDay, jordanWeekday } from '../../common/utils/jordan-time.js';
import { parseJordanDateOrInstant } from '../../common/utils/time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BLOCKING_TRIP_STATUSES, TRIP_DURATION_HOURS } from './trip.constants.js';

// Port of the overlap-guard helpers in Main Server/Services/tripService.ts.
export function tripWindowEnd(start: Date): Date {
  return new Date(new Date(start).getTime() + TRIP_DURATION_HOURS * 3600 * 1000);
}

export function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  );
}

function timeWindowsOverlap(aStartMin: number, bStartMin: number): boolean {
  const durationMin = TRIP_DURATION_HOURS * 60;
  return aStartMin < bStartMin + durationMin && bStartMin < aStartMin + durationMin;
}

function sharedWeekdayOccurs(rangeStart: Date, rangeEnd: Date | null, weekdays: number[]): boolean {
  if (!weekdays || weekdays.length === 0) return false;
  if (!rangeEnd) return true;
  const start = jordanDateOnly(rangeStart);
  const end = jordanDateOnly(rangeEnd);
  if (start > end) return false;
  const spanDays = Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000));
  if (spanDays >= 6) return true;
  const cursor = new Date(start);
  for (let i = 0; i <= spanDays; i++) {
    if (weekdays.includes(jordanWeekday(cursor))) return true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

interface SeriesLike {
  departureTime: Date;
  recurrenceDays: number[] | null;
  recurrenceEndDate: Date | null;
}

function oneOffOverlapsSeries(oneOffStart: Date, _oneOffEnd: Date, series: SeriesLike): boolean {
  const first = jordanDateOnly(series.departureTime);
  const day = jordanDateOnly(oneOffStart);
  if (day < first) return false;
  if (series.recurrenceEndDate && day > jordanDateOnly(series.recurrenceEndDate)) return false;
  if (!sharedWeekdayOccurs(day, day, series.recurrenceDays ?? [])) return false;
  return timeWindowsOverlap(jordanMinutesOfDay(oneOffStart), jordanMinutesOfDay(series.departureTime));
}

function seriesOverlapSeries(a: SeriesLike, b: SeriesLike): boolean {
  const aFirst = jordanDateOnly(a.departureTime);
  const bFirst = jordanDateOnly(b.departureTime);
  const rangeStart = aFirst > bFirst ? aFirst : bFirst;
  const aEnd = a.recurrenceEndDate ? jordanDateOnly(a.recurrenceEndDate) : null;
  const bEnd = b.recurrenceEndDate ? jordanDateOnly(b.recurrenceEndDate) : null;
  const rangeEnd = aEnd && bEnd ? (aEnd < bEnd ? aEnd : bEnd) : (aEnd ?? bEnd);
  const shared = (a.recurrenceDays ?? []).filter((d) => (b.recurrenceDays ?? []).includes(d));
  if (!sharedWeekdayOccurs(rangeStart, rangeEnd, shared)) return false;
  return timeWindowsOverlap(jordanMinutesOfDay(a.departureTime), jordanMinutesOfDay(b.departureTime));
}

export async function assertNoOverlappingTrip(
  prisma: PrismaService,
  driverId: string,
  {
    departureTime,
    isRecurring,
    recurrenceDays,
    recurrenceEndDate,
    excludeTripId = null,
  }: {
    departureTime: Date;
    isRecurring: boolean;
    recurrenceDays: number[] | null;
    recurrenceEndDate: string | Date | null;
    excludeTripId?: string | null;
  },
): Promise<void> {
  const existing = await prisma.trip.findMany({
    where: {
      driverId,
      status: { in: [...BLOCKING_TRIP_STATUSES] },
      ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
    },
    select: {
      id: true,
      departureTime: true,
      isRecurring: true,
      recurrenceDays: true,
      recurrenceEndDate: true,
      status: true,
    },
  });
  if (existing.length === 0) return;

  const newStart = new Date(departureTime);
  const newEnd = tripWindowEnd(newStart);
  const candidate: SeriesLike = {
    departureTime: newStart,
    recurrenceDays: isRecurring ? (recurrenceDays ?? []) : null,
    recurrenceEndDate: isRecurring ? parseJordanDateOrInstant(recurrenceEndDate) : null,
  };

  for (const t of existing) {
    const curStart = new Date(t.departureTime);
    const curEnd = tripWindowEnd(curStart);
    const seriesT: SeriesLike = {
      departureTime: curStart,
      recurrenceDays: t.recurrenceDays,
      recurrenceEndDate: t.recurrenceEndDate,
    };
    let overlap = false;
    if (!t.isRecurring && !isRecurring) {
      overlap = windowsOverlap(newStart, newEnd, curStart, curEnd);
    } else if (t.isRecurring && !isRecurring) {
      overlap = oneOffOverlapsSeries(newStart, newEnd, seriesT);
    } else if (!t.isRecurring && isRecurring) {
      overlap = oneOffOverlapsSeries(curStart, curEnd, candidate);
    } else {
      overlap = seriesOverlapSeries(candidate, seriesT);
    }
    if (overlap) {
      throw new ConflictException({
        message: 'DRIVER_ALREADY_HAS_A_TRIP_IN_THIS_TIME_SLOT',
        code: 'TRIP_TIME_OVERLAP',
        details: { conflicting_trip_id: t.id, conflicting_departure_time: t.departureTime },
      });
    }
  }
}
