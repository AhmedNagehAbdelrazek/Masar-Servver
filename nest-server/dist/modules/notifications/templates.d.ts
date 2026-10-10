export interface TemplateEntry {
    title: string;
    body: string;
}
export declare const TEMPLATES: Record<string, {
    ar: TemplateEntry;
    en: TemplateEntry;
}>;
export declare function interpolate(template: string, vars?: Record<string, unknown>): string;
