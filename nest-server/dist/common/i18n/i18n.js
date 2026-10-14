import { APP_MESSAGES } from './messages/app.js';
import { VALIDATION_MESSAGES } from './messages/validation.js';
const CATALOG = APP_MESSAGES;
const VALIDATION_CATALOG = VALIDATION_MESSAGES;
export function fill(text, params) {
    if (!params || !text.includes('{'))
        return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => params[name] != null ? String(params[name]) : match);
}
export function hasKey(key) {
    return Object.prototype.hasOwnProperty.call(CATALOG, key);
}
export function shape(key, params, mode) {
    const entry = CATALOG[key];
    const en = entry ? fill(entry.en ?? key, params) : String(key);
    if (mode === 'en')
        return { message: en };
    if (mode === 'both') {
        const ar = entry ? fill(entry.ar ?? en, params) : en;
        return { message: ar, message_en: en };
    }
    return { message: entry ? fill(entry.ar ?? en, params) : en };
}
export function tValidation(text, mode) {
    const entry = VALIDATION_CATALOG[text];
    if (!entry)
        return text;
    return entry[mode] ?? entry.en;
}
export function localizeDetail(detail, mode) {
    if (typeof detail.message === 'string') {
        return { ...detail, message: tValidation(detail.message, mode) };
    }
    return detail;
}
export function localizePayload(value, mode) {
    if (Array.isArray(value)) {
        let changed = false;
        const out = value.map((item) => {
            const next = localizePayload(item, mode);
            if (next !== item)
                changed = true;
            return next;
        });
        return (changed ? out : value);
    }
    if (value === null || typeof value !== 'object')
        return value;
    const obj = value;
    if (Object.getPrototypeOf(obj) !== Object.prototype && Object.getPrototypeOf(obj) !== null) {
        return value;
    }
    let changed = false;
    const out = {};
    for (const [key, val] of Object.entries(obj)) {
        if (key === 'message' && typeof val === 'string' && hasKey(val)) {
            Object.assign(out, shape(val, null, mode));
            changed = true;
        }
        else {
            const next = localizePayload(val, mode);
            if (next !== val)
                changed = true;
            out[key] = next;
        }
    }
    return (changed ? out : value);
}
//# sourceMappingURL=i18n.js.map