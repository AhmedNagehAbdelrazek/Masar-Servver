import { ApiErrors } from './ApiError';

/**
 * Timezone-aware datetime helpers.
 *
 * Contract: every datetime crossing the API boundary must carry an explicit
 * timezone — ISO-8601 with a `Z` suffix or a numeric offset
 * (e.g. `2026-09-15T06:00:00+03:00`). Naive strings like `2026-09-15T06:00`
 * are rejected because their meaning depends on the server's local timezone.
 *
 * Jordan (Asia/Amman) is fixed at UTC+3 year-round (no DST since 2022), so
 * calendar-day math (search `date`, `repeated_end_date`, time-of-day windows)
 * is anchored to a fixed +03:00 offset without extra dependencies.
 */
export const JORDAN_TZ: string = 'Asia/Amman';
export const JORDAN_OFFSET: string = '+03:00';
export const JORDAN_OFFSET_MS: number = 3 * 60 * 60 * 1000;

const TZ_SUFFIX_RE = /(Z|[+-]\d{2}:?\d{2})$/;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when the value is a string carrying an explicit timezone. */
export function hasTimezoneOffset(value: unknown): boolean {
  return typeof value === 'string' && TZ_SUFFIX_RE.test(value.trim());
}

/** True for calendar dates (`YYYY-MM-DD`) without a time component. */
export function isDateOnly(value: unknown): boolean {
  return typeof value === 'string' && DATE_ONLY_RE.test(value.trim());
}

/**
 * Parse a timezone-aware datetime. Throws a validation ApiError when the
 * value is missing an offset or is not a real date.
 */
export function parseTimezoneAware(value: unknown, errorKey = 'DATETIME_MUST_INCLUDE_TIMEZONE'): Date {
  if (!hasTimezoneOffset(value)) {
    throw ApiErrors.validation(errorKey);
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw ApiErrors.validation(errorKey);
  }
  return parsed;
}

/**
 * Parse an optional timezone-aware datetime (`null`/`undefined` pass through).
 */
export function parseOptionalTimezoneAware(
  value: unknown,
  errorKey = 'DATETIME_MUST_INCLUDE_TIMEZONE',
): Date | null {
  if (value === undefined || value === null || value === '') return null;
  return parseTimezoneAware(value, errorKey);
}

/**
 * Parse a calendar date (`YYYY-MM-DD`) as midnight in Jordan (+03:00), so the
 * resulting instant never depends on the server timezone.
 */
export function parseJordanDateOnly(value: unknown, errorKey = 'DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD'): Date {
  if (!isDateOnly(value)) {
    throw ApiErrors.validation(errorKey);
  }
  const parsed = new Date(`${String(value).trim()}T00:00:00${JORDAN_OFFSET}`);
  if (Number.isNaN(parsed.getTime())) {
    throw ApiErrors.validation(errorKey);
  }
  return parsed;
}

/**
 * Accept either a Jordan calendar date (`YYYY-MM-DD`) or a full
 * timezone-aware datetime; date-only input means Jordan midnight.
 */
export function parseJordanDayStart(value: unknown): Date {
  if (isDateOnly(value)) return parseJordanDateOnly(value);
  return parseTimezoneAware(value);
}

/**
 * Recurrence end: a Jordan calendar date (`YYYY-MM-DD`) means Jordan
 * midnight; an already timezone-aware instant (or Date from the DB) passes
 * through as-is. `null`/undefined pass through.
 */
export function parseJordanDateOrInstant(
  value: unknown,
  errorKey = 'DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD',
): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (isDateOnly(value)) return parseJordanDateOnly(value, errorKey);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value);
  return parseTimezoneAware(value, errorKey);
}

/** Jordan midnight (start of calendar day) containing the given instant. */
export function jordanDateOnly(d: Date | string | number): Date {
  const shifted = new Date(new Date(d).getTime() + JORDAN_OFFSET_MS);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - JORDAN_OFFSET_MS,
  );
}

/** Minutes since midnight for the instant's wall time in Jordan (0..1439). */
export function jordanMinutesOfDay(d: Date | string | number): number {
  const shifted = new Date(new Date(d).getTime() + JORDAN_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** Weekday (0=Sunday..6=Saturday) of the instant's calendar day in Jordan. */
export function jordanWeekday(d: Date | string | number): number {
  return new Date(new Date(d).getTime() + JORDAN_OFFSET_MS).getUTCDay();
}

/** Today at Jordan midnight. */
export function jordanStartOfToday(): Date {
  return jordanDateOnly(new Date());
}

const timeUtils = {
  JORDAN_TZ,
  JORDAN_OFFSET,
  JORDAN_OFFSET_MS,
  hasTimezoneOffset,
  isDateOnly,
  parseTimezoneAware,
  parseOptionalTimezoneAware,
  parseJordanDateOnly,
  parseJordanDateOrInstant,
  parseJordanDayStart,
  jordanDateOnly,
  jordanMinutesOfDay,
  jordanWeekday,
  jordanStartOfToday,
};
export default timeUtils;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = timeUtils;
  // @ts-ignore
  Object.assign(module.exports, timeUtils);
  // @ts-ignore
  module.exports.default = timeUtils;
}
