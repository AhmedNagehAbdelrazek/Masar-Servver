export declare const MAX_MESSAGE_LENGTH = 4000;
export declare const BLOCKED_WORDS: readonly string[];
export declare function stripHtml(input: unknown): string;
export declare function sanitizeMessage(input: unknown, maxLength?: number): string;
