// 1:1 port of Main Server/tests/integration/auth.test.js (Wave 2.2).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const PHONE = '+962791234567';
const COUNTRY_CODE = 'JO';
const ROLE = 'driver';
const PASSWORD = 'Test@1234';

const PASSENGER_PHONE = '+962791234568';
const PASSENGER_PASSWORD = 'Pass@1234';

async function registerPhone(
  ctx: TestContext,
  phone: string,
  role: string,
  countryCode = COUNTRY_CODE,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await ctx.agent
    .post('/api/auth/register/phone')
    .send({ country_code: countryCode, phone, role });
  return { status: res.status, body: res.body as Record<string, unknown> };
}

async function getStoredOtp(ctx: TestContext, phone: string): Promise<string | null> {
  return ctx.redis.get(`otp:${phone}`);
}

describe('Auth Flow - Registration', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
  });

  it('sends OTP for valid phone and country code', async () => {
    const res = await ctx.agent
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/OTP sent/i);
  });

  it('rejects missing country_code', async () => {
    const res = await ctx.agent
      .post('/api/auth/register/phone')
      .send({ phone: '791234567', role: ROLE });
    expect(res.status).toBe(422);
  });

  it('rejects invalid country_code', async () => {
    const res = await ctx.agent
      .post('/api/auth/register/phone')
      .send({ country_code: 'XX', phone: '791234567', role: ROLE });
    expect(res.status).toBe(422);
  });

  it('rejects wrong phone length for country', async () => {
    const res = await ctx.agent
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '123', role: ROLE });
    expect(res.status).toBe(422);
  });

  it('rejects non passenger/driver role', async () => {
    const res = await ctx.agent
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: 'admin' });
    expect(res.status).toBe(422);
  });

  it('rejects duplicate phone number', async () => {
    await ctx.prisma.user.create({
      data: { phone: PHONE, countryCode: COUNTRY_CODE, role: ROLE, passwordHash: 'hashed' },
    });

    const res = await ctx.agent
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });
    expect(res.status).toBe(409);
  });

  describe('POST /api/auth/register/verify-otp', () => {
    beforeEach(async () => {
      await registerPhone(ctx, '791234567', ROLE);
    });

    it('verifies OTP and returns registration token', async () => {
      const storedOTP = await getStoredOtp(ctx, PHONE);
      const res = await ctx.agent
        .post('/api/auth/register/verify-otp')
        .send({ phone: PHONE, otp: storedOTP });

      expect(res.status).toBe(201);
      expect(res.body.registration_token).toBeDefined();
      expect(res.body.phone).toBe(PHONE);
    });

    it('rejects invalid OTP', async () => {
      const res = await ctx.agent
        .post('/api/auth/register/verify-otp')
        .send({ phone: PHONE, otp: '000001' });
      expect(res.status).toBe(400);
    });

    it('rejects when OTP not found (expired)', async () => {
      const res = await ctx.agent
        .post('/api/auth/register/verify-otp')
        .send({ phone: '+962799999999', otp: '123456' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register/password', () => {
    let registrationToken: string;

    beforeEach(async () => {
      await registerPhone(ctx, '791234567', ROLE);
      const storedOTP = await getStoredOtp(ctx, PHONE);
      const verifyRes = await ctx.agent
        .post('/api/auth/register/verify-otp')
        .send({ phone: PHONE, otp: storedOTP });
      registrationToken = verifyRes.body.registration_token as string;
    });

    it('creates password and returns tokens', async () => {
      const res = await ctx.agent
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
      expect(res.body.user.phone).toBe(PHONE);
      expect(res.body.user.countryCode).toBe(COUNTRY_CODE);
      expect(res.body.user.role).toBe(ROLE);
    });

    it('rejects mismatched passwords', async () => {
      const res = await ctx.agent
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: 'Wrong@1234' });
      expect(res.status).toBe(422);
    });

    it('rejects weak password', async () => {
      const res = await ctx.agent
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: 'weak', confirmPassword: 'weak' });
      expect(res.status).toBe(422);
    });

    it('rejects already-used token', async () => {
      await ctx.agent
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });

      const res = await ctx.agent
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });
      expect(res.status).toBe(401);
    });
  });
});

async function fullRegister(
  ctx: TestContext,
  localPhone: string,
  role: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; fullPhone: string }> {
  await registerPhone(ctx, localPhone, role);
  const fullPhone = localPhone.startsWith('+') ? localPhone : `+962${localPhone}`;
  const storedOTP = await getStoredOtp(ctx, fullPhone);
  const verifyRes = await ctx.agent
    .post('/api/auth/register/verify-otp')
    .send({ phone: fullPhone, otp: storedOTP });
  const passRes = await ctx.agent
    .post('/api/auth/register/password')
    .set('Authorization', `Bearer ${verifyRes.body.registration_token as string}`)
    .send({ password, confirmPassword: password });
  return {
    accessToken: passRes.body.access_token as string,
    refreshToken: passRes.body.refresh_token as string,
    fullPhone,
  };
}

describe('Auth Flow - Passenger profile after registration', () => {
  let ctx: TestContext;
  let passengerAccessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const reg = await fullRegister(ctx, '791234568', 'passenger', PASSENGER_PASSWORD);
    passengerAccessToken = reg.accessToken;
  });

  it('registers the passenger with placeholder profile', async () => {
    const user = await ctx.prisma.user.findFirst({ where: { phone: PASSENGER_PHONE } });
    expect(user).not.toBeNull();
    expect(user?.role).toBe('passenger');
    expect(user?.fullName).toBeNull();

    const profile = await ctx.prisma.passengerProfile.findFirst({
      where: { passengerId: user?.id ?? '' },
    });
    expect(profile).not.toBeNull();
    expect(profile?.nationalID).toBeNull();
  });

  it('fills user and passenger profile via onboarding', async () => {
    const res = await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send({
        fullname: 'Ahmad Passenger',
        national_id: '9871234567',
        age: 28,
        home_address: 'Amman, Jabal Amman',
        gender: 'male',
      });

    expect(res.status).toBe(201);
    expect(res.body.passengerProfile).toBeDefined();

    const user = await ctx.prisma.user.findFirst({ where: { phone: PASSENGER_PHONE } });
    expect(user?.fullName).toBe('Ahmad Passenger');
    expect(Number(user?.age)).toBe(28);
    expect(user?.gender).toBe('male');

    const profile = await ctx.prisma.passengerProfile.findFirst({
      where: { passengerId: user?.id ?? '' },
    });
    expect(profile?.nationalID).toBe('9871234567');
    expect(profile?.homeAddress).toBe('Amman, Jabal Amman');
  });

  it('reflects the submitted profile in GET /profile/passenger', async () => {
    await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send({
        fullname: 'Ahmad Passenger',
        national_id: '9871234567',
        age: 28,
        home_address: 'Amman, Jabal Amman',
        gender: 'male',
      });

    const fetched = await ctx.agent
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`);

    expect(fetched.status).toBe(200);
    expect(fetched.body.passenger_profile.full_name).toBe('Ahmad Passenger');
    expect(fetched.body.passenger_profile.age).toBe(28);
    expect(fetched.body.passenger_profile.gender).toBe('male');
    expect(fetched.body.passenger_profile.national_id).toBe('9871234567');
    expect(fetched.body.passenger_profile.home_address).toBe('Amman, Jabal Amman');
  });

  it('rejects onboarding when a field is missing', async () => {
    const res = await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send({ fullname: 'Ahmad Passenger', national_id: '9871234567', age: 28, gender: 'male' });
    expect(res.status).toBe(422);
  });

  it('rejects onboarding with invalid gender', async () => {
    const res = await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send({
        fullname: 'Ahmad Passenger',
        national_id: '9871234567',
        age: 28,
        home_address: 'Amman, Jabal Amman',
        gender: 'other',
      });
    expect(res.status).toBe(422);
  });

  it('rejects onboarding with invalid age', async () => {
    const res = await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send({
        fullname: 'Ahmad Passenger',
        national_id: '9871234567',
        age: 10,
        home_address: 'Amman, Jabal Amman',
        gender: 'male',
      });
    expect(res.status).toBe(422);
  });

  it('rejects a second submission once the profile is filled', async () => {
    const body = {
      fullname: 'Ahmad Passenger',
      national_id: '9871234567',
      age: 28,
      home_address: 'Amman, Jabal Amman',
      gender: 'male',
    };
    await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send(body);

    const res = await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerAccessToken}`)
      .send({ ...body, national_id: '1112223334', age: 29, home_address: 'Amman, Downtown' });
    expect(res.status).toBe(409);
  });
});

describe('Auth Flow - Login / Refresh / Me / Logout', () => {
  let ctx: TestContext;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const reg = await fullRegister(ctx, '791234567', ROLE, PASSWORD);
    accessToken = reg.accessToken;
    refreshToken = reg.refreshToken;
  });

  it('logs in with correct credentials', async () => {
    const res = await ctx.agent.post('/api/auth/login').send({ phone: PHONE, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.user.phone).toBe(PHONE);
    expect(res.body.user.countryCode).toBe(COUNTRY_CODE);
  });

  it('rejects wrong password', async () => {
    const res = await ctx.agent
      .post('/api/auth/login')
      .send({ phone: PHONE, password: 'Wrong@1234' });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent phone', async () => {
    const res = await ctx.agent
      .post('/api/auth/login')
      .send({ phone: '+962799999999', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('refreshes tokens', async () => {
    const res = await ctx.agent.post('/api/auth/refresh').send({ refresh_token: refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.refresh_token).not.toBe(refreshToken);
  });

  it('rejects revoked refresh token', async () => {
    await ctx.agent.post('/api/auth/refresh').send({ refresh_token: refreshToken });
    const res = await ctx.agent.post('/api/auth/refresh').send({ refresh_token: refreshToken });
    expect(res.status).toBe(401);
  });

  it('returns current user profile', async () => {
    const res = await ctx.agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe(PHONE);
    expect(res.body.countryCode).toBe(COUNTRY_CODE);
    expect(res.body.role).toBe(ROLE);
  });

  it('rejects me without token', async () => {
    const res = await ctx.agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logs out and revokes refresh token', async () => {
    const res = await ctx.agent
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refresh_token: refreshToken });
    expect(res.status).toBe(200);

    const refreshRes = await ctx.agent
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});

describe('Auth Flow - Forgot Password / Resend OTP', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await fullRegister(ctx, '791234567', ROLE, PASSWORD);
  });

  it('sends forgot password OTP', async () => {
    const res = await ctx.agent.post('/api/auth/forgot-password').send({ phone: PHONE });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/OTP/i);
  });

  it('verifies forgot password OTP and returns reset token', async () => {
    await ctx.agent.post('/api/auth/forgot-password').send({ phone: PHONE });
    const storedOTP = await ctx.redis.get(`otp_reset:${PHONE}`);

    const res = await ctx.agent
      .post('/api/auth/forgot-password/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });
    expect(res.status).toBe(200);
    expect(res.body.reset_token).toBeDefined();
  });

  it('resets password with reset token', async () => {
    await ctx.agent.post('/api/auth/forgot-password').send({ phone: PHONE });
    const storedOTP = await ctx.redis.get(`otp_reset:${PHONE}`);
    const verifyRes = await ctx.agent
      .post('/api/auth/forgot-password/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    const NEW_PASSWORD = 'NewPass@1234';
    const resetRes = await ctx.agent
      .post('/api/auth/forgot-password/reset')
      .set('Authorization', `Bearer ${verifyRes.body.reset_token as string}`)
      .send({ password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });
    expect(resetRes.status).toBe(200);

    const loginRes = await ctx.agent
      .post('/api/auth/login')
      .send({ phone: PHONE, password: PASSWORD });
    expect(loginRes.status).toBe(401);

    const loginRes2 = await ctx.agent
      .post('/api/auth/login')
      .send({ phone: PHONE, password: NEW_PASSWORD });
    expect(loginRes2.status).toBe(200);
  });

  it('resends registration OTP', async () => {
    await registerPhone(ctx, '791234569', ROLE);
    const res = await ctx.agent
      .post('/api/auth/resend-otp')
      .send({ phone: '+962791234569', purpose: 'register' });
    expect(res.status).toBe(200);
    expect(await ctx.redis.exists('otp:+962791234569')).toBe(1);
  });

  it('resends forgot password OTP', async () => {
    await fullRegister(ctx, '791234569', ROLE, PASSWORD);
    const res = await ctx.agent
      .post('/api/auth/resend-otp')
      .send({ phone: '+962791234569', purpose: 'forgot_password' });
    expect(res.status).toBe(200);
  });
});

describe('Auth Flow - Change password', () => {
  let ctx: TestContext;
  let accessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const reg = await fullRegister(ctx, '791234567', ROLE, PASSWORD);
    accessToken = reg.accessToken;
  });

  it('changes password and forces relogin', async () => {
    const res = await ctx.agent
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ current_password: PASSWORD, new_password: 'Brand@1234' });
    expect(res.status).toBe(200);
    expect(res.body.requires_relogin).toBe(true);

    const loginRes = await ctx.agent
      .post('/api/auth/login')
      .send({ phone: PHONE, password: 'Brand@1234' });
    expect(loginRes.status).toBe(200);
  });

  it('rejects wrong current password with 400', async () => {
    const res = await ctx.agent
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ current_password: 'Wrong@1234', new_password: 'Brand@1234' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
  });

  it('rejects reusing the current password with 422', async () => {
    const res = await ctx.agent
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ current_password: PASSWORD, new_password: PASSWORD });
    expect(res.status).toBe(422);
  });
});
