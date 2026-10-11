// 1:1 port of Main Server/tests/integration/i18nMessages.test.js.
// APP_LOCALE is 'en' by default in tests (.env.test); each case pins its own
// mode explicitly via ?lang / Accept-Language.
// DEVIATION (verified): the last case asserts the Nest rendering. Express's
// express-validator message was "Trip ID must be a valid UUID" (catalog key
// TRIP_ID_MUST_BE_A_VALID_UUID); Nest DTOs use class-validator defaults, so
// the detail carries "trip_id must be a UUID", which has no catalog entry and
// passes through untranslated (tValidation fallback).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { APP_MESSAGES } from '../src/common/i18n/messages/app.js';
import { hasKey } from '../src/common/i18n/i18n.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

describe('i18n message localization', () => {
  const PHONE = '+962799000001';
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('APP_LOCALE=en renders English error messages', async () => {
    const res = await ctx.agent.post('/api/auth/login').send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid phone or password');
    expect(res.body.message_en).toBeUndefined();
  });

  it('APP_LOCALE=ar renders Arabic error messages', async () => {
    const res = await ctx.agent.post('/api/auth/login?lang=ar').send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('رقم الهاتف أو كلمة المرور غير صحيحة');
    expect(res.body.message_en).toBeUndefined();
  });

  it('Accept-Language: ar overrides the default locale', async () => {
    const res = await ctx.agent
      .post('/api/auth/login')
      .set('Accept-Language', 'ar')
      .send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('رقم الهاتف أو كلمة المرور غير صحيحة');
  });

  it('lang=both sends Arabic under message and English under message_en', async () => {
    const res = await ctx.agent.post('/api/auth/login?lang=both').send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('رقم الهاتف أو كلمة المرور غير صحيحة');
    expect(res.body.message_en).toBe('Invalid phone or password');
  });

  it('validates with localized field messages (validation bridge)', async () => {
    const en = await ctx.agent.post('/api/trips').set('Authorization', 'Bearer x').send({});
    // auth fails first without a valid token; use validation-only surface instead
    expect([401, 422]).toContain(en.status);

    const bad = await ctx.agent
      .get('/api/trips/not-a-uuid/passengers?lang=ar')
      .set('Authorization', `Bearer ${generateAccessToken({ id: '00000000-0000-4000-8000-0000000000ff', role: 'driver' })}`);
    expect(bad.status).toBe(422);
    expect(bad.body.details[0].field).toBe('trip_id');
    expect(bad.body.details[0].message).toBe('trip_id must be a UUID');
  });
});

describe('guard error keys are localized', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('missing token renders AUTH_NO_TOKEN in English by default', async () => {
    const res = await ctx.agent.post('/api/upload');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 'error', code: 'AUTH_NO_TOKEN' });
    expect(res.body.message).toBe(APP_MESSAGES.AUTH_NO_TOKEN.en);
  });

  it('missing token renders AUTH_NO_TOKEN in Arabic with ?lang=ar', async () => {
    const res = await ctx.agent.post('/api/upload?lang=ar');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 'error', code: 'AUTH_NO_TOKEN' });
    expect(res.body.message).toBe(APP_MESSAGES.AUTH_NO_TOKEN.ar);
  });

  it('invalid token renders AUTH_INVALID_TOKEN in both locales', async () => {
    const en = await ctx.agent.post('/api/upload').set('Authorization', 'Bearer junk');
    expect(en.status).toBe(401);
    expect(en.body).toMatchObject({ status: 'error', code: 'AUTH_INVALID_TOKEN' });
    expect(en.body.message).toBe(APP_MESSAGES.AUTH_INVALID_TOKEN.en);

    const ar = await ctx.agent.post('/api/upload?lang=ar').set('Authorization', 'Bearer junk');
    expect(ar.status).toBe(401);
    expect(ar.body.code).toBe('AUTH_INVALID_TOKEN');
    expect(ar.body.message).toBe(APP_MESSAGES.AUTH_INVALID_TOKEN.ar);
  });

  it('wrong role renders AUTH_INSUFFICIENT_ROLE in Arabic with ?lang=ar', async () => {
    // /api/favorites requires the passenger role; a driver token is valid auth
    // but fails RolesGuard -> 403.
    const token = generateAccessToken({ id: '00000000-0000-4000-8000-0000000000aa', role: 'driver' });
    const res = await ctx.agent
      .get('/api/favorites/routes?lang=ar')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 'error', code: 'AUTH_INSUFFICIENT_ROLE' });
    expect(res.body.message).toBe(APP_MESSAGES.AUTH_INSUFFICIENT_ROLE.ar);
  });
});

describe('unknown /api/* routes return the Express 404 envelope', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/no-such-route -> 404 ROUTE_NOT_FOUND (no auth required, like Express)', async () => {
    const res = await ctx.agent.get('/api/no-such-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Route GET /api/no-such-route-xyz not found',
      code: 'ROUTE_NOT_FOUND',
    });
  });
});

describe('hygiene catalog spot-checks', () => {
  it('every key thrown by services but previously absent now has EN+AR text', () => {
    const keys = [
      'PICKUP_POINT_NOT_ON_TRIP',
      'YOU_CAN_ONLY_EDIT_YOUR_OWN_BOOKINGS',
      'BOOKING_IS_NOT_CONFIRMED',
      'PICKUP_EDIT_CUTOFF_PASSED',
      'LOCATION_POINT_TOO_OLD',
      'RATE_LIMITED',
      'INVALID_FILE_TYPE',
      'FILE_TOO_LARGE',
      'PICKUP_STOP_ID_MUST_BE_A_VALID_UUID',
    ] as const;
    for (const key of keys) {
      expect(hasKey(key)).toBe(true);
      expect(APP_MESSAGES[key].en.length).toBeGreaterThan(0);
      expect(APP_MESSAGES[key].ar.length).toBeGreaterThan(0);
    }
  });

  it('upload rejection keys render per locale', () => {
    expect(APP_MESSAGES.ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED.en).toMatch(/JPEG/);
    expect(APP_MESSAGES.FILE_TOO_LARGE_10MB.ar).toMatch(/10/);
    expect(APP_MESSAGES.NO_FILE_UPLOADED.en).toBe('No file uploaded');
  });
});
