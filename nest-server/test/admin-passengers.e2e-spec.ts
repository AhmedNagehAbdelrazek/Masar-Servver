// Admin passenger dossier: stats/list/detail/tabs + action modals.
// Figma: 10062:4551, 10063:18152, 10064:20466/22193/23604, 10069:27574/28429/30620,
// modals 10063:18885/19165/18592/19348.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const PASSENGER_ID = '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const DRIVER_ID = '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Admin passengers', () => {
  let ctx: TestContext;
  let adminToken: string;
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
        fullName: 'Admin',
        phone: '+962790000001',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Sara Ali',
        phone: '+962798800002',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Omar Khaled',
        phone: '+962798800001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('GET /api/admin/passengers/stats returns the five cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/passengers/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_passengers: 1,
      active: 1,
      suspended_temporary: 0,
      suspended_permanent: 0,
      with_violations: 0,
    });
  });

  it('GET /api/admin/passengers lists with search + pagination', async () => {
    const res = await ctx.agent
      .get('/api/admin/passengers?search=Sara')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ id: PASSENGER_ID, account_status: 'active' });
    expect(res.body.pagination).toMatchObject({ total: 1 });
  });

  it('GET /api/admin/passengers/export returns CSV', async () => {
    const res = await ctx.agent
      .get('/api/admin/passengers/export')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('id,full_name,phone,account_status,created_at');
    expect(res.text).toContain(PASSENGER_ID);
  });

  it('GET /api/admin/passengers/:id returns overview, 404 for drivers/unknown', async () => {
    const ok = await ctx.agent
      .get(`/api/admin/passengers/${PASSENGER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.personal_info).toMatchObject({ id: PASSENGER_ID });
    expect(ok.body.booking_stats).toMatchObject({ total_bookings: 0 });

    const driver = await ctx.agent
      .get(`/api/admin/passengers/${DRIVER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(driver.status).toBe(404);

    const unknown = await ctx.agent
      .get(`/api/admin/passengers/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(404);
  });

  it('POST warning + temporary suspension update status via PenaltyService', async () => {
    const warn = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/warnings`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'late', notes: 'first strike' });
    expect(warn.status).toBe(200);
    expect(warn.body.penalty).toMatchObject({ type: 'warning' });

    const susp = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/suspensions/temporary`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'misbehavior', duration: '3d' });
    expect(susp.status).toBe(200);
    expect(susp.body.penalty).toMatchObject({ type: 'suspension' });
    expect(new Date(susp.body.penalty.ends_at).getTime()).toBeGreaterThan(Date.now());

    const log = await ctx.agent
      .get(`/api/admin/passengers/${PASSENGER_ID}/account-log`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(log.status).toBe(200);
    expect(log.body.summary).toMatchObject({ warnings: 1, suspensions: 1 });
  });

  it('POST temporary suspension rejects custom duration without days', async () => {
    const res = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/suspensions/temporary`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'misbehavior', duration: 'custom' });
    expect([400, 422]).toContain(res.status);
  });

  it('POST permanent suspension requires the log-review checkbox', async () => {
    const denied = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/suspensions/permanent`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'tos_violation', confirmReviewedLog: false });
    expect([400, 422]).toContain(denied.status);

    const ok = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/suspensions/permanent`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'tos_violation', confirmReviewedLog: true });
    expect(ok.status).toBe(200);
    expect(ok.body.penalty).toMatchObject({ type: 'ban' });
  });

  it('POST notification validates title/body/type', async () => {
    const bad = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/notifications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '', body: 'x', type: 'bogus' });
    expect([400, 422]).toContain(bad.status);

    const ok = await ctx.agent
      .post(`/api/admin/passengers/${PASSENGER_ID}/notifications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Trip soon', body: 'Your trip starts in 30 minutes', type: 'trip' });
    expect(ok.status).toBe(200);
    expect(ok.body.notification).toMatchObject({ category: 'trip' });
  });

  it('non-admin role is forbidden', async () => {
    const res = await ctx.agent
      .get('/api/admin/passengers/stats')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});
