// Port of Main Server/utils/sanitize.ts: minimal content hygiene shared by
// chat and moderation flows. Strips HTML/script, enforces max length, masks
// a small blocklist with asterisks.
export const MAX_MESSAGE_LENGTH = 4000;

export const BLOCKED_WORDS: readonly string[] = [
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
] as const;

export function stripHtml(input: unknown): string {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeMessage(input: unknown, maxLength = MAX_MESSAGE_LENGTH): string {
  let text: string = stripHtml(input).slice(0, maxLength);
  for (const word of BLOCKED_WORDS) {
    if (!word) continue;
    const escaped: string = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(escaped, 'gi'), '*'.repeat(word.length));
  }
  return text.trim();
}
