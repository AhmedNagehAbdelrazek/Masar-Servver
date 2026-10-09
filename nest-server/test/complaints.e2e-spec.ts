// 1:1 port of Main Server/tests/integration/complaints.test.js and
// tests/contract/complaints.contract.test.js (Wave 1.3).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const UNKNOWN_ID = '550e8400-e29b-41d4-a716-446655440099';

describe('US6 - Complaints', () => {
  let ctx: TestContext;
  let adminToken: string;
  let driverToken: string;
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
        id: ADMIN_ID,
        fullName: 'Admin User',
        phone: '+962790000000',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Omar Khaled',
        phone: '+962791111111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Lina Haddad',
        phone: '+962792222222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('files a complaint against another user', async () => {
    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        accused_id: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not arrive at pickup',
        evidence_urls: ['https://res.cloudinary.com/example/evidence.png'],
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.accused_id).toBe(DRIVER_ID);
    expect(res.body.complaint.category).toBe('no_show');
    expect(res.body.complaint.status).toBe('open');
    expect(res.body.already_filed).toBe(false);
  });

  it('is idempotent — matching open complaint is not duplicated', async () => {
    const body = {
      accused_id: DRIVER_ID,
      category: 'no_show',
      description: 'Driver did not arrive at pickup',
    };

    await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send(body);

    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ ...body, description: 'Repeated complaint' });

    expect(res.status).toBe(200);
    expect(res.body.already_filed).toBe(true);

    const count = await ctx.prisma.complaint.count({ where: { reporterId: PASSENGER_ID } });
    expect(count).toBe(1);
  });

  it('rejects invalid category with 422', async () => {
    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ accused_id: DRIVER_ID, category: 'bogus', description: 'x' });
    expect(res.status).toBe(422);
  });

  it('rejects self-complaint with 422', async () => {
    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ accused_id: PASSENGER_ID, category: 'other', description: 'me' });
    expect(res.status).toBe(422);
  });

  it('returns 404 for unknown accused', async () => {
    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ accused_id: UNKNOWN_ID, category: 'other', description: 'x' });
    expect(res.status).toBe(404);
  });

  it('driver sees complaints filed by them', async () => {
    await ctx.prisma.complaint.create({
      data: {
        reporterId: DRIVER_ID,
        accusedId: PASSENGER_ID,
        category: 'no_show',
        description: 'Passenger did not show',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .get('/api/driver/complaints')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].direction).toBe('filed');
    expect(res.body.data[0].other_party).toBe('Lina Haddad');
    expect(res.body.data[0].category).toBe('no_show');
  });

  it('driver sees complaints against them', async () => {
    await ctx.prisma.complaint.create({
      data: {
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'lateness',
        description: 'Driver was late',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .get('/api/driver/complaints?direction=against')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].direction).toBe('against');
    expect(res.body.data[0].other_party).toBe('Lina Haddad');
  });

  it('driver filters complaints by status', async () => {
    await ctx.prisma.complaint.create({
      data: {
        reporterId: DRIVER_ID,
        accusedId: PASSENGER_ID,
        category: 'no_show',
        description: 'Passenger did not show',
        status: 'open',
      },
    });
    await ctx.prisma.complaint.create({
      data: {
        reporterId: DRIVER_ID,
        accusedId: PASSENGER_ID,
        category: 'other',
        description: 'Old resolved complaint',
        status: 'resolved',
      },
    });

    const res = await ctx.agent
      .get('/api/driver/complaints?status=resolved')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('resolved');
  });

  it('admin resolves a complaint and records resolution', async () => {
    const complaint = await ctx.prisma.complaint.create({
      data: {
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved', resolution: 'Driver refunded passenger manually' });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('resolved');
    expect(res.body.complaint.resolution).toBe('Driver refunded passenger manually');
    expect(res.body.complaint.resolved_by).toBe(ADMIN_ID);
    expect(res.body.complaint.resolved_at).toBeDefined();
  });

  it('admin dismisses a complaint', async () => {
    const complaint = await ctx.prisma.complaint.create({
      data: {
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'other',
        description: 'Unsubstantiated',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'dismissed' });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('dismissed');
  });

  it('admin resolve requires resolution (422)', async () => {
    const complaint = await ctx.prisma.complaint.create({
      data: {
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved' });

    expect(res.status).toBe(422);
  });

  it('admin resolve rejects non-admin with 403', async () => {
    const complaint = await ctx.prisma.complaint.create({
      data: {
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'other',
        description: 'x',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'dismissed' });

    expect(res.status).toBe(403);
  });

  it('admin lists complaints with reporter and accused names', async () => {
    await ctx.prisma.complaint.create({
      data: {
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
        status: 'open',
      },
    });

    const res = await ctx.agent
      .get('/api/admin/complaints')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].reporter_name).toBe('Lina Haddad');
    expect(res.body.data[0].accused_name).toBe('Omar Khaled');
    expect(res.body.pagination.total).toBe(1);
  });

  it('contract: complaint envelope shape', async () => {
    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ accused_id: DRIVER_ID, category: 'no_show', description: 'Driver did not show' });

    expect(res.status).toBe(200);
    expect(res.body.complaint.id).toBeDefined();
    expect(res.body.complaint.accused_id).toBe(DRIVER_ID);
    expect(res.body.complaint.category).toBe('no_show');
    expect(res.body.complaint.status).toBe('open');
    expect(res.body.complaint.created_at).toBeDefined();
  });

  it('contract: 422 for self-complaint returns details array', async () => {
    const res = await ctx.agent
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ accused_id: PASSENGER_ID, category: 'other', description: 'me' });

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
