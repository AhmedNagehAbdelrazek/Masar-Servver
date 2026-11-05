export interface SocketOkResponse<T = unknown> {
  status: 'ok';
  data: T;
}

export interface SocketErrorResponse {
  status: 'error';
  code: string;
  message: string;
}

export type SocketAckResponse<T = unknown> = SocketOkResponse<T> | SocketErrorResponse;

export interface ApiErrorLike {
  code?: string | null;
  message?: string | null;
}

export function ok<T>(data: T): SocketOkResponse<T> {
  return { status: 'ok', data };
}

export function error(code: string, message: string): SocketErrorResponse {
  return { status: 'error', code, message };
}

export function errorFromApiError(err: unknown): SocketErrorResponse {
  const maybe = err as ApiErrorLike | null | undefined;
  const code: string = maybe && maybe.code ? String(maybe.code) : 'INTERNAL_ERROR';
  const message: string = maybe && maybe.message ? String(maybe.message) : 'Internal error';
  return error(code, message);
}

export function rateLimited(message = 'Rate limit exceeded'): SocketErrorResponse {
  return error('RATE_LIMITED', message);
}

/**
 * Structured error for the Socket.IO handshake middleware. The wire contract
 * exposes the stable machine `code` through `connect_error.message`, while
 * `code`/`reason` stay available server-side.
 */
export interface SocketAuthError extends Error {
  code: string;
  reason: string;
}

export function authError(code: string, reason = 'Authentication failed'): SocketAuthError {
  const err = new Error(code) as SocketAuthError;
  err.code = code;
  err.reason = reason;
  return err;
}

const socketAck = { ok, error, errorFromApiError, rateLimited, authError };
export default socketAck;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { ok, error, errorFromApiError, rateLimited, authError };
  // @ts-ignore
  module.exports.ok = ok;
  // @ts-ignore
  module.exports.error = error;
  // @ts-ignore
  module.exports.errorFromApiError = errorFromApiError;
  // @ts-ignore
  module.exports.rateLimited = rateLimited;
  // @ts-ignore
  module.exports.authError = authError;
  // @ts-ignore
  module.exports.default = socketAck;
}
