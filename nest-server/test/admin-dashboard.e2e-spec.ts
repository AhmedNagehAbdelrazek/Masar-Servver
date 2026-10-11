// Admin dashboard US1 (summary + partials), US2 (drivers directory) and US5
// (shared reservation listings). 1:1 port of Main Server tests:
// - tests/integration/adminDashboardSummary.test.js
// - tests/integration/adminDashboardDrivers.test.js
// - tests/integration/adminSharedListings.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

// ---------- summary world (adminDashboardSummary.test.js) ----------
const SUM_ADMIN_ID = 'a1000000-0000-4000-8000-000000000001';
const SUM_DRIVER_A_ID = 'a1000000-0000-4000-8000-000000000002';
const SUM_DRIVER_B_ID = 'a1000000-0000-4000-8000-000000000003';
const SUM_DRIVER_C_ID = 'a1000000-0000-4000-8000-000000000004';
const SUM_PASSENGER_ID = 'a1000000-0000-4000-8000-000000000005';
const SUM_VEHICLE_A_ID = 'b1000000-0000-4000-8000-000000000001';
const SUM_TRIP_1_ID = 'c1000000-0000-4000-8000-000000000001';
const SUM_TRIP_2_ID = 'c1000000-0000-4000-8000-000000000002';
const SUM_BOOKING_1_ID = 'd1000000-0000-4000-8000-000000000001';

// ---------- drivers world (adminDashboardDrivers.test.js) ----------
const DRV_ADMIN_ID = 'a2000000-0000-4000-8000-000000000001';
const DRIVERS = [
  { id: 'a2000000-0000-4000-8000-000000000010', fullName: 'Ahmad Ali', phone: '+962730000001', verificationStatus: 'approved', status: 'active', avgRating: 4.9, createdAt: new Date('2026-01-15T10:00:00Z') },
  { id: 'a2000000-0000-4000-8000-000000000011', fullName: 'Basem Khaled', phone: '+962740000002', verificationStatus: 'pending', status: 'active', avgRating: 3.0, createdAt: new Date('2026-03-20T10:00:00Z') },
  { id: 'a2000000-0000-4000-8000-000000000012', fullName: 'Cyril Sami', phone: '+962750000003', verificationStatus: 'approved', status: 'suspended', avgRating: 4.1, createdAt: new Date('2026-05-10T10:00:00Z') },
  { id: 'a2000000-0000-4000-8000-000000000013', fullName: 'Diana Hassan', phone: '+962760000004', verificationStatus: 'approved', status: 'banned', avgRating: 2.2, createdAt: new Date('2026-07-01T10:00:00Z') },
] as const;

// ---------- shared listings world (adminSharedListings.test.js) ----------
const SHR_ADMIN_ID = 'a9000000-0000-4000-8000-000000000001';
const SHR_DRIVER_ID = 'a9000000-0000-4000-8000-000000000002';
const SHR_PASSENGER_ID = 'a9000000-0000-4000-8000-000000000003';
const SHR_VEHICLE_ID = 'b9000000-0000-4000-8000-000000000001';
const SHR_TRIP_ID = 'c9000000-0000-4000-8000-000000000001';

let ctx: TestContext;

async function seedSummaryWorld(): Promise<void> {
  await ctx.prisma.user.createMany({
    data: [
      { id: SUM_ADMIN_ID, fullName: 'Admin One', phone: '+962700000001', role: 'admin', passwordHash: 'x', isVerified: true },
      { id: SUM_DRIVER_A_ID, fullName: 'Active Driver', phone: '+962711111101', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active' },
      { id: SUM_DRIVER_B_ID, fullName: 'Pending Driver', phone: '+962711111102', role: 'driver', passwordHash: 'x', isVerified: false, verificationStatus: 'pending', status: 'active' },
      { id: SUM_DRIVER_C_ID, fullName: 'Suspended Driver', phone: '+962711111103', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'suspended' },
      { id: SUM_PASSENGER_ID, fullName: 'Passenger P', phone: '+962722222201', role: 'passenger', passwordHash: 'x', isVerified: true },
    ],
  });
  const img = await ctx.prisma.uploadedImage.create({
    data: { hash: 'sum-id-front', url: 'http://img/id_front.jpg', filename: 'f.jpg', mimetype: 'image/jpeg' },
  });
  await ctx.prisma.driverProfile.create({ data: { driverId: SUM_DRIVER_B_ID, userIdentificationFront: img.id } });
  await ctx.prisma.vehicle.create({
    data: {
      id: SUM_VEHICLE_A_ID, driverId: SUM_DRIVER_A_ID, manufacturer: 'Toyota', model: 'Corolla',
      vehicleType: 'sedan', modelYear: 2022, plateNumber: 'SUM-A-1', color: 'White', seats: 4, isVerified: true,
    },
  });
  await ctx.prisma.trip.createMany({
    data: [
      {
        id: SUM_TRIP_1_ID, driverId: SUM_DRIVER_A_ID, vehicleId: SUM_VEHICLE_A_ID,
        originCity: 'Amman', destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 86400000), totalSeats: 4, availableSeats: 4,
        farePerSeat: 10, status: 'published',
      },
      {
        id: SUM_TRIP_2_ID, driverId: SUM_DRIVER_A_ID, vehicleId: SUM_VEHICLE_A_ID,
        originCity: 'Irbid', destinationCity: 'Amman',
        departureTime: new Date(Date.now() - 172800000), totalSeats: 4, availableSeats: 4,
        farePerSeat: 9, status: 'completed',
      },
    ],
  });
  await ctx.prisma.booking.create({
    data: {
      id: SUM_BOOKING_1_ID, tripId: SUM_TRIP_1_ID, passengerId: SUM_PASSENGER_ID,
      seatsBooked: 2, agreedFare: 20, referenceCode: 'SUMRC001',
      status: 'confirmed',
    },
  });
  await ctx.prisma.complaint.createMany({
    data: [
      { reporterId: SUM_PASSENGER_ID, accusedId: SUM_DRIVER_A_ID, category: 'misconduct', description: 'rude', status: 'open' },
      { reporterId: SUM_PASSENGER_ID, accusedId: SUM_DRIVER_C_ID, category: 'delay', description: 'late', status: 'resolved' },
    ],
  });
}

async function seedDriversWorld(): Promise<void> {
  for (const d of DRIVERS) {
    await ctx.prisma.user.create({
      data: {
        id: d.id,
        fullName: d.fullName,
        phone: d.phone,
        role: 'driver',
        passwordHash: 'x',
        isVerified: d.verificationStatus === 'approved',
        verificationStatus: d.verificationStatus as 'approved' | 'pending',
        status: d.status as 'active' | 'suspended' | 'banned',
        avgRating: d.avgRating,
        createdAt: d.createdAt,
      },
    });
  }
}

async function seedSharedWorld(): Promise<void> {
  await ctx.prisma.user.createMany({
    data: [
      { id: SHR_ADMIN_ID, fullName: 'Admin', phone: '+962700009001', role: 'admin', passwordHash: 'x', isVerified: true },
      { id: SHR_DRIVER_ID, fullName: 'Listing Driver', phone: '+962780009002', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved' },
      { id: SHR_PASSENGER_ID, fullName: 'Listing Passenger', phone: '+962780009003', role: 'passenger', passwordHash: 'x', isVerified: true },
    ],
  });
  await ctx.prisma.vehicle.create({
    data: {
      id: SHR_VEHICLE_ID, driverId: SHR_DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
      vehicleType: 'sedan', plateNumber: 'SHR-V-1', seats: 4,
    },
  });
  await ctx.prisma.trip.create({
    data: {
      id: SHR_TRIP_ID, driverId: SHR_DRIVER_ID, vehicleId: SHR_VEHICLE_ID,
      originCity: 'Amman', destinationCity: 'Irbid',
      departureTime: new Date(Date.now() + 86400000),
      totalSeats: 4, availableSeats: 2, farePerSeat: 10, status: 'published',
    },
  });
  await ctx.prisma.booking.createMany({
    data: [
      {
        tripId: SHR_TRIP_ID, passengerId: SHR_PASSENGER_ID, seatsBooked: 2, agreedFare: 20,
        referenceCode: 'SHRDC001', status: 'confirmed',
      },
      {
        tripId: SHR_TRIP_ID, passengerId: SHR_PASSENGER_ID, seatsBooked: 1, agreedFare: 10,
        referenceCode: 'SHRDC002', status: 'cancelled',
        cancellationReason: 'change of plans',
      },
    ],
  });
}

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await ctx.app.close();
});

describe('GET /api/admin/dashboard/summary — empty platform', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    adminToken = generateAccessToken({ id: SUM_ADMIN_ID, role: 'admin' });
  });

  it('returns zeroed KPIs and empty arrays without errors', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.kpis).toMatchObject({
      total_drivers: 0, active_drivers: 0, total_trips: 0,
      active_trips: 0, total_vehicles: 0, pending_documents: 0,
    });
    expect(res.body.alerts.every((a: { count: unknown }) => typeof a.count === 'number')).toBe(true);
    expect(res.body.top_routes).toEqual([]);
    expect(res.body.recent_trips).toEqual([]);
    expect(res.body.pending_requests).toEqual([]);
    expect(res.body.latest_complaints).toEqual([]);
  });
});

describe('GET /api/admin/dashboard/summary — seeded platform', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedSummaryWorld();
    adminToken = generateAccessToken({ id: SUM_ADMIN_ID, role: 'admin' });
  });

  it('returns reconciled KPIs, alerts, routes, trips, requests, complaints in one payload', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.kpis).toMatchObject({
      total_drivers: 3, active_drivers: 1, total_trips: 2, active_trips: 1, total_vehicles: 1,
    });

    const alertTypes = res.body.alerts.map((a: { type: string }) => a.type);
    expect(alertTypes).toEqual(expect.arrayContaining([
      'pending_verification_documents', 'pending_review_drivers', 'unresolved_complaints',
    ]));
    expect(res.body.alerts.find((a: { type: string }) => a.type === 'unresolved_complaints').count).toBe(1);

    expect(res.body.top_routes.length).toBeGreaterThan(0);
    const ammanIrbid = res.body.top_routes.find((r: { origin: string; destination: string }) => r.origin === 'Amman' && r.destination === 'Irbid');
    expect(ammanIrbid.trips_count).toBe(1);

    const recent = res.body.recent_trips.find((t: { trip_id: string }) => t.trip_id === SUM_TRIP_1_ID);
    expect(recent).toMatchObject({ status: 'published' });
    expect(recent.driver.name).toBe('Active Driver');
    expect(recent.passengers_count).toBe(2);

    const pendingReq = res.body.pending_requests.find((p: { driver_id: string }) => p.driver_id === SUM_DRIVER_B_ID);
    expect(pendingReq).toBeDefined();
    expect(pendingReq.pending_documents).toContain('id_front');

    expect(res.body.latest_complaints).toHaveLength(2);
    const openComplaint = res.body.latest_complaints.find((c: { status: string }) => c.status === 'open');
    expect(openComplaint.accused.name).toBe('Active Driver');
  });
});

describe('Dashboard partials', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedSummaryWorld();
    adminToken = generateAccessToken({ id: SUM_ADMIN_ID, role: 'admin' });
  });

  it('GET /recent-trips paginates and filters independently', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/recent-trips?status=completed&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('completed');
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /top-routes returns ranked routes', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/top-routes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.top_routes[0]).toHaveProperty('trips_count');
  });

  it('GET /pending-requests lists pending drivers with their outstanding documents', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/pending-requests')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].driver_id).toBe(SUM_DRIVER_B_ID);
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /latest-complaints paginates', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/latest-complaints?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.total_pages).toBe(2);
  });
});

describe('Dashboard access control', () => {
  let adminToken: string;
  let driverToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedSummaryWorld();
    adminToken = generateAccessToken({ id: SUM_ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: SUM_DRIVER_A_ID, role: 'driver' });
    void adminToken;
  });

  it('rejects drivers with 403', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects anonymous callers with 401', async () => {
    const res = await ctx.agent.get('/api/admin/dashboard/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/dashboard/drivers — directory', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDriversWorld();
    adminToken = generateAccessToken({ id: DRV_ADMIN_ID, role: 'admin' });
  });

  it('searches by partial name (case-insensitive)', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers?search=ahm')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Ahmad Ali');
    expect(res.body.data[0]).toMatchObject({
      account_status: 'active',
      avg_rating: 4.9,
      total_trips: 0,
      balance: 0,
    });
    expect(res.body.data[0].registration_date).toBeTruthy();
  });

  it('searches by partial phone number', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers?search=74000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(DRIVERS[1].id);
  });

  it.each([
    ['active', 'Ahmad Ali'],
    ['pending', 'Basem Khaled'],
    ['suspended', 'Cyril Sami'],
    ['blocked', 'Diana Hassan'],
  ])('filters by derived status %s', async (status, expectedName) => {
    const res = await ctx.agent
      .get(`/api/admin/dashboard/drivers?status=${status}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe(expectedName);
    expect(res.body.data[0].account_status).toBe(status);
  });

  it('filters by inclusive registration date range and combines with AND semantics', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers?registration_from=2026-03-01&registration_to=2026-05-31&search=basem')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Basem Khaled');
  });

  it('sorts by full_name ascending and avg_rating descending', async () => {
    const asc = await ctx.agent
      .get('/api/admin/dashboard/drivers?sort_by=full_name&sort_order=asc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(asc.body.data.map((d: { name: string }) => d.name)).toEqual(['Ahmad Ali', 'Basem Khaled', 'Cyril Sami', 'Diana Hassan']);

    const desc = await ctx.agent
      .get('/api/admin/dashboard/drivers?sort_by=avg_rating&sort_order=desc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(desc.body.data[0].name).toBe('Ahmad Ali');
  });

  it('paginates and returns empty rows past the end with correct meta', async () => {
    const page1 = await ctx.agent
      .get('/api/admin/dashboard/drivers?page=1&limit=3')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(page1.body.data).toHaveLength(3);
    expect(page1.body.pagination).toMatchObject({ page: 1, limit: 3, total: 4, total_pages: 2 });

    const page3 = await ctx.agent
      .get('/api/admin/dashboard/drivers?page=3&limit=3')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(page3.body.data).toEqual([]);
    expect(page3.body.pagination.total).toBe(4);
  });
});

describe('GET /api/admin/dashboard/drivers/stats/summary — platform-wide cards', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedDriversWorld();
    adminToken = generateAccessToken({ id: DRV_ADMIN_ID, role: 'admin' });
  });

  it('returns the four platform-wide buckets', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers/stats/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total_drivers: 4,
      active_drivers: 1,
      suspended_drivers: 1,
      pending_drivers: 1,
    });
  });

  it('ignores any filters applied to the drivers list (clarification Q4)', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers/stats/summary?status=blocked&search=diana&page=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total_drivers).toBe(4);
    expect(res.body.active_drivers).toBe(1);
  });
});

describe('GET /api/admin/dashboard/reservations', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedSharedWorld();
    adminToken = generateAccessToken({ id: SHR_ADMIN_ID, role: 'admin' });
  });

  it('lists bookings with driver/passenger/trip context and paginates', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/reservations?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(2);
    const row = res.body.data[0];
    expect(row.driver.name).toBe('Listing Driver');
    expect(row.passenger.name).toBe('Listing Passenger');
    expect(row.trip).toMatchObject({ origin: 'Amman', destination: 'Irbid' });
  });

  it('filters by status', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/reservations?status=cancelled')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('cancelled');
    expect(res.body.data[0].price).toBe(10);
  });
});

describe('Complaints interplay with existing moderation endpoints (R13 reuse)', () => {
  let adminToken: string;

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedSharedWorld();
    adminToken = generateAccessToken({ id: SHR_ADMIN_ID, role: 'admin' });
  });

  it('an open complaint resolved via PUT /api/admin/complaints/:id no longer counts as unresolved on the dashboard summary', async () => {
    const complaint = await ctx.prisma.complaint.create({
      data: {
        reporterId: SHR_PASSENGER_ID, accusedId: SHR_DRIVER_ID,
        category: 'misconduct', description: 'test', status: 'open',
      },
    });

    const before = await ctx.agent
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(before.body.alerts.find((a: { type: string }) => a.type === 'unresolved_complaints').count).toBe(1);

    const resolve = await ctx.agent
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved', resolution: 'warned both parties' });
    expect(resolve.status).toBe(200);

    const after = await ctx.agent
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.alerts.find((a: { type: string }) => a.type === 'unresolved_complaints').count).toBe(0);
  });
});
