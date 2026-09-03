/**
 * Locale resolution + message shaping.
 *
 * Mode comes from (first match wins):
 *   1. ?lang= en|ar|both   (or ?locale=)
 *   2. Accept-Language header (ar/en/both, or ar-*, en-*)
 *   3. APP_LOCALE env var  (default when missing/unparsable: 'ar')
 */
import { MESSAGES, VALIDATION_MESSAGES } from '../config/messages';

export type LocaleMode = 'en' | 'ar' | 'both';
type MessageParams = Record<string, unknown> | null | undefined;
type MessageEntry = { en: string; ar: string };
type ValidationEntry = { en: string; ar: string };

export const MODES: readonly LocaleMode[] = ['en', 'ar', 'both'] as const;
export const DEFAULT_MODE: LocaleMode = 'ar';

export function normalizeMode(raw: unknown): LocaleMode | null {
  if (raw == null) return null;
  const value: string = String(raw).trim().toLowerCase();
  return (MODES as readonly string[]).includes(value) ? (value as LocaleMode) : null;
}

export function defaultMode(): LocaleMode {
  return normalizeMode(process.env.APP_LOCALE) || DEFAULT_MODE;
}

export interface I18nRequest {
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

export function requestMode(req: I18nRequest | null | undefined): LocaleMode | null {
  if (!req) return null;
  const query: Record<string, unknown> = (req.query as Record<string, unknown>) || {};
  const fromQuery: LocaleMode | null = normalizeMode(query.lang) || normalizeMode(query.locale);
  if (fromQuery) return fromQuery;

  const header: unknown = req.headers && (req.headers['accept-language'] as unknown);
  if (header) {
    const first: string = String(header).split(',')[0].trim().toLowerCase();
    const exact: LocaleMode | null = normalizeMode(first);
    if (exact) return exact;
    if (first.startsWith('ar')) return 'ar';
    if (first.startsWith('en')) return 'en';
  }
  return null;
}

export function modeFor(req: I18nRequest | null | undefined): LocaleMode {
  return requestMode(req) || defaultMode();
}

/** Replace {placeholders} in a template string. */
export function fill(text: string, params: MessageParams): string {
  if (!params || !text.includes('{')) return text;
  return text.replace(/\{(\w+)\}/g, (match: string, name: string): string =>
    (params as Record<string, unknown>)[name] != null
      ? String((params as Record<string, unknown>)[name])
      : match,
  );
}

/**
 * Resolve a catalog key to its {en, ar} pair. Unknown keys fall back to the
 * raw text itself for both languages so nothing ever renders blank.
 */
export function entryFor(key: string): MessageEntry {
  const catalog = MESSAGES as Record<string, MessageEntry>;
  return catalog[key] || { en: key, ar: key };
}

/** Single-language render of a key (or raw fallback text). Null-safe on missing translations. */
export function t(key: string, params: MessageParams, mode: LocaleMode = defaultMode()): string {
  const entry: MessageEntry | Record<string, string> = entryFor(key) || {};
  const typedEntry = entry as Record<string, string | undefined>;
  return fill(typedEntry[mode] != null ? (typedEntry[mode] as string) : typedEntry.en || String(key), params);
}

export type ShapedMessage =
  | { message: string }
  | { message: string; message_en: string };

/**
 * Shaped payload fields for a response body, honouring APP_LOCALE=both by
 * sending Arabic under `message` plus English under `message_en`.
 */
export function shape(key: string, params: MessageParams, mode: LocaleMode = defaultMode()): ShapedMessage {
  const entry: MessageEntry = entryFor(key) || ({} as MessageEntry);
  const en: string = fill(entry.en != null ? entry.en : String(key), params);
  if (mode === 'en') return { message: en };
  if (mode === 'both') {
    const ar: string = fill(entry.ar != null ? entry.ar : en, params);
    return { message: ar, message_en: en };
  }
  return { message: fill(entry.ar != null ? entry.ar : en, params) };
}

/**
 * Convenience for controllers: spread into a success payload using the
 * request's resolved mode.
 *   successResponse(res, { ...result, ...localized(req, 'TRIP_STARTED') });
 */
export function localized(req: I18nRequest | null | undefined, key: string, params?: MessageParams): ShapedMessage {
  return shape(key, params ?? null, modeFor(req));
}

/**
 * Bridge for express-validator chains: translates an inline withMessage()
 * text through VALIDATION_MESSAGES (exact English-string lookup). Unknown
 * strings pass through untouched, so validators work before/without entries.
 */
export function tValidation(text: string, mode: LocaleMode = defaultMode()): string {
  const catalog = VALIDATION_MESSAGES as Record<string, ValidationEntry>;
  const entry: ValidationEntry | undefined = catalog[text];
  if (!entry) return text;
  return (entry as Record<string, string>)[mode] || entry.en;
}
