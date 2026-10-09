import { describe, expect, it } from 'vitest';
import { buildPagination, parsePagination } from './pagination.js';
import { resolveLocaleMode } from './locale.js';

// Port parity checks for Main Server/utils/{pagination,i18n}.ts behavior.
describe('pagination', () => {
  it('parses defaults', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('clamps limit to 100', () => {
    expect(parsePagination({ page: 2, limit: 500 })).toEqual({ page: 2, limit: 100, offset: 100 });
  });

  it('builds meta with zero totals', () => {
    expect(buildPagination(0, 1, 20)).toEqual({ page: 1, limit: 20, total: 0, total_pages: 0 });
    expect(buildPagination(41, 1, 20)).toEqual({ page: 1, limit: 20, total: 41, total_pages: 3 });
  });
});

describe('locale', () => {
  it('defaults to ar', () => {
    const prev = process.env.APP_LOCALE;
    delete process.env.APP_LOCALE;
    try {
      expect(resolveLocaleMode({})).toBe('ar');
    } finally {
      process.env.APP_LOCALE = prev;
    }
  });

  it('honors ?lang and Accept-Language', () => {
    expect(resolveLocaleMode({ query: { lang: 'en' } })).toBe('en');
    expect(resolveLocaleMode({ headers: { 'accept-language': 'en-US,en;q=0.9' } })).toBe('en');
    expect(resolveLocaleMode({ headers: { 'accept-language': 'ar-JO' } })).toBe('ar');
  });
});
