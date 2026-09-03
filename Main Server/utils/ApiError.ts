import * as i18n from './i18n';

export type ApiErrorDetails = unknown[] | null;
export type ApiErrorParams = Record<string, unknown> | null;

export interface ApiErrorResponseBody {
  status: 'error';
  message: string;
  message_en?: string;
  code: string | null;
  details?: unknown[];
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string | null;
  public details: unknown[] | null;
  public params: Record<string, unknown> | null;
  public messageKey: string | null;
  public isOperational: boolean;

  /**
   * `message` is either a key from config/messages (preferred) or raw text.
   * `params` fills {placeholders} inside the catalog entry. The English text
   * is kept on `.message` for logs/tests; the wire format is produced by
   * toResponse(mode) per APP_LOCALE / per-request language.
   */
  constructor(
    message: string,
    statusCode: number,
    code: string | null = null,
    details: unknown[] | null = null,
    params: Record<string, unknown> | null = null,
  ) {
    super(typeof message === 'string' ? message : String(message));
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = Array.isArray(details) && details.length > 0 ? details : null;
    this.params = params || null;
    this.messageKey = message != null ? String(message) : null;
    // Keep `.message` as the English rendering for logs/tests/wire-parity;
    // localized output is produced by toResponse(mode).
    this.message = i18n.t(this.messageKey as string, params || null, 'en');
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /** English rendering (for logs, tests, and .message parity). */
  resolvedMessage(): string {
    return i18n.t(this.messageKey as string, this.params, 'en');
  }

  /** Full error body in the requested locale mode. */
  toResponse(mode: string = i18n.defaultMode()): ApiErrorResponseBody {
    return {
      status: 'error',
      ...i18n.shape(this.messageKey as string, this.params, mode as import('./i18n').LocaleMode),
      code: this.code,
      ...(this.details && { details: this.details }),
    } as ApiErrorResponseBody;
  }

  toJSON(): ApiErrorResponseBody {
    return this.toResponse(i18n.defaultMode());
  }
}

export type ApiErrorFactory = (
  message?: string,
  details?: unknown[] | null,
  params?: Record<string, unknown> | null,
) => ApiError;

export const ApiErrors: {
  badRequest: ApiErrorFactory;
  unauthorized: ApiErrorFactory;
  forbidden: ApiErrorFactory;
  notFound: ApiErrorFactory;
  conflict: ApiErrorFactory;
  validation: ApiErrorFactory;
  serverError: ApiErrorFactory;
  custom: (
    message?: string,
    statusCode?: number,
    code?: string,
    details?: unknown[] | null,
    params?: Record<string, unknown> | null,
  ) => ApiError;
} = {
  badRequest: (message = 'BAD_REQUEST', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 400, 'BAD_REQUEST', details, params),

  unauthorized: (message = 'UNAUTHORIZED', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 401, 'UNAUTHORIZED', details, params),

  forbidden: (message = 'FORBIDDEN', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 403, 'FORBIDDEN', details, params),

  notFound: (message = 'NOT_FOUND', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 404, 'NOT_FOUND', details, params),

  conflict: (message = 'CONFLICT', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 409, 'CONFLICT', details, params),

  validation: (message = 'VALIDATION_FAILED', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 422, 'VALIDATION_ERROR', details, params),

  serverError: (message = 'INTERNAL_ERROR', details: unknown[] | null = null, params: Record<string, unknown> | null = null) =>
    new ApiError(message, 500, 'INTERNAL_ERROR', details, params),

  custom: (
    message = 'INTERNAL_ERROR',
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details: unknown[] | null = null,
    params: Record<string, unknown> | null = null,
  ) => new ApiError(message, statusCode, code, details, params),
};

export default ApiError;

// CommonJS compatibility: preserve `const ApiError = require('../utils/ApiError')` and `const { ApiErrors } = require(...)`
 // @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = ApiError;
  // @ts-ignore
  module.exports.ApiErrors = ApiErrors;
  // @ts-ignore
  module.exports.ApiError = ApiError;
  // @ts-ignore
  module.exports.default = ApiError;
}
