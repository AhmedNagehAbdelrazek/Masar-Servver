"use strict";
/**
 * Minimal content hygiene shared by chat and moderation flows:
 *  - strips HTML/script so message payloads cannot carry markup to clients
 *  - filters a small blocklist (replace with asterisks)
 */
const MAX_MESSAGE_LENGTH = 4000;
const BLOCKED_WORDS = [
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
function sanitizeMessage(input, { maxLength = MAX_MESSAGE_LENGTH } = {}) {
    let text = stripHtml(input).slice(0, maxLength);
    for (const word of BLOCKED_WORDS) {
        if (!word)
            continue;
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escaped, 'gi'), '*'.repeat(word.length));
    }
    return text.trim();
}
module.exports = { sanitizeMessage, stripHtml, MAX_MESSAGE_LENGTH, BLOCKED_WORDS };
//# sourceMappingURL=sanitize.js.map