// 1:1 port of Main Server/tests/integration/passengerProfiles.test.js and
// tests/integration/passengerAccountSummary.test.js (Wave 2.3).
// passengerHome tests need homeService — Wave 4.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const PASSENGER_ID = 'fb000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'fb000000-0000-4000-8000-000000000002';
const PASSENGER_PHONE = '+962795131101';
const DRIVER_PHONE = '+962795131102';

const SUMMARY_PASSENGER_ID = 'fb000000-0000-4000-8000-000000000003';
const OTHER_USER_ID = 'fb000000-0000-4000-8000-000000000004';
const SUMMARY_PHONE = '+962795131103';
const OTHER_PHONE = '+962795131104';

describe('US8 - passenger profile', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Profile Passenger',
        phone: PASSENGER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Profile Driver',
        phone: DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('returns personal data and lazily creates a profile on first GET', async () => {
    const res = await ctx.agent
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.full_name).toBe('Profile Passenger');
    expect(res.body.passenger_profile.age).toBeNull();
    expect(res.body.passenger_profile.gender).toBe('male');
    expect(res.body.passenger_profile.phone).toBe(PASSENGER_PHONE);
    expect(res.body.passenger_profile.national_id).toBeNull();
    expect(res.body.passenger_profile.home_address).toBeNull();

    const rows = await ctx.prisma.passengerProfile.findMany({
      where: { passengerId: PASSENGER_ID },
    });
    expect(rows.length).toBe(1);

    const again = await ctx.agent
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(200);
    const rowsAfter = await ctx.prisma.passengerProfile.findMany({
      where: { passengerId: PASSENGER_ID },
    });
    expect(rowsAfter.length).toBe(1);
  });

  it('returns the stored national id from the profile', async () => {
    await ctx.prisma.passengerProfile.create({
      data: { passengerId: PASSENGER_ID, nationalID: '9871234567' },
    });

    const res = await ctx.agent
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.national_id).toBe('9871234567');
  });

  it('updates and returns the home address', async () => {
    const res = await ctx.agent
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ home_address: 'Amman, Jabal Amman' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.home_address).toBe('Amman, Jabal Amman');

    const fetched = await ctx.agent
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(fetched.body.passenger_profile.home_address).toBe('Amman, Jabal Amman');
  });

  it('rejects drivers with 403', async () => {
    const res = await ctx.agent
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });

  it('updates individual fields partially', async () => {
    await ctx.agent.get('/api/profile/passenger').set('Authorization', `Bearer ${passengerToken}`);

    const res = await ctx.agent
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ preferred_gender: 'female' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.preferred_gender).toBe('female');
    expect(res.body.passenger_profile.smoking_preference).toBe('no_preference');
  });

  it('stores saved routes and emergency contacts', async () => {
    await ctx.agent.get('/api/profile/passenger').set('Authorization', `Bearer ${passengerToken}`);

    const res = await ctx.agent
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        saved_routes: [{ origin_city: 'Amman', destination_city: 'Irbid' }],
        emergency_contacts: [{ name: 'Mom', phone: '+962790000000' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.saved_routes).toEqual([
      { origin_city: 'Amman', destination_city: 'Irbid' },
    ]);
    expect(res.body.passenger_profile.emergency_contacts[0].name).toBe('Mom');

    const rows = await ctx.prisma.passengerProfile.findMany({
      where: { passengerId: PASSENGER_ID },
    });
    expect((rows[0].emergencyContacts as unknown[]).length).toBe(1);
    expect(rows[0].savedRoutes).toEqual([{ origin_city: 'Amman', destination_city: 'Irbid' }]);
  });

  it('updates the national id', async () => {
    const res = await ctx.agent
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ national_id: '9871234567' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.national_id).toBe('9871234567');

    const rows = await ctx.prisma.passengerProfile.findMany({
      where: { passengerId: PASSENGER_ID },
    });
    expect(rows[0].nationalID).toBe('9871234567');
  });

  it('validates enum fields', async () => {
    const res = await ctx.agent
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ preferred_gender: 'robot' });
    expect(res.status).toBe(422);
  });

  it('rejects empty updates', async () => {
    const res = await ctx.agent
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});
    expect(res.status).toBe(422);
  });
});

describe('US8 - passenger account summary', () => {
  let ctx: TestContext;
  let passengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: SUMMARY_PASSENGER_ID,
        fullName: 'Summary Passenger',
        phone: SUMMARY_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: OTHER_USER_ID,
        fullName: 'Other User',
        phone: OTHER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    passengerToken = generateAccessToken({ id: SUMMARY_PASSENGER_ID, role: 'passenger' });
  });

  it('returns zeroed counts when there are no penalties or complaints', async () => {
    const res = await ctx.agent
      .get('/api/profile/passenger/account-summary')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.account_summary).toEqual([
      { type: 'alerts', count: 0 },
      { type: 'violations', count: 0 },
      { type: 'sanctions', count: 0 },
      { type: 'complaints', count: 0 },
    ]);
  });

  it('aggregates penalties on the user and complaints he filed', async () => {
    await ctx.prisma.penalty.createMany({
      data: [
        { userId: SUMMARY_PASSENGER_ID, type: 'warning', reason: 'Late arrival' },
        { userId: SUMMARY_PASSENGER_ID, type: 'warning', reason: 'No-show' },
        {
          userId: SUMMARY_PASSENGER_ID,
          type: 'suspension',
          reason: 'Abuse',
          endsAt: new Date(Date.now() + 86400000),
        },
        { userId: SUMMARY_PASSENGER_ID, type: 'ban', reason: 'Fraud' },
        {
          userId: SUMMARY_PASSENGER_ID,
          type: 'warning',
          penaltyType: 'violation',
          reason: 'Unpaid fare',
        },
        {
          userId: SUMMARY_PASSENGER_ID,
          type: 'suspension',
          penaltyType: 'violation',
          reason: 'Recurring abuse',
          endsAt: new Date(Date.now() + 86400000),
        },
      ],
    });
    await ctx.prisma.penalty.create({
      data: { userId: OTHER_USER_ID, type: 'ban', reason: 'Someone else ban' },
    });
    await ctx.prisma.complaint.createMany({
      data: [
        {
          reporterId: SUMMARY_PASSENGER_ID,
          accusedId: OTHER_USER_ID,
          category: 'no_show',
          description: 'Driver never came',
        },
        {
          reporterId: SUMMARY_PASSENGER_ID,
          accusedId: OTHER_USER_ID,
          category: 'fare',
          description: 'Wrong fare charged',
        },
        {
          reporterId: OTHER_USER_ID,
          accusedId: SUMMARY_PASSENGER_ID,
          category: 'behavior',
          description: 'Filed against the passenger',
        },
      ],
    });

    const res = await ctx.agent
      .get('/api/profile/passenger/account-summary')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.account_summary).toEqual([
      { type: 'alerts', count: 3 },
      { type: 'violations', count: 2 },
      { type: 'sanctions', count: 3 },
      { type: 'complaints', count: 2 },
    ]);
  });

  it('rejects drivers', async () => {
    const driverToken = generateAccessToken({ id: OTHER_USER_ID, role: 'driver' });
    const res = await ctx.agent
      .get('/api/profile/passenger/account-summary')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });
});
