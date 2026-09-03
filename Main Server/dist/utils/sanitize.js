"use strict";
/**
 * Minimal content hygiene shared by chat and moderation flows:
 *  - strips HTML/script so message payloads cannot carry markup to clients
 *  - filters a small blocklist (replace with asterisks)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_WORDS = exports.MAX_MESSAGE_LENGTH = void 0;
exports.stripHtml = stripHtml;
exports.sanitizeMessage = sanitizeMessage;
exports.MAX_MESSAGE_LENGTH = 4000;
exports.BLOCKED_WORDS = [
    'abuse',
    'asshole',
    'bastard',
    'fuck',
    'shit',
    'bitch',
    'فاشل',
    'غبي',
    'احمق',
    'حقير',
    'قذر',
];
function stripHtml(input) {
    return String(input)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function sanitizeMessage(input, { maxLength = exports.MAX_MESSAGE_LENGTH } = {}) {
    let text = stripHtml(input).slice(0, maxLength);
    for (const word of exports.BLOCKED_WORDS) {
        if (!word)
            continue;
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escaped, 'gi'), '*'.repeat(word.length));
    }
    return text.trim();
}
const sanitize = { sanitizeMessage, stripHtml, MAX_MESSAGE_LENGTH: exports.MAX_MESSAGE_LENGTH, BLOCKED_WORDS: exports.BLOCKED_WORDS };
exports.default = sanitize;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { sanitizeMessage, stripHtml, MAX_MESSAGE_LENGTH: exports.MAX_MESSAGE_LENGTH, BLOCKED_WORDS: exports.BLOCKED_WORDS };
    // @ts-ignore
    module.exports.sanitizeMessage = sanitizeMessage;
    // @ts-ignore
    module.exports.stripHtml = stripHtml;
    // @ts-ignore
    module.exports.MAX_MESSAGE_LENGTH = exports.MAX_MESSAGE_LENGTH;
    // @ts-ignore
    module.exports.BLOCKED_WORDS = exports.BLOCKED_WORDS;
    // @ts-ignore
    module.exports.default = sanitize;
}
//# sourceMappingURL=sanitize.js.map