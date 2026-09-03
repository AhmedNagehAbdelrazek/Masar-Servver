"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizePayload = localizePayload;
exports.successResponse = successResponse;
exports.envelopeResponse = envelopeResponse;
exports.paginatedResponse = paginatedResponse;
const messages_1 = require("../config/messages");
const i18n_1 = require("./i18n");
function isPlainObject(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value)
        && (value.constructor === Object || value.constructor == null);
}
/**
 * Recursively replace any `message` field whose value is an exact catalog
 * key. Returns the SAME reference when nothing matched, so large payloads
 * and non-plain values (Dates, models, Buffers) pass through untouched.
 */
function localizePayload(value, mode, seen = new Set()) {
    if (Array.isArray(value)) {
        if (seen.has(value))
            return value;
        seen.add(value);
        let changed = false;
        const out = value.map((item) => {
            const next = localizePayload(item, mode, seen);
            if (next !== item)
                changed = true;
            return next;
        });
        return (changed ? out : value);
    }
    if (!isPlainObject(value))
        return value;
    if (seen.has(value))
        return value;
    seen.add(value);
    let changed = false;
    const out = {};
    const obj = value;
    for (const [key, val] of Object.entries(obj)) {
        if (key === 'message' && typeof val === 'string' && messages_1.MESSAGES[val]) {
            Object.assign(out, (0, i18n_1.shape)(val, null, mode));
            changed = true;
        }
        else {
            const next = localizePayload(val, mode, seen);
            if (next !== val)
                changed = true;
            out[key] = next;
        }
    }
    return (changed ? out : value);
}
function successResponse(res, data, statusCode = 200) {
    const mode = (0, i18n_1.modeFor)(res.req);
    return res.status(statusCode).json(localizePayload(data, mode));
}
function envelopeResponse(res, data, statusCode = 200) {
    const mode = (0, i18n_1.modeFor)(res.req);
    return res.status(statusCode).json({ status: 'success', data: localizePayload(data, mode) });
}
function paginatedResponse(res, data, meta) {
    return res.status(200).json({
        data,
        meta,
    });
}
//# sourceMappingURL=httpResponse.js.map