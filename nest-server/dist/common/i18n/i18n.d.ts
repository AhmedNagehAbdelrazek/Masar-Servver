export type LocaleMode = 'ar' | 'en' | 'both';
export type MessageParams = Record<string, unknown> | null | undefined;
export declare function fill(text: string, params: MessageParams): string;
export declare function hasKey(key: string): boolean;
export declare function shape(key: string, params: MessageParams, mode: LocaleMode): {
    message: string;
} | {
    message: string;
    message_en: string;
};
export declare function tValidation(text: string, mode: LocaleMode): string;
export interface ValidationDetail {
    field: string;
    message: string;
    value?: unknown;
}
export declare function localizeDetail(detail: ValidationDetail, mode: LocaleMode): ValidationDetail;
export declare function localizePayload<T>(value: T, mode: LocaleMode): T;
