// Admin subscriptions dossier: stats/queue/detail + free-plan config.
// Figma: 10831:13497, 10840:36658/37484, 10835:32759/33623, 10846:39083/42189/42450.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = '7b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '7b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PLAN_ID = '7b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a11';
const FREE_PLAN_ID = '7b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a12';
const SUB_ID = '7b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b11';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Admin subscriptions dossier', () => {
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
      },
    });
    await ctx.prisma.subscriptionPlan.create({
      data: {
        id: PLAN_ID,
        name: 'Basic 16',
        periodDays: 30,
        percentageCut: 7,
        cost: 16,
        isActive: true,
      },
    });
    await ctx.prisma.subscriptionPlan.create({
      data: {
        id: FREE_PLAN_ID,
        name: 'Free trial',
        periodDays: 30,
        percentageCut: 0,
        cost: 0,
        isFree: true,
        freeOffer: { type: 'free_trips', value: 10 },
        isActive: true,
      },
    });
    const shot = await ctx.prisma.uploadedImage.create({
      data: {
        hash: 'receipt-hash-1',
        url: 'https://res.cloudinary.com/demo/receipt.png',
        filename: 'receipt.png',
        mimetype: 'image/png',
      },
    });
    await ctx.prisma.driverSubscription.create({
      data: {
        id: SUB_ID,
        driverId: DRIVER_ID,
        planId: PLAN_ID,
        planName: 'Basic 16',
        planPeriodDays: 30,
        planPercentageCut: 7,
        planCost: 16,
        paymentMethod: { name: 'CliQ', account: '0791234567' },
        screenshotId: shot.id,
        status: 'pending_approval',
      },
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it('GET /api/admin/subscriptions/stats returns the four cards', async () => {
    const res = await ctx.agent
      .get('/api/admin/subscriptions/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_subscribers: 0,
      active_subscriptions: 0,
      pending_review: 1,
      rejected: 0,
    });
  });

  it('GET pending filters by search + plan + date', async () => {
    const search = await ctx.agent
      .get('/api/admin/subscriptions/pending?search=Omar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(search.status).toBe(200);
    expect(search.body.pending).toHaveLength(1);

    const miss = await ctx.agent
      .get('/api/admin/subscriptions/pending?search=Nobody')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(miss.status).toBe(200);
    expect(miss.body.pending).toHaveLength(0);

    const plan = await ctx.agent
      .get(`/api/admin/subscriptions/pending?plan_id=${PLAN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(plan.body.pending).toHaveLength(1);

    const today = new Date().toISOString().split('T')[0];
    const dated = await ctx.agent
      .get(`/api/admin/subscriptions/pending?from=${today}&to=${today}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(dated.body.pending).toHaveLength(1);
  });

  it('GET /api/admin/subscriptions/:id returns the review dossier', async () => {
    const res = await ctx.agent
      .get(`/api/admin/subscriptions/${SUB_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription).toMatchObject({ id: SUB_ID, status: 'pending_approval' });
    expect(res.body.driver).toMatchObject({ full_name: 'Omar Khaled' });
    expect(res.body.plan).toMatchObject({ name: 'Basic 16' });
    expect(res.body.transfer.screenshot_url).toContain('res.cloudinary.com');
    expect(res.body.history.map((e: { event: string }) => e.event)).toContain('submitted');

    const unknown = await ctx.agent
      .get(`/api/admin/subscriptions/${UNKNOWN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(unknown.status).toBe(404);
  });

  it('approve moves the dossier to decided history + stats', async () => {
    const ok = await ctx.agent
      .post(`/api/admin/subscriptions/${SUB_ID}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);

    const detail = await ctx.agent
      .get(`/api/admin/subscriptions/${SUB_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.body.subscription.status).toBe('active');
    expect(detail.body.history.map((e: { event: string }) => e.event)).toContain('approved');

    const stats = await ctx.agent
      .get('/api/admin/subscriptions/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(stats.body).toMatchObject({ total_subscribers: 1, active_subscriptions: 1 });
  });

  it('GET/PUT /api/admin/plans/free manages the free-plan config', async () => {
    const get = await ctx.agent
      .get('/api/admin/plans/free')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(get.status).toBe(200);
    expect(get.body.plan).toMatchObject({ id: FREE_PLAN_ID, is_free: true });

    const put = await ctx.agent
      .put('/api/admin/plans/free')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ period_days: 15 });
    expect(put.status).toBe(200);
    expect(put.body.plan.period_days).toBe(15);
  });

  it('plan list carries subscriber counts + is_active toggles', async () => {
    const list = await ctx.agent
      .get('/api/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.plans.find((p: { id: string }) => p.id === PLAN_ID)).toMatchObject({
      active_subscribers: 0,
    });

    const off = await ctx.agent
      .put(`/api/admin/plans/${PLAN_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_active: false });
    expect(off.status).toBe(200);
    expect(off.body.plan.is_active).toBe(false);
  });

  it('driver role is forbidden on the dossier', async () => {
    const res = await ctx.agent
      .get('/api/admin/subscriptions/stats')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });
});
