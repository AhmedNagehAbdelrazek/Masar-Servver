"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redact = redact;
exports.truncateBody = truncateBody;
const SENSITIVE_KEYS = new Set([
    'password', 'password_hash', 'token', 'access_token', 'refresh_token',
    'authorization', 'otp', 'code', 'secret', 'cookie', 'session',
    'national_id', 'license_number', 'plate_number', 'code_number', 'insurance_doc',
    'document_url', 'email', 'phone', 'phone_number',
    'credit_card', 'cvv', 'ssn', 'pin',
]);
function redact(value, depth = 0) {
    if (depth > 10)
        return '[MAX_DEPTH]';
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value)) {
        return value.map((item) => redact(item, depth + 1));
    }
    if (typeof value === 'object') {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            const lower = key.toLowerCase();
            if (SENSITIVE_KEYS.has(lower)) {
                result[key] = '[REDACTED]';
            }
            else {
                result[key] = redact(val, depth + 1);
            }
        }
        return result;
    }
    return value;
}
function truncateBody(body, maxSize = 50 * 1024) {
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    if (str.length <= maxSize)
        return body;
    return { _truncated: true, _size: str.length, _preview: str.substring(0, 500) };
}
//# sourceMappingURL=redact.js.map