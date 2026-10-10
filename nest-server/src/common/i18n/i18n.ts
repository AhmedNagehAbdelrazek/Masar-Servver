// Port of Main Server/utils/i18n.ts + utils/httpResponse.ts localizePayload.
// Catalogs are verbatim copies of config/messages/{app,validation}.ts.
import { APP_MESSAGES } from './messages/app.js';
import { VALIDATION_MESSAGES } from './messages/validation.js';

export type LocaleMode = 'ar' | 'en' | 'both';
export type MessageParams = Record<string, unknown> | null | undefined;

interface MessageEntry {
  en: string;
  ar: string;
}

const CATALOG = APP_MESSAGES as unknown as Record<string, MessageEntry>;
const VALIDATION_CATALOG = VALIDATION_MESSAGES as unknown as Record<string, MessageEntry>;

export function fill(text: string, params: MessageParams): string {
  if (!params || !text.includes('{')) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] != null ? String(params[name]) : match,
  );
}

export function hasKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(CATALOG, key);
}

export function shape(
  key: string,
  params: MessageParams,
  mode: LocaleMode,
): { message: string } | { message: string; message_en: string } {
  const entry = CATALOG[key];
  const en = entry ? fill(entry.en ?? key, params) : String(key);
  if (mode === 'en') return { message: en };
  if (mode === 'both') {
    const ar = entry ? fill(entry.ar ?? en, params) : en;
    return { message: ar, message_en: en };
  }
  return { message: entry ? fill(entry.ar ?? en, params) : en };
}

/** Translate an express-validator-style English message via the validation catalog. */
export function tValidation(text: string, mode: LocaleMode): string {
  const entry = VALIDATION_CATALOG[text] as unknown as Record<string, string> | undefined;
  if (!entry) return text;
  // Port of Express tValidation: exact-English lookup, 'both' falls back to en.
  return entry[mode] ?? entry.en;
}

export interface ValidationDetail {
  field: string;
  message: string;
  value?: unknown;
}

export function localizeDetail(detail: ValidationDetail, mode: LocaleMode): ValidationDetail {
  if (typeof detail.message === 'string') {
    return { ...detail, message: tValidation(detail.message, mode) };
  }
  return detail;
}

/** Recursively replace any `message` field whose value is a catalog key. */
export function localizePayload<T>(value: T, mode: LocaleMode): T {
  if (Array.isArray(value)) {
    let changed = false;
    const out = (value as unknown[]).map((item) => {
      const next = localizePayload(item, mode);
      if (next !== item) changed = true;
      return next;
    });
    return (changed ? out : value) as unknown as T;
  }
  if (value === null || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  if (Object.getPrototypeOf(obj) !== Object.prototype && Object.getPrototypeOf(obj) !== null) {
    return value;
  }
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'message' && typeof val === 'string' && hasKey(val)) {
      Object.assign(out, shape(val, null, mode));
      changed = true;
    } else {
      const next = localizePayload(val, mode);
      if (next !== val) changed = true;
      out[key] = next;
    }
  }
  return (changed ? out : value) as unknown as T;
}
