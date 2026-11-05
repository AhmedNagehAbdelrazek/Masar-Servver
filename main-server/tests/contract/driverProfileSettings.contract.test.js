const { getAgent } = require('../setup/setup');
const { User } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = 'dd100000-0000-4000-8000-000000000001';
const DRIVER_PHONE = '+962795554001';

let driverToken;

beforeEach(async () => {
  await User.destroy({ where: { phone: DRIVER_PHONE }, force: true });
  await User.create({
    id: DRIVER_ID,
    fullName: 'Contract Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: false,
  });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

afterEach(async () => {
  await User.destroy({ where: { phone: DRIVER_PHONE }, force: true });
});

describe('GET /api/driver/profile/full response contract', () => {
  it('exposes exactly the documented top-level sections', async () => {
    const res = await getAgent()
      .get('/api/driver/profile/full')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(
      ['driver', 'menu_items', 'stats', 'subscription', 'vehicle'].sort()
    );

    expect(Object.keys(res.body.driver).sort()).toEqual([
      'age', 'display_name', 'email', 'full_name', 'gender',
      'id', 'is_verified', 'joined_at', 'member_since', 'national_id',
      'phone', 'profile_picture_url', 'verification_status',
    ].sort());

    expect(Object.keys(res.body.stats).sort()).toEqual([
      'average_rating', 'badges', 'no_show_rate', 'punctuality_rate',
      'response_rate', 'total_ratings', 'total_trips_completed',
    ].sort());

    for (const item of res.body.menu_items) {
      expect(typeof item.key).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.icon).toBe('string');
    }
  });
});

describe('GET /api/driver/personal-data response contract', () => {
  it('exposes personal_data, vehicle, field maps', async () => {
    const res = await getAgent()
      .get('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.editable_now)).toBe(true);
    expect(Array.isArray(res.body.locked_fields)).toBe(true);
    expect(Array.isArray(res.body.rejected_fields)).toBe(true);

    const pd = res.body.personal_data;
    for (const key of ['full_name', 'display_name', 'country_code', 'phone', 'email',
      'email_verified', 'age', 'gender', 'gender_label', 'avatar_url', 'national_id']) {
      expect(pd).toHaveProperty(key);
    }
    expect(pd.email_verified).toBe(false);
  });
});

describe('GET /api/settings/notifications/grouped response contract', () => {
  it('exposes master_switch + categories with typed entries', async () => {
    const res = await getAgent()
      .get('/api/settings/notifications/grouped')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.master_switch).toBe('boolean');
    for (const category of res.body.categories) {
      expect(typeof category.key).toBe('string');
      expect(category.label).toHaveProperty('ar');
      expect(category.label).toHaveProperty('en');
      for (const t of category.types) {
        expect(t.label).toHaveProperty('ar');
        expect(t.label).toHaveProperty('en');
        expect(typeof t.enabled_in_app).toBe('boolean');
        expect(typeof t.enabled_push).toBe('boolean');
      }
    }
  });

  it('rejects sending both master_switch and updates with 422', async () => {
    const res = await getAgent()
      .put('/api/settings/notifications/grouped')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        master_switch: true,
        updates: [{ type: 'trip_reminder', channel: 'push', enabled: false }],
      });
    expect(res.status).toBe(422);
  });
});

describe('Error-code contracts (spec 010)', () => {
  it('change-password returns INVALID_CURRENT_PASSWORD shape', async () => {
    const res = await getAgent()
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ current_password: 'Nope@1234', new_password: 'Whatever@1' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    expect(typeof res.body.message).toBe('string');
  });

  it('delete-account cancel returns NO_PENDING_DELETION_REQUEST shape', async () => {
    const res = await getAgent()
      .post('/api/driver/delete-account/cancel')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('NO_PENDING_DELETION_REQUEST');
  });

  it('delete-account without confirmation returns validation error', async () => {
    const res = await getAgent()
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});

    expect([400, 422]).toContain(res.status);
    expect(res.body.status).toBe('error');
  });

  it('ratings rejects an invalid sort value with 422', async () => {
    const res = await getAgent()
      .get('/api/driver/ratings?sort=bogus')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(422);
  });

  it('grouped settings rejects unknown notification types with 422', async () => {
    const res = await getAgent()
      .put('/api/settings/notifications/grouped')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ updates: [{ type: 'not_a_type', channel: 'push', enabled: false }] });
    expect(res.status).toBe(422);
  });
});
