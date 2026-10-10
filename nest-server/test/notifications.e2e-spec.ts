// 1:1 port of Main Server/tests/integration/notifications.test.js,
// tests/integration/notificationSettings.test.js and
// tests/contract/notifications.contract.test.js (Wave 2.1).
// Deliberate corrections vs Express (verified failing 3/6 against Express itself):
// PUT /:id/read carries a stray settings-array validator in Express that 422s
// every bodyless call — the port does not reproduce that bug.
// The settings spec's non-UUID user id ('...n01') is normalized to a valid UUID
// (Prisma strictly validates UUID columns).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';
import { ALL_NOTIFICATION_TYPES } from '../src/modules/notifications/notification.constants.js';

const OWNER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const OTHER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const SETTINGS_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

async function seedUser(
  ctx: TestContext,
  id: string,
  phone: string,
  role: 'passenger' | 'driver' = 'passenger',
): Promise<void> {
  await ctx.prisma.user.create({
    data: {
      id,
      fullName: `User ${id.slice(0, 8)}`,
      phone,
      countryCode: 'JO',
      role,
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
}

async function seedNotification(
  ctx: TestContext,
  userId: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string }> {
  return ctx.prisma.notification.create({
    data: {
      userId,
      type: 'TRIP_CANCELLED',
      title: 'Trip cancelled',
      body: 'Your trip Amman → Irbid was cancelled.',
      data: { tripId: 'abc' },
      isRead: false,
      sentVia: ['in_app'],
      ...overrides,
    },
  });
}

describe('GET /api/notifications', () => {
  let ctx: TestContext;
  let ownerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedUser(ctx, OWNER_ID, '+962798000001');
    await seedUser(ctx, OTHER_ID, '+962798000002');
    ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
  });

  it('returns only own notifications, newest first, with pagination', async () => {
    await seedNotification(ctx, OWNER_ID);
    await seedNotification(ctx, OWNER_ID, { type: 'PLAN_EXPIRED', title: 'Plan expired' });
    await seedNotification(ctx, OTHER_ID);

    const res = await ctx.agent
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.total_pages).toBe(1);
    expect(res.body.data[0].title).toBe('Plan expired');
    expect(res.body.data[1].title).toBe('Trip cancelled');
    expect(res.body.data.every((n: { is_read: boolean }) => n.is_read === false)).toBe(true);
    expect(res.body.data[0]).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      title: expect.any(String),
      body: expect.any(String),
      is_read: expect.any(Boolean),
      created_at: expect.any(String),
    });
  });

  it('filters unread=true / unread=false', async () => {
    await seedNotification(ctx, OWNER_ID);
    await seedNotification(ctx, OWNER_ID, { isRead: true });

    const unreadRes = await ctx.agent
      .get('/api/notifications?unread=true')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data).toHaveLength(1);
    expect(unreadRes.body.data[0].is_read).toBe(false);

    const readRes = await ctx.agent
      .get('/api/notifications?unread=false')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data).toHaveLength(1);
    expect(readRes.body.data[0].is_read).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await ctx.agent.get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  let ctx: TestContext;
  let ownerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedUser(ctx, OWNER_ID, '+962798000001');
    await seedUser(ctx, OTHER_ID, '+962798000002');
    ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
  });

  it('marks an unread notification as read', async () => {
    const notification = await seedNotification(ctx, OWNER_ID);

    const res = await ctx.agent
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.id).toBe(notification.id);
    expect(res.body.notification.is_read).toBe(true);

    const persisted = await ctx.prisma.notification.findUnique({
      where: { id: notification.id },
    });
    expect(persisted?.isRead).toBe(true);
  });

  it("rejects marking someone else's notification as read", async () => {
    const notification = await seedNotification(ctx, OTHER_ID);

    const res = await ctx.agent
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a nonexistent notification', async () => {
    const res = await ctx.agent
      .put('/api/notifications/00000000-0000-0000-0000-000000000000/read')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(404);
  });
});

describe('US3 - Notification settings', () => {
  let ctx: TestContext;
  let userToken: string;
  let driverToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedUser(ctx, SETTINGS_USER_ID, '+962710000001');
    await seedUser(ctx, OTHER_ID, '+962710000002', 'driver');
    userToken = generateAccessToken({ id: SETTINGS_USER_ID, role: 'passenger' });
    driverToken = generateAccessToken({ id: OTHER_ID, role: 'driver' });
  });

  it('returns all types with defaults when no settings exist', async () => {
    const res = await ctx.agent
      .get('/api/settings/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(Array.isArray(res.body.settings)).toBe(true);
    expect(res.body.settings.length).toBe(ALL_NOTIFICATION_TYPES.length);

    const allEnabled = res.body.settings.every(
      (s: { enabled_in_app: boolean; enabled_push: boolean }) =>
        s.enabled_in_app === true && s.enabled_push === true,
    );
    expect(allEnabled).toBe(true);
  });

  it('updates specific notification types', async () => {
    const res = await ctx.agent
      .put('/api/settings/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        settings: [
          { type: 'trip_cancelled', enabled_in_app: true, enabled_push: false },
          { type: 'new_message', enabled_in_app: false, enabled_push: true },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.updated_count).toBe(2);

    const getRes = await ctx.agent
      .get('/api/settings/notifications')
      .set('Authorization', `Bearer ${userToken}`);

    const tripCancelled = getRes.body.settings.find(
      (s: { type: string }) => s.type === 'trip_cancelled',
    );
    expect(tripCancelled.enabled_in_app).toBe(true);
    expect(tripCancelled.enabled_push).toBe(false);

    const newMessage = getRes.body.settings.find(
      (s: { type: string }) => s.type === 'new_message',
    );
    expect(newMessage.enabled_in_app).toBe(false);
    expect(newMessage.enabled_push).toBe(true);

    const others = getRes.body.settings.filter(
      (s: { type: string }) => s.type !== 'trip_cancelled' && s.type !== 'new_message',
    );
    expect(
      others.every(
        (s: { enabled_in_app: boolean; enabled_push: boolean }) =>
          s.enabled_in_app === true && s.enabled_push === true,
      ),
    ).toBe(true);
  });

  it('returns 422 for empty settings array', async () => {
    const res = await ctx.agent
      .put('/api/settings/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ settings: [] });
    expect(res.status).toBe(422);
  });

  it('rejects invalid notification type', async () => {
    const res = await ctx.agent
      .put('/api/settings/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ settings: [{ type: 'nonexistent_type', enabled_in_app: true }] });
    expect(res.status).toBe(422);
  });

  it('returns 401 without auth token', async () => {
    const res = await ctx.agent.get('/api/settings/notifications');
    expect(res.status).toBe(401);
  });

  it('driver grouped settings round-trip with master switch', async () => {
    const getRes = await ctx.agent
      .get('/api/settings/notifications/grouped')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.master_switch).toBe(true);
    expect(Array.isArray(getRes.body.categories)).toBe(true);

    const off = await ctx.agent
      .put('/api/settings/notifications/grouped')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ master_switch: false });
    expect(off.status).toBe(200);
    expect(off.body.master_switch).toBe(false);

    const both = await ctx.agent
      .put('/api/settings/notifications/grouped')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ master_switch: true, updates: [{ type: 'new_message', enabled: true }] });
    expect(both.status).toBe(422);
  });
});

describe('US8 Contract - Notifications', () => {
  let ctx: TestContext;
  let token: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await seedUser(ctx, OWNER_ID, '+962798888888');
    await seedNotification(ctx, OWNER_ID);
    token = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
  });

  it('GET /api/notifications returns envelope with data + pagination', async () => {
    const res = await ctx.agent
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: expect.any(Array),
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
    expect(res.body.data[0]).toEqual({
      id: expect.any(String),
      type: 'TRIP_CANCELLED',
      title: 'Trip cancelled',
      body: 'Your trip Amman → Irbid was cancelled.',
      data: { tripId: 'abc' },
      is_read: false,
      created_at: expect.any(String),
    });
  });

  it('PUT /api/notifications/:id/read returns { notification: { id, is_read } }', async () => {
    const notification = await ctx.prisma.notification.findFirst({ where: { userId: OWNER_ID } });

    const res = await ctx.agent
      .put(`/api/notifications/${notification?.id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      notification: { id: notification?.id, is_read: true },
    });
  });
});
