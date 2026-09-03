"use strict";
/**
 * Ack helpers for socket event handlers. Acks follow the contract shape:
 * `{ status: 'ok', data }` or `{ status: 'error', code, message }`.
 */
function ok(data) {
    return { status: 'ok', data };
}
function error(code, message) {
    return { status: 'error', code, message };
}
function errorFromApiError(err) {
    const code = err && err.code ? err.code : 'INTERNAL_ERROR';
    return error(code, (err && err.message) || 'Internal error');
}
function rateLimited(message = 'Rate limit exceeded') {
    return error('RATE_LIMITED', message);
}
/**
 * Structured error for the Socket.IO handshake middleware. The wire contract
 * exposes the stable machine `code` through `connect_error.message`, while
 * `code`/`reason` stay available server-side.
 */
function authError(code, reason = 'Authentication failed') {
    const err = new Error(code);
    err.code = code;
    err.reason = reason;
    return err;
}
module.exports = { ok, error, errorFromApiError, rateLimited, authError };
//# sourceMappingURL=socketAck.js.map