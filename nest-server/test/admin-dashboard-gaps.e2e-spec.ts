// Dashboard audit gaps: driver notifications, home KPIs, drivers export,
// ban confirmation + lift closes bans.
// Figma: 9928:23297, 9524:10053, 9695:33146, 10012:23728/23988, 10004:22773.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '8b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '8b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '8b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';

describe('Admin dashboard audit gaps', () => {
  let ctx: TestContext;
  let adminToken: string;
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
        id: DRIVER_ID,
        fullName: 'Omar Khaled',
        phone: '+962798800001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        verificationStatus: 'approved',
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
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('POST drivers/:id/notifications validates + delivers', async () => {
    const bad = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/notifications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '', body: 'x', type: 'bogus' });
    expect([400, 422]).toContain(bad.status);

    const ok = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/notifications`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Package expiring', body: 'Renew soon', type: 'package' });
    expect(ok.status).toBe(200);
    expect(ok.body.notification).toMatchObject({ category: 'package' });

    const row = await ctx.prisma.notification.findFirst({
      where: { userId: DRIVER_ID, type: 'ADMIN_NOTICE' },
    });
    expect(row?.title).toBe('Package expiring');
  });

  it('summary carries the home KPI cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.kpis).toMatchObject({
      bookings_today: 0,
      trips_today: 0,
      total_passengers: 1,
      pending_payments: 0,
      new_ride_requests: 0,
    });
  });

  it('GET drivers/export returns CSV with masked phones', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers/export?search=Omar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('id,full_name,phone,account_status,created_at');
    expect(res.text).toContain(DRIVER_ID);
    expect(res.text).not.toContain('+962798800001');
  });

  it('generic ban requires the log-review confirmation', async () => {
    const denied = await ctx.agent
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: DRIVER_ID, type: 'ban', reason: 'Fraud' });
    expect(denied.status).toBe(422);

    const ok = await ctx.agent
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: DRIVER_ID, type: 'ban', reason: 'Fraud', confirm_reviewed_log: true });
    expect(ok.status).toBe(200);
    expect(ok.body.penalty).toMatchObject({ type: 'ban' });

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.status).toBe('banned');
  });

  it('lifting closes the open ban record', async () => {
    await ctx.agent
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: DRIVER_ID, type: 'ban', reason: 'Fraud', confirm_reviewed_log: true });

    const lift = await ctx.agent
      .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reactivate' });
    expect(lift.status).toBe(200);
    expect(lift.body.driver).toMatchObject({ account_status: 'active' });

    const open = await ctx.prisma.penalty.findMany({
      where: { userId: DRIVER_ID, type: 'ban', endsAt: null },
    });
    expect(open).toHaveLength(0);
  });

  it('driver role is forbidden on the new routes', async () => {
    const res = await ctx.agent
      .get('/api/admin/dashboard/drivers/export')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });
});
