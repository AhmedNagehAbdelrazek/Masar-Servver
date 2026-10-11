export const MAX_MESSAGE_LENGTH = 4000;
export const BLOCKED_WORDS = [
    'abuse',
    'asshole',
    'bastard',
    'fuck',
    'shit',
    'bitch',
    'كلب',
    'حيوان',
    'غبي',
    'حقير',
    'وسخ',
];
export function stripHtml(input) {
    return String(input)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
export function sanitizeMessage(input, maxLength = MAX_MESSAGE_LENGTH) {
    let text = stripHtml(input).slice(0, maxLength);
    for (const word of BLOCKED_WORDS) {
        if (!word)
            continue;
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escaped, 'gi'), '*'.repeat(word.length));
    }
    return text.trim();
}
//# sourceMappingURL=sanitize.js.map