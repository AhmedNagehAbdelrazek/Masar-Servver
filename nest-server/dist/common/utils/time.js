import { UnprocessableEntityException } from '@nestjs/common';
import { jordanDateOnly } from './jordan-time.js';
const TZ_SUFFIX_RE = /(Z|[+-]\d{2}:?\d{2})$/;
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const JORDAN_OFFSET = '+03:00';
function validationError(key) {
    return new UnprocessableEntityException({
        message: key,
        code: 'VALIDATION_ERROR',
    });
}
export function hasTimezoneOffset(value) {
    return typeof value === 'string' && TZ_SUFFIX_RE.test(value.trim());
}
export function isDateOnly(value) {
    return typeof value === 'string' && DATE_ONLY_RE.test(value.trim());
}
export function parseTimezoneAware(value, errorKey = 'DATETIME_MUST_INCLUDE_TIMEZONE') {
    if (!hasTimezoneOffset(value))
        throw validationError(errorKey);
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime()))
        throw validationError(errorKey);
    return parsed;
}
export function parseOptionalTimezoneAware(value, errorKey = 'DATETIME_MUST_INCLUDE_TIMEZONE') {
    if (value === undefined || value === null || value === '')
        return null;
    return parseTimezoneAware(value, errorKey);
}
export function parseJordanDateOnly(value, errorKey = 'DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD') {
    if (!isDateOnly(value))
        throw validationError(errorKey);
    const parsed = new Date(`${String(value).trim()}T00:00:00${JORDAN_OFFSET}`);
    if (Number.isNaN(parsed.getTime()))
        throw validationError(errorKey);
    return parsed;
}
export function parseJordanDayStart(value) {
    if (isDateOnly(value))
        return parseJordanDateOnly(value);
    return parseTimezoneAware(value);
}
export function parseJordanDateOrInstant(value, errorKey = 'DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD') {
    if (value === undefined || value === null || value === '')
        return null;
    if (isDateOnly(value))
        return parseJordanDateOnly(value, errorKey);
    if (value instanceof Date && !Number.isNaN(value.getTime()))
        return new Date(value);
    return parseTimezoneAware(value, errorKey);
}
export { jordanDateOnly };
//# sourceMappingURL=time.js.map