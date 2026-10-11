import { jordanDateOnly } from './jordan-time.js';
export declare function hasTimezoneOffset(value: unknown): boolean;
export declare function isDateOnly(value: unknown): boolean;
export declare function parseTimezoneAware(value: unknown, errorKey?: string): Date;
export declare function parseOptionalTimezoneAware(value: unknown, errorKey?: string): Date | null;
export declare function parseJordanDateOnly(value: unknown, errorKey?: string): Date;
export declare function parseJordanDayStart(value: unknown): Date;
export declare function parseJordanDateOrInstant(value: unknown, errorKey?: string): Date | null;
export { jordanDateOnly };
