import { UnprocessableEntityException } from '@nestjs/common';
import { jordanDateOnly } from './jordan-time.js';

// Port of Main Server/utils/time.ts (API-boundary subset).
// Validation failures are 422 VALIDATION_ERROR, mirroring ApiErrors.validation.
const TZ_SUFFIX_RE = /(Z|[+-]\d{2}:?\d{2})$/;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const JORDAN_OFFSET = '+03:00';

function validationError(key: string): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: key,
    code: 'VALIDATION_ERROR',
  });
}

export function hasTimezoneOffset(value: unknown): boolean {
  return typeof value === 'string' && TZ_SUFFIX_RE.test(value.trim());
}

export function isDateOnly(value: unknown): boolean {
  return typeof value === 'string' && DATE_ONLY_RE.test(value.trim());
}

export function parseTimezoneAware(value: unknown, errorKey = 'DATETIME_MUST_INCLUDE_TIMEZONE'): Date {
  if (!hasTimezoneOffset(value)) throw validationError(errorKey);
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw validationError(errorKey);
  return parsed;
}

export function parseOptionalTimezoneAware(
  value: unknown,
  errorKey = 'DATETIME_MUST_INCLUDE_TIMEZONE',
): Date | null {
  if (value === undefined || value === null || value === '') return null;
  return parseTimezoneAware(value, errorKey);
}

export function parseJordanDateOnly(
  value: unknown,
  errorKey = 'DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD',
): Date {
  if (!isDateOnly(value)) throw validationError(errorKey);
  const parsed = new Date(`${String(value).trim()}T00:00:00${JORDAN_OFFSET}`);
  if (Number.isNaN(parsed.getTime())) throw validationError(errorKey);
  return parsed;
}

export function parseJordanDayStart(value: unknown): Date {
  if (isDateOnly(value)) return parseJordanDateOnly(value);
  return parseTimezoneAware(value);
}

export function parseJordanDateOrInstant(
  value: unknown,
  errorKey = 'DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD',
): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (isDateOnly(value)) return parseJordanDateOnly(value, errorKey);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value);
  return parseTimezoneAware(value, errorKey);
}

export { jordanDateOnly };
