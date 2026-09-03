/**
 * Minimal content hygiene shared by chat and moderation flows:
 *  - strips HTML/script so message payloads cannot carry markup to clients
 *  - filters a small blocklist (replace with asterisks)
 */

export const MAX_MESSAGE_LENGTH: number = 4000;

export const BLOCKED_WORDS: readonly string[] = [
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
] as const;

export function stripHtml(input: unknown): string {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SanitizeOptions {
  maxLength?: number;
}

export function sanitizeMessage(input: unknown, { maxLength = MAX_MESSAGE_LENGTH }: SanitizeOptions = {}): string {
  let text: string = stripHtml(input).slice(0, maxLength);
  for (const word of BLOCKED_WORDS) {
    if (!word) continue;
    const escaped: string = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'gi'), '*'.repeat(word.length));
  }
  return text.trim();
}

const sanitize = { sanitizeMessage, stripHtml, MAX_MESSAGE_LENGTH, BLOCKED_WORDS };
export default sanitize;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { sanitizeMessage, stripHtml, MAX_MESSAGE_LENGTH, BLOCKED_WORDS };
  // @ts-ignore
  module.exports.sanitizeMessage = sanitizeMessage;
  // @ts-ignore
  module.exports.stripHtml = stripHtml;
  // @ts-ignore
  module.exports.MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH;
  // @ts-ignore
  module.exports.BLOCKED_WORDS = BLOCKED_WORDS;
  // @ts-ignore
  module.exports.default = sanitize;
}
