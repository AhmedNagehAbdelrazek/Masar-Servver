import { MESSAGES } from '../config/messages';
import { shape, modeFor } from './i18n';
import type { Request, Response } from 'express';
import type { LocaleMode } from './i18n';

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    && ((value as Record<string, unknown>).constructor === Object || (value as Record<string, unknown>).constructor == null);
}

/**
 * Recursively replace any `message` field whose value is an exact catalog
 * key. Returns the SAME reference when nothing matched, so large payloads
 * and non-plain values (Dates, models, Buffers) pass through untouched.
 */
export function localizePayload<T>(value: T, mode: LocaleMode, seen: Set<unknown> = new Set<unknown>()): T {
  if (Array.isArray(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    let changed = false;
    const out = (value as unknown[]).map((item: unknown) => {
      const next: unknown = localizePayload(item as T, mode, seen);
      if (next !== item) changed = true;
      return next;
    });
    return (changed ? out : value) as unknown as T;
  }

  if (!isPlainObject(value as unknown)) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  let changed = false;
  const out: PlainObject = {};
  const obj = value as PlainObject;
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'message' && typeof val === 'string' && (MESSAGES as Record<string, unknown>)[val]) {
      Object.assign(out, shape(val, null, mode));
      changed = true;
    } else {
      const next: unknown = localizePayload(val as unknown, mode, seen);
      if (next !== val) changed = true;
      out[key] = next as unknown;
    }
  }
  return (changed ? out : value) as unknown as T;
}

export type ResponseWithReq = Response & { req?: Request };

export function successResponse(res: Response, data: unknown, statusCode = 200): Response {
  const mode: LocaleMode = modeFor((res as ResponseWithReq).req as unknown as Parameters<typeof modeFor>[0]);
  return res.status(statusCode).json(localizePayload(data, mode));
}

export function envelopeResponse(res: Response, data: unknown, statusCode = 200): Response {
  const mode: LocaleMode = modeFor((res as ResponseWithReq).req as unknown as Parameters<typeof modeFor>[0]);
  return res.status(statusCode).json({ status: 'success', data: localizePayload(data, mode) });
}

export function paginatedResponse(res: Response, data: unknown, meta: unknown): Response {
  return res.status(200).json({
    data,
    meta,
  });
}
