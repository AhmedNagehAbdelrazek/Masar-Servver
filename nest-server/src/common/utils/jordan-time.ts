// Port of the Jordan-day helpers from Main Server/utils/time.ts.
// Server-local midnight is wrong for local users; the home "today" window is
// anchored to Asia/Amman midnight instead.
export const JORDAN_OFFSET_MS = 3 * 60 * 60 * 1000;

export function jordanDateOnly(d: Date | string | number): Date {
  const shifted = new Date(new Date(d).getTime() + JORDAN_OFFSET_MS);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) -
      JORDAN_OFFSET_MS,
  );
}

export function jordanStartOfToday(): Date {
  return jordanDateOnly(new Date());
}

/** Wall-clock minutes in Jordan for time-of-day comparisons (0..1439). */
export function jordanMinutesOfDay(d: Date | string | number): number {
  const shifted = new Date(new Date(d).getTime() + JORDAN_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** Weekday (0=Sunday..6=Saturday) of the instant's calendar day in Jordan. */
export function jordanWeekday(d: Date | string | number): number {
  return new Date(new Date(d).getTime() + JORDAN_OFFSET_MS).getUTCDay();
}
