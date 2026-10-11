// Admin dashboard US3 (driver dossier tabs) and US4 (standing actions,
// direct status writes, document approve/reject). 1:1 port of Main Server tests:
// - tests/integration/adminDriverDossier.test.js
// - tests/integration/adminDriverActions.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

// ---------- dossier world (adminDriverDossier.test.js) ----------
const DOS_ADMIN_ID = 'a3000000-0000-4000-8000-000000000001';
const DOS_DRIVER_ID = 'a3000000-0000-4000-8000-000000000002';
const DOS_PASSENGER_ID = 'a3000000-0000-4000-8000-000000000003';
const DOS_VEHICLE_ID = 'b3000000-0000-4000-8000-000000000001';
const DOS_IMG_FRONT = 9001;
const DOS_IMG_REG = 9010;
const DOS_IMG_PHOTO_FRONT = 9020;

// ---------- actions world (adminDriverActions.test.js) ----------
const ACT_ADMIN_ID = 'a4000000-0000-4000-8000-000000000001';
const ACT_DRIVER_ID = 'a4000000-0000-4000-8000-000000000002';
const ACT_PASSENGER_ID = 'a4000000-0000-4000-8000-000000000003';
const ACT_IMG_ID = 9100;

let ctx: TestContext;

async function seedDossier(): Promise<void> {
  await ctx.prisma.user.createMany({
    data: [
      { id: DOS_ADMIN_ID, fullName: 'Admin', phone: '+962700003001', role: 'admin', passwordHash: 'x', isVerified: true },
      {
        id: DOS_DRIVER_ID, fullName: 'أحمد محمد', phone: '+962780003002', role: 'driver',
        passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active',
        age: 26, avatarUrl: 'http://img/avatar.png', avgRating: 4.8,
      },
      { id: DOS_PASSENGER_ID, fullName: 'Sara Passenger', phone: '+962780003003', role: 'passenger', passwordHash: 'x', isVerified: true },
    ],
  });
  await ctx.prisma.uploadedImage.createMany({
    data: [
      { id: DOS_IMG_FRONT, hash: 'dos-hash-front', url: 'http://img/id_front.jpg', filename: 'a.jpg', mimetype: 'image/jpeg', createdAt: new Date('2026-08-01T10:00:00Z') },
      { id: DOS_IMG_REG, hash: 'dos-hash-reg', url: 'http://img/registration.jpg', filename: 'b.jpg', mimetype: 'image/jpeg', createdAt: new Date('2026-08-02T10:00:00Z') },
      { id: DOS_IMG_PHOTO_FRONT, hash: 'dos-hash-photo', url: 'http://img/car_front.jpg', filename: 'c.jpg', mimetype: 'image/jpeg', createdAt: new Date('2026-08-03T10:00:00Z') },
    ],
  });
  await ctx.prisma.driverProfile.create({ data: { driverId: DOS_DRIVER_ID, userIdentificationFront: DOS_IMG_FRONT } });
  await ctx.prisma.vehicle.create({
    data: {
      id: DOS_VEHICLE_ID, driverId: DOS_DRIVER_ID, manufacturer: 'Hyundai', model: 'Elantra',
      vehicleType: 'sedan', modelYear: 2021, plateNumber: 'DOS-V-1',
      color: 'White', seats: 4, isVerified: true,
      registrationDocFront: DOS_IMG_REG, vehiclePhotoFront: DOS_IMG_PHOTO_FRONT,
    },
  });
  const plan = await ctx.prisma.subscriptionPlan.create({
    data: {
      name: 'DosPro', periodDays: 30, percentageCut: 15.5, cost: 10,
      features: [], isFree: false, isActive: true,
    },
  });
  await ctx.prisma.driverSubscription.create({
    data: {
      driverId: DOS_DRIVER_ID, planId: plan.id,
      planName: plan.name, planPeriodDays: plan.periodDays,
      planPercentageCut: plan.percentageCut, planCost: plan.cost,
      paymentMethod: { kind: 'cash' }, status: 'active',
      activatedAt: new Date('2026-08-01T00:00:00Z'), expiresAt: new Date('2026-08-31T00:00:00Z'),
    },
  });

  const now = new Date();
  const tripInMonth = await ctx.prisma.trip.create({
    data: {
      driverId: DOS_DRIVER_ID, vehicleId: DOS_VEHICLE_ID,
      originCity: 'Amman', destinationCity: 'Irbid',
      departureTime: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15, 12)),
      totalSeats: 4, availableSeats: 4, farePerSeat: 10, status: 'published',
    },
  });
  const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const twoMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
  const completedTrip = await ctx.prisma.trip.create({
    data: {
      driverId: DOS_DRIVER_ID, vehicleId: DOS_VEHICLE_ID,
      originCity: 'Irbid', destinationCity: 'Amman',
      departureTime: new Date(Date.UTC(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth(), 15, 12)),
      totalSeats: 4, availableSeats: 4, farePerSeat: 9, status: 'completed',
    },
  });
  await ctx.prisma.trip.create({
    data: {
      driverId: DOS_DRIVER_ID, vehicleId: DOS_VEHICLE_ID,
      originCity: 'Amman', destinationCity: 'Aqaba',
      departureTime: new Date(Date.UTC(twoMonthsAgo.getUTCFullYear(), twoMonthsAgo.getUTCMonth(), 15, 12)),
      totalSeats: 4, availableSeats: 4, farePerSeat: 30, status: 'cancelled',
    },
  });

  await ctx.prisma.booking.create({
    data: {
      tripId: tripInMonth.id, passengerId: DOS_PASSENGER_ID,
      seatsBooked: 3, agreedFare: 30, referenceCode: 'DOSRC001',
      status: 'confirmed',
    },
  });
  const bookingCompleted = await ctx.prisma.booking.create({
    data: {
      tripId: completedTrip.id, passengerId: DOS_PASSENGER_ID,
      seatsBooked: 1, agreedFare: 9, referenceCode: 'DOSRC002',
      status: 'completed',
    },
  });

  await ctx.prisma.rating.create({
    data: {
      bookingId: bookingCompleted.id, raterId: DOS_PASSENGER_ID, rateeId: DOS_DRIVER_ID,
      stars: 5, review: 'Great ride', tags: ['Clean Car', 'Safe Driving'],
    },
  });
  await ctx.prisma.rating.create({
    data: {
      bookingId: bookingCompleted.id, raterId: DOS_PASSENGER_ID, rateeId: DOS_DRIVER_ID,
      stars: 4, review: 'Good', tags: ['Clean Car'], createdAt: new Date(Date.now() - 86400000),
    },
  });

  await ctx.prisma.penalty.create({
    data: {
      userId: DOS_DRIVER_ID, type: 'warning', penaltyType: 'speeding',
      reason: 'Speeding complaint', startsAt: new Date(Date.now() - 3 * 86400000),
      issuedBy: DOS_ADMIN_ID,
    },
  });

  await ctx.prisma.complaint.createMany({
    data: [
      {
        reporterId: DOS_PASSENGER_ID, accusedId: DOS_DRIVER_ID,
        category: 'misconduct', description: 'rude behavior', status: 'open',
      },
      {
        reporterId: DOS_DRIVER_ID, accusedId: DOS_PASSENGER_ID,
        category: 'no_show', description: 'passenger no show', status: 'resolved',
      },
    ],
  });
}

async function seedActionsBase(): Promise<void> {
  await ctx.prisma.user.createMany({
    data: [
      { id: ACT_ADMIN_ID, fullName: 'Admin', phone: '+962700004001', role: 'admin', passwordHash: 'x', isVerified: true },
      {
        id: ACT_DRIVER_ID, fullName: 'Action Driver', phone: '+962780004002', role: 'driver',
        passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active',
      },
      { id: ACT_PASSENGER_ID, fullName: 'Passenger', phone: '+962780004003', role: 'passenger', passwordHash: 'x', isVerified: true },
    ],
  });
}

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.app.close();
});

describe('GET /api/admin/dashboard/drivers/:driver_id — header', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDossier();
    adminToken = generateAccessToken({ id: DOS_ADMIN_ID, role: 'admin' });
  });

  it('returns identity, derived status, lifetime stats and ratings', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'أحمد محمد',
      account_status: 'active',
      balance: 0,
      reviews_count: 2,
    });
    expect(res.body.trip_stats).toEqual({ total_trips: 3, completed_trips: 1, canceled_trips: 1 });
    expect(res.body.avg_rating).toBeCloseTo(4.5, 1);
  });

  // Express had this as it.skip; the Nest port implements 404 correctly so it runs.
  it('returns 404 for a nonexistent or non-driver id', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers/00000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/admin/dashboard/drivers/:driver_id/overview', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDossier();
    adminToken = generateAccessToken({ id: DOS_ADMIN_ID, role: 'admin' });
  });

  it('returns personal info, trip statistics and balance details from the latest subscription', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/overview`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.personal_info.name).toBe('أحمد محمد');
    expect(res.body.trip_statistics.total_trips).toBe(3);
    expect(res.body.balance_details).toMatchObject({
      price_per_month: 10,
      duration_days: 30,
      interest_rate: 15.5,
    });
  });
});

describe('GET /api/admin/dashboard/drivers/:driver_id/trips', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDossier();
    adminToken = generateAccessToken({ id: DOS_ADMIN_ID, role: 'admin' });
  });

  it('filters by status and includes reservation/passenger aggregates', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/trips?status=completed`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('completed');
    expect(res.body.data[0].reservations_count).toBe(1);
    expect(res.body.data[0].price).toBe(9);
  });

  it('filters by month (YYYY-MM)', async () => {
    const now = new Date();
    const monthParam = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/trips?month=${monthParam}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].passengers_count).toBe(3);
  });
});

describe('GET /api/admin/dashboard/drivers/:driver_id/evaluations', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDossier();
    adminToken = generateAccessToken({ id: DOS_ADMIN_ID, role: 'admin' });
  });

  it('returns summary, full 5→1 distribution, top tags and paginated reviews', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/evaluations`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({ total_reviews: 2 });
    expect(res.body.distribution).toHaveLength(5);
    const byStar = Object.fromEntries(res.body.distribution.map((d: { rating: number; count: number }) => [d.rating, d.count]));
    expect(byStar[5]).toBe(1);
    expect(byStar[4]).toBe(1);
    expect(byStar[3]).toBe(0);
    expect(res.body.top_tags[0]).toBe('Clean Car');
    expect(res.body.reviews[0].passenger_name).toBe('Sara Passenger');
    expect(res.body.reviews[0].comment).toBe('Great ride');
  });
});

describe('GET /api/admin/dashboard/drivers/:driver_id/account-log', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDossier();
    adminToken = generateAccessToken({ id: DOS_ADMIN_ID, role: 'admin' });
  });

  it('merges penalties and complaints with counters', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/account-log`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({
      violations: 1, warnings: 1, suspensions: 0,
      complaints_against: 1, complaints_by: 1,
    });
    const types = res.body.log.map((l: { type: string }) => l.type);
    expect(types).toContain('warning');
    expect(types).toContain('enquiry');
    const enquiryAgainst = res.body.log.find((l: { type: string; direction: string }) => l.type === 'enquiry' && l.direction === 'against_driver');
    expect(enquiryAgainst.status).toBe('pending');
  });
});

describe('GET /api/admin/dashboard/drivers/:driver_id/car + /documents', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDossier();
    adminToken = generateAccessToken({ id: DOS_ADMIN_ID, role: 'admin' });
  });

  it('car tab returns info, photos and per-document statuses', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/car`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.car_info).toMatchObject({ make: 'Hyundai', model: 'Elantra', year: 2021, seats: 4 });
    expect(res.body.car_photos.front).toBe('http://img/car_front.jpg');
    const regFront = res.body.document_status.find((d: { key: string }) => d.key === 'registration_front');
    expect(regFront.status).toBe('pending');
    expect(res.body.vehicle_verified).toBe(true);
  });

  it('documents tab groups personal/vehicle docs with derived statuses incl. missing insurance', async () => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${DOS_DRIVER_ID}/documents`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const idFront = res.body.personal_documents.find((d: { key: string }) => d.key === 'id_front');
    expect(idFront).toMatchObject({ document_url: 'http://img/id_front.jpg', status: 'pending' });
    const licenseBack = res.body.personal_documents.find((d: { key: string }) => d.key === 'license_back');
    expect(licenseBack.status).toBe('missing');
    const insurance = res.body.vehicle_documents.find((d: { key: string }) => d.key === 'insurance');
    expect(insurance.status).toBe('missing');
    const regFront = res.body.vehicle_documents.find((d: { key: string }) => d.key === 'registration_front');
    expect(regFront.status).toBe('pending');
  });
});

describe('POST /api/admin/dashboard/drivers/:driver_id/account-status — standing actions', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedActionsBase();
    adminToken = generateAccessToken({ id: ACT_ADMIN_ID, role: 'admin' });
  });

  it('suspend sets status and appends a suspension penalty to the account log', async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'suspend', reason: 'Repeated complaints' });

    expect(res.status).toBe(200);
    expect(res.body.driver).toMatchObject({ id: ACT_DRIVER_ID, account_status: 'suspended' });

    const penalties = await ctx.prisma.penalty.findMany({ where: { userId: ACT_DRIVER_ID } });
    expect(penalties).toHaveLength(1);
    expect(penalties[0]).toMatchObject({
      type: 'suspension', issuedBy: ACT_ADMIN_ID, reason: 'Repeated complaints',
    });
    expect(penalties[0].endsAt).toBeNull();
  });

  it('reactivate returns the driver to active and closes open suspensions', async () => {
    await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'suspend' });
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reactivate' });

    expect(res.status).toBe(200);
    expect(res.body.driver.account_status).toBe('active');

    const penalties = await ctx.prisma.penalty.findMany({ where: { userId: ACT_DRIVER_ID } });
    expect(penalties[0].endsAt).not.toBeNull();
  });

  it('unblock works as an alias for reactivate (clarification Q1)', async () => {
    await ctx.prisma.user.update({ where: { id: ACT_DRIVER_ID }, data: { status: 'banned' } });
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'unblock' });

    expect(res.status).toBe(200);
    expect(res.body.driver.account_status).toBe('active');
    const driver = await ctx.prisma.user.findUnique({ where: { id: ACT_DRIVER_ID } });
    expect(driver?.status).toBe('active');
  });

  it('rejects no-op transitions with 409', async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'suspend' });
    expect(res.status).toBe(200);

    const repeat = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'suspend' });
    expect(repeat.status).toBe(409);
  });

  it('rejects invalid actions with validation error', async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'explode' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/admin/dashboard/drivers/:driver_id/status — direct writes', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedActionsBase();
    adminToken = generateAccessToken({ id: ACT_ADMIN_ID, role: 'admin' });
  });

  it.each([
    ['suspended', 'suspended', 'active'],
    ['blocked', 'blocked', 'active'],
    ['active', 'active', 'banned'],
  ])('writes %s into the single canonical status field (from %s)', async (requested, expected, from) => {
    await ctx.prisma.user.update({
      where: { id: ACT_DRIVER_ID },
      data: { status: from as 'active' | 'banned', verificationStatus: 'approved' },
    });

    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: requested });

    expect(res.status).toBe(200);
    expect(res.body.driver.account_status).toBe(expected);
    const driver = await ctx.prisma.user.findUnique({ where: { id: ACT_DRIVER_ID } });
    if (requested === 'blocked') expect(driver?.status).toBe('banned');
    else expect(driver?.status).toBe(requested);
  });

  it("'pending' flips verification flow and records a status change row", async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(200);
    expect(res.body.driver.account_status).toBe('pending');

    const driver = await ctx.prisma.user.findUnique({ where: { id: ACT_DRIVER_ID } });
    expect(driver?.verificationStatus).toBe('pending');
    const changes = await ctx.prisma.verificationStatusChange.findMany({ where: { driverId: ACT_DRIVER_ID } });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ fromStatus: 'approved', toStatus: 'pending', changedBy: ACT_ADMIN_ID });
  });

  it('rejects invalid values with 422 and unknown drivers with 404', async () => {
    const bad = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ghost' });
    expect(bad.status).toBe(422);

    const missing = await ctx.agent
      .post('/api/admin/dashboard/drivers/00000000-0000-4000-8000-000000000099/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended' });
    expect(missing.status).toBe(404);
  });
});

describe('Document approve/reject — attribution & last-write-wins', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedActionsBase();
    await ctx.prisma.uploadedImage.create({
      data: {
        id: ACT_IMG_ID, hash: 'act-hash-action', url: 'http://img/id.jpg',
        filename: 'id.jpg', mimetype: 'image/jpeg',
      },
    });
    await ctx.prisma.driverProfile.create({ data: { driverId: ACT_DRIVER_ID, userIdentificationFront: ACT_IMG_ID } });
    adminToken = generateAccessToken({ id: ACT_ADMIN_ID, role: 'admin' });
  });

  it('rejects an uploaded document with an optional recorded reason', async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents/id_front/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'صورة غير واضحة' });

    expect(res.status).toBe(200);
    expect(res.body.document).toMatchObject({
      key: 'id_front', status: 'rejected', decided_by: ACT_ADMIN_ID, reason: 'صورة غير واضحة',
    });
    const review = await ctx.prisma.documentReview.findUnique({
      where: { driverId_documentKey: { driverId: ACT_DRIVER_ID, documentKey: 'id_front' } },
    });
    expect(review?.decision).toBe('rejected');
    expect(review?.decidedAt).not.toBeNull();
  });

  it('approve then re-reject: last confirmed action wins (upsert)', async () => {
    await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents/id_front/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    const second = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents/id_front/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(second.status).toBe(200);
    expect(second.body.document.status).toBe('rejected');
    const reviews = await ctx.prisma.documentReview.findMany({ where: { driverId: ACT_DRIVER_ID } });
    expect(reviews).toHaveLength(1);
  });

  it('documents tab reflects the decision on next read', async () => {
    await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents/id_front/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents`)
      .set('Authorization', `Bearer ${adminToken}`);
    const idFront = res.body.personal_documents.find((d: { key: string }) => d.key === 'id_front');
    expect(idFront.status).toBe('approved');
  });

  it('rejects unknown document keys and unbacked documents without side effects', async () => {
    const unknown = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents/passport/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(400);

    const insurance = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/documents/insurance/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'none' });
    expect(insurance.status).toBe(400);

    const reviews = await ctx.prisma.documentReview.findMany({ where: { driverId: ACT_DRIVER_ID } });
    expect(reviews).toHaveLength(0);
  });
});

describe('Dashboard action access control', () => {
  let adminToken: string;
  let driverToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedActionsBase();
    adminToken = generateAccessToken({ id: ACT_ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: ACT_DRIVER_ID, role: 'driver' });
    void adminToken;
  });

  it('rejects driver tokens on mutations with 403', async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/status`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'suspended' });
    expect(res.status).toBe(403);
  });

  it('rejects anonymous mutations with 401', async () => {
    const res = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${ACT_DRIVER_ID}/account-status`)
      .send({ action: 'suspend' });
    expect(res.status).toBe(401);
  });
});
