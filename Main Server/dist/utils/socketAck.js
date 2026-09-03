"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.error = error;
exports.errorFromApiError = errorFromApiError;
exports.rateLimited = rateLimited;
exports.authError = authError;
function ok(data) {
    return { status: 'ok', data };
}
function error(code, message) {
    return { status: 'error', code, message };
}
function errorFromApiError(err) {
    const maybe = err;
    const code = maybe && maybe.code ? String(maybe.code) : 'INTERNAL_ERROR';
    const message = maybe && maybe.message ? String(maybe.message) : 'Internal error';
    return error(code, message);
}
function rateLimited(message = 'Rate limit exceeded') {
    return error('RATE_LIMITED', message);
}
function authError(code, reason = 'Authentication failed') {
    const err = new Error(code);
    err.code = code;
    err.reason = reason;
    return err;
}
const socketAck = { ok, error, errorFromApiError, rateLimited, authError };
exports.default = socketAck;
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
//# sourceMappingURL=socketAck.js.map