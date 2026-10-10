// 1:1 port of Main Server/tests/integration/driverProfileSettings.test.js,
// integration/driverPersonalData.test.js (personal-data parts) and
// contract/driverProfileSettings.contract.test.js (Wave 3.2/3.3).
// Trips/ratings fixtures use direct Prisma rows (POST /api/trips is Wave 5).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'dd100000-0000-4000-8000-000000000001';
const RATER_ID = 'dd100000-0000-4000-8000-000000000003';
const OTHER_ID = 'dd100000-0000-4000-8000-000000000002';

function makeRef(): string {
  return 'MSR-' + randomUUID().slice(0, 7).toUpperCase();
}

async function seedDriver(
  ctx: TestContext,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  await ctx.prisma.user.create({
    data: {
      id: DRIVER_ID,
      fullName: 'Nader Driver',
      phone: '+962795552001',
      countryCode: 'JO',
      role: 'driver',
      passwordHash: 'hashed',
      isVerified: false,
      ...overrides,
    },
  });
  return generateAccessToken({ id: DRIVER_ID, role: 'driver' });
}

async function seedActiveSubscription(ctx: TestContext): Promise<void> {
  const plan = await ctx.prisma.subscriptionPlan.create({
    data: {
      name: 'Basic',
      periodDays: 30,
      percentageCut: 8,
      cost: 100,
      features: [],
      isFree: false,
      isActive: true,
    },
  });
  await ctx.prisma.driverSubscription.create({
    data: {
      driverId: DRIVER_ID,
      planId: plan.id,
      planName: plan.name,
      planPeriodDays: plan.periodDays,
      planPercentageCut: plan.percentageCut,
      planCost: plan.cost,
      balance: 100,
      paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
      status: 'active',
      approvedAt: new Date(),
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });
  await ctx.prisma.user.update({
    where: { id: DRIVER_ID },
    data: { totalBalance: 100, isInDebt: false },
  });
}

describe('GET /api/driver/profile/full', () => {
  let ctx: TestContext;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    driverToken = await seedDriver(ctx);
  });

  it('returns fresh profile with nulls, zeros and menu', async () => {
    const res = await ctx.agent
      .get('/api/driver/profile/full')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver.id).toBe(DRIVER_ID);
    expect(res.body.driver.full_name).toBe('Nader Driver');
    expect(res.body.driver.verification_status).toBe('unverified');
    expect(res.body.driver.member_since).toMatch(/\d{4}/);
    expect(res.body.vehicle).toBeNull();
    expect(res.body.subscription).toBeNull();
    expect(res.body.stats.total_ratings).toBe(0);
    expect(res.body.stats.punctuality_rate).toBe(0);
    expect(res.body.stats.badges.length).toBeGreaterThan(0);
    expect(res.body.menu_items.map((m: { key: string }) => m.key)).toEqual([
      'personal_data',
      'subscriptions',
      'ratings',
      'settings',
      'support',
      'account_status',
      'terms',
      'about',
      'delete_account',
    ]);
  });

  it('returns strict top-level and section key contracts', async () => {
    const res = await ctx.agent
      .get('/api/driver/profile/full')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(
      ['driver', 'menu_items', 'stats', 'subscription', 'vehicle'].sort(),
    );
    expect(Object.keys(res.body.driver).sort()).toEqual(
      [
        'age', 'display_name', 'email', 'full_name', 'gender', 'id', 'is_verified',
        'joined_at', 'member_since', 'national_id', 'phone', 'profile_picture_url',
        'verification_status',
      ].sort(),
    );
    expect(Object.keys(res.body.stats).sort()).toEqual(
      [
        'average_rating', 'badges', 'no_show_rate', 'punctuality_rate', 'response_rate',
        'total_ratings', 'total_trips_completed',
      ].sort(),
    );
    for (const item of res.body.menu_items as { key: string; label: string; icon: string }[]) {
      expect(typeof item.key).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.icon).toBe('string');
    }
  });

  it('aggregates seeded subscription, vehicle, ratings and badges', async () => {
    await ctx.prisma.vehicle.create({
      data: {
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'PD-1000',
        color: 'White',
        seats: 6,
        isVerified: true,
      },
    });
    await seedActiveSubscription(ctx);
    await ctx.prisma.user.create({
      data: {
        id: RATER_ID,
        fullName: 'Sam Rater',
        phone: '+962795552003',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: (await ctx.prisma.vehicle.findFirst({ where: { driverId: DRIVER_ID } }))?.id ?? '',
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        totalSeats: 6,
        availableSeats: 5,
        farePerSeat: 15.5,
        status: 'completed',
      },
    });
    for (const stars of [5, 5, 5, 3]) {
      const booking = await ctx.prisma.booking.create({
        data: {
          tripId: trip.id,
          passengerId: RATER_ID,
          seatsBooked: 1,
          agreedFare: 15.5,
          status: 'confirmed',
          referenceCode: makeRef(),
        },
      });
      await ctx.prisma.rating.create({
        data: {
          bookingId: booking.id,
          raterId: RATER_ID,
          rateeId: DRIVER_ID,
          stars,
          wasLate: stars < 4,
          isVisible: true,
        },
      });
    }

    const res = await ctx.agent
      .get('/api/driver/profile/full')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.total_ratings).toBe(4);
    expect(res.body.stats.punctuality_rate).toBe(75);
    expect(res.body.vehicle.verified).toBe(true);
    expect(res.body.vehicle.currency).toBeUndefined();
    expect(res.body.subscription.is_active).toBe(true);
    expect(res.body.subscription.currency).toBe('JOD');
    expect(res.body.subscription.days_remaining).toBeGreaterThan(0);
    expect(res.body.stats.badges).toContain('مركبة نظيفة');
  });

  it('rejects banned driver with 403', async () => {
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { status: 'banned' } });
    const res = await ctx.agent
      .get('/api/driver/profile/full')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/driver/account-status', () => {
  let ctx: TestContext;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    driverToken = await seedDriver(ctx);
  });

  it('returns clean active status', async () => {
    const res = await ctx.agent
      .get('/api/driver/account-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(res.body.is_suspended).toBe(false);
    expect(res.body.suspension_details).toBeNull();
    expect(res.body.active_penalties).toEqual([]);
    expect(res.body.is_deletion_requested).toBe(false);
    expect(res.body.can_delete).toBe(true);
  });

  it('reflects suspension with details', async () => {
    const endsAt = new Date(Date.now() + 86400000);
    await ctx.prisma.penalty.create({
      data: { userId: DRIVER_ID, type: 'suspension', reason: 'Abuse', endsAt },
    });
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { status: 'suspended' } });

    const res = await ctx.agent
      .get('/api/driver/account-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('suspended');
    expect(res.body.is_suspended).toBe(true);
    expect(res.body.suspension_details.reason).toBe('Abuse');
    expect(res.body.suspension_details.ends_at).toBeDefined();
  });
});

describe('POST /api/driver/delete-account', () => {
  let ctx: TestContext;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    driverToken = await seedDriver(ctx);
  });

  it('requests deletion with confirmation', async () => {
    const res = await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ confirmation: true, reason: 'Leaving' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(new Date(res.body.estimated_completion).getTime()).toBeGreaterThan(Date.now());

    const row = await ctx.prisma.deletionRequest.findFirst({ where: { userId: DRIVER_ID } });
    expect(row?.status).toBe('pending');
    expect(row?.reason).toBe('Leaving');
    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.fcmToken).toBeNull();
  });

  it('requires confirmation (422)', async () => {
    const res = await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});
    expect([400, 422]).toContain(res.status);
    expect(res.body.status).toBe('error');
  });

  it('rejects suspended driver with 403', async () => {
    await ctx.prisma.user.update({ where: { id: DRIVER_ID }, data: { status: 'suspended' } });
    const res = await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ confirmation: true });
    expect(res.status).toBe(403);
  });

  it('rejects duplicate pending request with 409', async () => {
    await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ confirmation: true });

    const res = await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ confirmation: true });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DELETION_ALREADY_REQUESTED');
  });

  it('cancels and allows re-request', async () => {
    await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ confirmation: true });

    const cancel = await ctx.agent
      .post('/api/driver/delete-account/cancel')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('cancelled');

    const again = await ctx.agent
      .post('/api/driver/delete-account')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ confirmation: true });
    expect(again.status).toBe(200);
  });

  it('cancel without pending returns 404', async () => {
    const res = await ctx.agent
      .post('/api/driver/delete-account/cancel')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('NO_PENDING_DELETION_REQUEST');
  });
});

describe('GET /api/driver/personal-data', () => {
  let ctx: TestContext;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    driverToken = await seedDriver(ctx);
    await ctx.prisma.user.create({
      data: {
        id: OTHER_ID,
        fullName: 'Other Driver',
        phone: '+962795552002',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        email: 'taken@example.com',
      },
    });
  });

  it('returns editable map for unverified driver', async () => {
    const res = await ctx.agent
      .get('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.personal_data.phone).toBe('+962795552001');
    expect(res.body.personal_data.gender_label).toBe('ذكر');
    expect(res.body.editable_now).toEqual(['display_name', 'phone', 'age', 'avatar_url']);
    expect(res.body.locked_fields).toEqual([]);
    expect(res.body.rejected_fields).toEqual([]);
  });

  it('locks identity fields for approved driver', async () => {
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { verificationStatus: 'approved', isVerified: true },
    });
    const res = await ctx.agent
      .get('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.locked_fields).toEqual(
      expect.arrayContaining(['full_name', 'email', 'national_id', 'vehicle.plate_number']),
    );
  });

  it('updates display_name without verification', async () => {
    const res = await ctx.agent
      .put('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ display_name: 'أبو نادر' });

    expect(res.status).toBe(200);
    expect(res.body.personal_data.display_name).toBe('أبو نادر');
    expect(res.body.requires_verification).toBe(false);
  });

  it('updates identity and restarts review', async () => {
    const res = await ctx.agent
      .put('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ full_name: 'Nader Updated', national_id: '9876543210' });

    expect(res.status).toBe(200);
    expect(res.body.requires_verification).toBe(true);
    expect(res.body.message).toContain('للمراجعة');

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.fullName).toBe('Nader Updated');
    expect(user?.verificationStatus).toBe('pending');
    expect(user?.verificationSubmittedAt).not.toBeNull();
    const profile = await ctx.prisma.driverProfile.findFirst({ where: { driverId: DRIVER_ID } });
    expect(profile?.nationalID).toBe('9876543210');
  });

  it('rejects identity edit for approved driver with FIELD_LOCKED', async () => {
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { verificationStatus: 'approved', isVerified: true },
    });
    const res = await ctx.agent
      .put('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ full_name: 'Should Not Apply' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FIELD_LOCKED');
    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.fullName).toBe('Nader Driver');
  });

  it('rejects taken email and phone with 409', async () => {
    const emailRes = await ctx.agent
      .put('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ email: 'taken@example.com' });
    expect(emailRes.status).toBe(409);
    expect(emailRes.body.code).toBe('EMAIL_ALREADY_IN_USE');

    const phoneRes = await ctx.agent
      .put('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ phone: '+962795552002' });
    expect(phoneRes.status).toBe(409);
    expect(phoneRes.body.code).toBe('PHONE_ALREADY_IN_USE');
  });

  it('rejects cross-driver plate with 409', async () => {
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { verificationStatus: 'approved', isVerified: true },
    });
    await ctx.prisma.vehicle.create({
      data: {
        driverId: OTHER_ID,
        manufacturer: 'Kia',
        model: 'Cerato',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: 'DUP-999',
        seats: 4,
      },
    });
    const res = await ctx.agent
      .put('/api/driver/personal-data')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ vehicle: { plate_number: 'DUP-999' } });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/plate/i);
  });
});
