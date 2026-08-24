const { getAgent } = require('../setup/setup');
const { User } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

// APP_LOCALE is 'en' by default in tests (see setup.js); each case here pins
// its own mode explicitly via ?lang / Accept-Language.

describe('i18n message localization', () => {
  const PHONE = '+962799000001';

  beforeEach(async () => {
    await User.destroy({ where: { phone: PHONE }, force: true });
  });

  it('APP_LOCALE=en renders English error messages', async () => {
    const res = await getAgent().post('/api/auth/login').send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid phone or password');
    expect(res.body.message_en).toBeUndefined();
  });

  it('APP_LOCALE=ar renders Arabic error messages', async () => {
    const res = await getAgent().post('/api/auth/login?lang=ar').send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('رقم الهاتف أو كلمة المرور غير صحيحة');
    expect(res.body.message_en).toBeUndefined();
  });

  it('Accept-Language: ar overrides the default locale', async () => {
    const res = await getAgent()
      .post('/api/auth/login')
      .set('Accept-Language', 'ar')
      .send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('رقم الهاتف أو كلمة المرور غير صحيحة');
  });

  it('lang=both sends Arabic under message and English under message_en', async () => {
    const res = await getAgent().post('/api/auth/login?lang=both').send({ phone: PHONE, password: 'Whatever1!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('رقم الهاتف أو كلمة المرور غير صحيحة');
    expect(res.body.message_en).toBe('Invalid phone or password');
  });

  it('validates with localized field messages (validation bridge)', async () => {
    const en = await getAgent().post('/api/trips').set('Authorization', `Bearer x`).send({});
    // auth fails first without a valid token; use validation-only surface instead
    expect([401, 422]).toContain(en.status);

    const bad = await getAgent()
      .get('/api/trips/not-a-uuid/passengers?lang=ar')
      .set('Authorization', `Bearer ${generateAccessToken({ id: '00000000-0000-4000-8000-0000000000ff', role: 'driver' })}`);
    expect(bad.status).toBe(422);
    expect(bad.body.details[0].message).toBe('معرف الرحلة يجب أن يكون معرّفاً فورياً صالحاً');
  });
});
