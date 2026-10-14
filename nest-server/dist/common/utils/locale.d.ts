export type LocaleMode = 'ar' | 'en' | 'both';
export declare function resolveLocaleMode(req: {
    query?: Record<string, unknown>;
    headers?: Record<string, unknown>;
}): LocaleMode;
