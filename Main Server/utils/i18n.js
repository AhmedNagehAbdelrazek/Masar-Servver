/**
 * Locale resolution + message shaping.
 *
 * Mode comes from (first match wins):
 *   1. ?lang= en|ar|both   (or ?locale=)
 *   2. Accept-Language header (ar/en/both, or ar-*, en-*)
 *   3. APP_LOCALE env var  (default when missing/unparsable: 'ar')
 */
const { MESSAGES, VALIDATION_MESSAGES } = require('../config/messages');

const MODES = ['en', 'ar', 'both'];
const DEFAULT_MODE = 'ar';

function normalizeMode(raw) {
  if (raw == null) return null;
  const value = String(raw).trim().toLowerCase();
  return MODES.includes(value) ? value : null;
}

function defaultMode() {
  return normalizeMode(process.env.APP_LOCALE) || DEFAULT_MODE;
}

function requestMode(req) {
  if (!req) return null;
  const query = req.query || {};
  const fromQuery = normalizeMode(query.lang) || normalizeMode(query.locale);
  if (fromQuery) return fromQuery;

  const header = req.headers && req.headers['accept-language'];
  if (header) {
    const first = String(header).split(',')[0].trim().toLowerCase();
    const exact = normalizeMode(first);
    if (exact) return exact;
    if (first.startsWith('ar')) return 'ar';
    if (first.startsWith('en')) return 'en';
  }
  return null;
}

function modeFor(req) {
  return requestMode(req) || defaultMode();
}

/** Replace {placeholders} in a template string. */
function fill(text, params) {
  if (!params || !text.includes('{')) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] != null ? String(params[name]) : match
  );
}

/**
 * Resolve a catalog key to its {en, ar} pair. Unknown keys fall back to the
 * raw text itself for both languages so nothing ever renders blank.
 */
function entryFor(key) {
  return MESSAGES[key] || { en: key, ar: key };
}

/** Single-language render of a key (or raw fallback text). Null-safe on missing translations. */
function t(key, params, mode = defaultMode()) {
  const entry = entryFor(key) || {};
  return fill(entry[mode] != null ? entry[mode] : entry.en || String(key), params);
}

/**
 * Shaped payload fields for a response body, honouring APP_LOCALE=both by
 * sending Arabic under `message` plus English under `message_en`.
 */
function shape(key, params, mode = defaultMode()) {
  const entry = entryFor(key) || {};
  const en = fill(entry.en != null ? entry.en : String(key), params);
  if (mode === 'en') return { message: en };
  if (mode === 'both') {
    const ar = fill(entry.ar != null ? entry.ar : en, params);
    return { message: ar, message_en: en };
  }
  return { message: fill(entry.ar != null ? entry.ar : en, params) };
}

/**
 * Convenience for controllers: spread into a success payload using the
 * request's resolved mode.
 *   successResponse(res, { ...result, ...localized(req, 'TRIP_STARTED') });
 */
function localized(req, key, params) {
  return shape(key, params, modeFor(req));
}

/**
 * Bridge for express-validator chains: translates an inline withMessage()
 * text through VALIDATION_MESSAGES (exact English-string lookup). Unknown
 * strings pass through untouched, so validators work before/without entries.
 */
function tValidation(text, mode = defaultMode()) {
  const entry = VALIDATION_MESSAGES[text];
  if (!entry) return text;
  return entry[mode] || entry.en;
}

module.exports = {
  MODES,
  DEFAULT_MODE,
  defaultMode,
  requestMode,
  modeFor,
  fill,
  t,
  shape,
  localized,
  tValidation,
};
