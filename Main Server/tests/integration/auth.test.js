const { getAgent, getRedisStore } = require('../setup/setup');
const { User } = require('../../Models');

const PHONE = '+962791234567';
const COUNTRY_CODE = 'JO';
const ROLE = 'driver';
const PASSWORD = 'Test@1234';

let registrationToken;
let accessToken;
let refreshToken;

beforeEach(async () => {
  await User.destroy({ where: { phone: PHONE }, force: true });
});

describe('Auth Flow - Registration', () => {
  describe('POST /api/auth/register/phone', () => {
    it('should send OTP for valid phone and country code', async () => {
      const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/OTP sent/i);
    });

    it('should reject if country_code is missing', async () => {
      const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ phone: '791234567', role: ROLE });

      expect(res.status).toBe(422);
    });

    it('should reject if country_code is invalid', async () => {
      const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: 'XX', phone: '791234567', role: ROLE });

      expect(res.status).toBe(422);
    });

    it('should reject if phone length is wrong for country', async () => {
      const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: '123', role: ROLE });

      expect(res.status).toBe(422);
    });

    it('should reject if role is not passenger or driver', async () => {
      const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: '791234567', role: 'admin' });

      expect(res.status).toBe(422);
    });

    it('should reject duplicate phone number', async () => {
      await User.create({
        phone: PHONE,
        countryCode: COUNTRY_CODE,
        role: ROLE,
        passwordHash: 'hashed',
      });

      const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/register/verify-otp', () => {
    beforeEach(async () => {
      await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });
    });

    it('should verify OTP and return registration token', async () => {
      const store = getRedisStore();
      const otpKey = `otp:${PHONE}`;
      const storedOTP = store.get(otpKey);

      const res = await getAgent()
        .post('/api/auth/register/verify-otp')
        .send({ phone: PHONE, otp: storedOTP });

      expect(res.status).toBe(201);
      expect(res.body.registration_token).toBeDefined();
      expect(res.body.phone).toBe(PHONE);
      registrationToken = res.body.registration_token;
    });

    it('should reject invalid OTP', async () => {
      const res = await getAgent()
        .post('/api/auth/register/verify-otp')
        .send({ phone: PHONE, otp: '000000' });

      expect(res.status).toBe(400);
    });

    it('should reject when OTP not found (expired)', async () => {
      const res = await getAgent()
        .post('/api/auth/register/verify-otp')
        .send({ phone: '+962799999999', otp: '123456' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/register/password', () => {
    beforeEach(async () => {
      await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

      const store = getRedisStore();
      const otpKey = `otp:${PHONE}`;
      const storedOTP = store.get(otpKey);

      const verifyRes = await getAgent()
        .post('/api/auth/register/verify-otp')
        .send({ phone: PHONE, otp: storedOTP });

      registrationToken = verifyRes.body.registration_token;
    });

    it('should create password and return tokens', async () => {
      const res = await getAgent()
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
      expect(res.body.user.phone).toBe(PHONE);
      expect(res.body.user.countryCode).toBe(COUNTRY_CODE);
      expect(res.body.user.role).toBe(ROLE);

      accessToken = res.body.access_token;
      refreshToken = res.body.refresh_token;
    });

    it('should reject if passwords do not match', async () => {
      const res = await getAgent()
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: 'Wrong@1234' });

      expect(res.status).toBe(422);
    });

    it('should reject weak password', async () => {
      const res = await getAgent()
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: 'weak', confirmPassword: 'weak' });

      expect(res.status).toBe(422);
    });

    it('should reject if token is already used', async () => {
      await getAgent()
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });

      const res = await getAgent()
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${registrationToken}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });

      expect(res.status).toBe(401);
    });
  });
});

describe('Auth Flow - Login', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/register/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    const passRes = await getAgent()
      .post('/api/auth/register/password')
      .set('Authorization', `Bearer ${verifyRes.body.registration_token}`)
      .send({ password: PASSWORD, confirmPassword: PASSWORD });

    accessToken = passRes.body.access_token;
    refreshToken = passRes.body.refresh_token;
  });

  it('should login with correct credentials', async () => {
    const res = await getAgent()
      .post('/api/auth/login')
      .send({ phone: PHONE, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.user.phone).toBe(PHONE);
    expect(res.body.user.countryCode).toBe(COUNTRY_CODE);
  });

  it('should reject wrong password', async () => {
    const res = await getAgent()
      .post('/api/auth/login')
      .send({ phone: PHONE, password: 'Wrong@1234' });

    expect(res.status).toBe(401);
  });

  it('should reject non-existent phone', async () => {
    const res = await getAgent()
      .post('/api/auth/login')
      .send({ phone: '+962799999999', password: PASSWORD });

    expect(res.status).toBe(401);
  });
});

describe('Auth Flow - Token Refresh', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/register/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    const passRes = await getAgent()
      .post('/api/auth/register/password')
      .set('Authorization', `Bearer ${verifyRes.body.registration_token}`)
      .send({ password: PASSWORD, confirmPassword: PASSWORD });

    accessToken = passRes.body.access_token;
    refreshToken = passRes.body.refresh_token;
  });

  it('should refresh tokens', async () => {
    const res = await getAgent()
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    expect(res.body.refresh_token).toBeDefined();
    expect(res.body.refresh_token).not.toBe(refreshToken);
  });

  it('should reject revoked refresh token', async () => {
    await getAgent()
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken });

    const res = await getAgent()
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(401);
  });
});

describe('Auth Flow - Me', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/register/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    const passRes = await getAgent()
      .post('/api/auth/register/password')
      .set('Authorization', `Bearer ${verifyRes.body.registration_token}`)
      .send({ password: PASSWORD, confirmPassword: PASSWORD });

    accessToken = passRes.body.access_token;
  });

  it('should return current user profile', async () => {
    const res = await getAgent()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe(PHONE);
    expect(res.body.countryCode).toBe(COUNTRY_CODE);
    expect(res.body.role).toBe(ROLE);
  });

  it('should reject without token', async () => {
    const res = await getAgent().get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Auth Flow - Logout', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/register/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    const passRes = await getAgent()
      .post('/api/auth/register/password')
      .set('Authorization', `Bearer ${verifyRes.body.registration_token}`)
      .send({ password: PASSWORD, confirmPassword: PASSWORD });

    accessToken = passRes.body.access_token;
    refreshToken = passRes.body.refresh_token;
  });

  it('should logout and revoke refresh token', async () => {
    const res = await getAgent()
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refresh_token: refreshToken });

    expect(res.status).toBe(200);

    const refreshRes = await getAgent()
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});

describe('Auth Flow - Forgot Password', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/register/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    await getAgent()
      .post('/api/auth/register/password')
      .set('Authorization', `Bearer ${verifyRes.body.registration_token}`)
      .send({ password: PASSWORD, confirmPassword: PASSWORD });
  });

  it('should send forgot password OTP', async () => {
    const res = await getAgent()
      .post('/api/auth/forgot-password')
      .send({ phone: PHONE });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/OTP/i);
  });

  it('should verify forgot password OTP and return reset token', async () => {
    await getAgent()
      .post('/api/auth/forgot-password')
      .send({ phone: PHONE });

    const store = getRedisStore();
    const otpKey = `otp_reset:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const res = await getAgent()
      .post('/api/auth/forgot-password/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    expect(res.status).toBe(200);
    expect(res.body.reset_token).toBeDefined();
  });

  it('should reset password with reset token', async () => {
    await getAgent()
      .post('/api/auth/forgot-password')
      .send({ phone: PHONE });

    const store = getRedisStore();
    const otpKey = `otp_reset:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/forgot-password/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    const NEW_PASSWORD = 'NewPass@1234';
    const resetRes = await getAgent()
      .post('/api/auth/forgot-password/reset')
      .set('Authorization', `Bearer ${verifyRes.body.reset_token}`)
      .send({ password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD });

    expect(resetRes.status).toBe(200);

    // Old password should not work
    const loginRes = await getAgent()
      .post('/api/auth/login')
      .send({ phone: PHONE, password: PASSWORD });

    expect(loginRes.status).toBe(401);

    // New password should work
    const loginRes2 = await getAgent()
      .post('/api/auth/login')
      .send({ phone: PHONE, password: NEW_PASSWORD });

    expect(loginRes2.status).toBe(200);
  });
});

describe('Auth Flow - Resend OTP', () => {
  it('should resend registration OTP', async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const res = await getAgent()
      .post('/api/auth/resend-otp')
      .send({ phone: PHONE, purpose: 'register' });

    expect(res.status).toBe(200);

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    expect(store.has(otpKey)).toBe(true);
  });

  it('should resend forgot password OTP', async () => {
    await getAgent()
      .post('/api/auth/register/phone')
      .send({ country_code: COUNTRY_CODE, phone: '791234567', role: ROLE });

    const store = getRedisStore();
    const otpKey = `otp:${PHONE}`;
    const storedOTP = store.get(otpKey);

    const verifyRes = await getAgent()
      .post('/api/auth/register/verify-otp')
      .send({ phone: PHONE, otp: storedOTP });

    await getAgent()
      .post('/api/auth/register/password')
      .set('Authorization', `Bearer ${verifyRes.body.registration_token}`)
      .send({ password: PASSWORD, confirmPassword: PASSWORD });

    const res = await getAgent()
      .post('/api/auth/resend-otp')
      .send({ phone: PHONE, purpose: 'forgot_password' });

    expect(res.status).toBe(200);
  });
});
