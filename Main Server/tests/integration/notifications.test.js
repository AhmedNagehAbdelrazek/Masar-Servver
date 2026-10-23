const { getAgent } = require('../setup/setup');
const { User, Notification } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const OWNER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const OTHER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';

let ownerToken;

async function seedUser(id, phoneSuffix) {
  return User.create({
    id,
    fullName: `User ${id.slice(0, 8)}`,
    phone: `+96279${phoneSuffix}`,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
}

async function seedNotification(userId, overrides = {}) {
  return Notification.create({
    userId,
    type: 'TRIP_CANCELLED',
    title: 'Trip cancelled',
    body: 'Your trip Amman → Irbid was cancelled.',
    data: { tripId: 'abc' },
    isRead: false,
    sentVia: ['in_app'],
    ...overrides,
  });
}

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await User.destroy({ where: { id: [OWNER_ID, OTHER_ID] }, force: true });

  await seedUser(OWNER_ID, '80000001');
  await seedUser(OTHER_ID, '80000002');
  ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
});

describe('GET /api/notifications', () => {
  it('should return only own notifications, newest first, with pagination', async () => {
    await seedNotification(OWNER_ID);
    await seedNotification(OWNER_ID, { type: 'PLAN_EXPIRED', title: 'Plan expired' });
    await seedNotification(OTHER_ID);

    const res = await getAgent()
      .get('/api/notifications')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.total_pages).toBe(1);
    expect(res.body.data[0].title).toBe('Plan expired');
    expect(res.body.data[1].title).toBe('Trip cancelled');
    expect(res.body.data.every((n) => n.is_read === false)).toBe(true);
    expect(res.body.data[0]).toMatchObject({
      id: expect.any(String),
      type: expect.any(String),
      title: expect.any(String),
      body: expect.any(String),
      is_read: expect.any(Boolean),
      created_at: expect.any(String),
    });
  });

  it('should filter unread=true / unread=false', async () => {
    await seedNotification(OWNER_ID);
    await seedNotification(OWNER_ID, { isRead: true });

    const unreadRes = await getAgent()
      .get('/api/notifications?unread=true')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.data).toHaveLength(1);
    expect(unreadRes.body.data[0].is_read).toBe(false);

    const readRes = await getAgent()
      .get('/api/notifications?unread=false')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.data).toHaveLength(1);
    expect(readRes.body.data[0].is_read).toBe(true);
  });

  it('should require authentication', async () => {
    const res = await getAgent().get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  it('should mark an unread notification as read', async () => {
    const notification = await seedNotification(OWNER_ID);

    const res = await getAgent()
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.id).toBe(notification.id);
    expect(res.body.notification.is_read).toBe(true);

    const persisted = await Notification.findByPk(notification.id);
    expect(persisted.isRead).toBe(true);
  });

  it('should reject marking someone else\'s notification as read', async () => {
    const notification = await seedNotification(OTHER_ID);

    const res = await getAgent()
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for a nonexistent notification', async () => {
    const res = await getAgent()
      .put('/api/notifications/00000000-0000-0000-0000-000000000000/read')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/notifications/device', () => {
  const TOKEN = 'fcm-token-owner-1234567890';
  const SHARED_TOKEN = 'fcm-token-shared-1234567890';

  it('should store the FCM token on the authenticated user', async () => {
    const res = await getAgent()
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fcm_token: TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.device.registered).toBe(true);

    const persisted = await User.findByPk(OWNER_ID);
    expect(persisted.fcmToken).toBe(TOKEN);
  });

  it('should refresh the token when the same user registers again', async () => {
    await User.update({ fcmToken: TOKEN }, { where: { id: OWNER_ID } });

    const res = await getAgent()
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fcm_token: 'fcm-token-owner-refreshed-1234567890' });

    expect(res.status).toBe(200);
    expect(res.body.device.registered).toBe(true);

    const persisted = await User.findByPk(OWNER_ID);
    expect(persisted.fcmToken).toBe('fcm-token-owner-refreshed-1234567890');
  });

  it('should detach the token from the previous account (shared device)', async () => {
    await User.update({ fcmToken: SHARED_TOKEN }, { where: { id: OTHER_ID } });

    const res = await getAgent()
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fcm_token: SHARED_TOKEN });

    expect(res.status).toBe(200);

    const owner = await User.findByPk(OWNER_ID);
    const other = await User.findByPk(OTHER_ID);
    expect(owner.fcmToken).toBe(SHARED_TOKEN);
    expect(other.fcmToken).toBeNull();
  });

  it('should reject a missing or blank token with 422', async () => {
    const missing = await getAgent()
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({});

    expect(missing.status).toBe(422);
    expect(missing.body.code).toBe('VALIDATION_ERROR');

    const blank = await getAgent()
      .post('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fcm_token: '   ' });

    expect(blank.status).toBe(422);
  });

  it('should require authentication', async () => {
    const res = await getAgent()
      .post('/api/notifications/device')
      .send({ fcm_token: TOKEN });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/notifications/device', () => {
  const TOKEN = 'fcm-token-logout-1234567890';

  it('should clear the stored FCM token', async () => {
    await User.update({ fcmToken: TOKEN }, { where: { id: OWNER_ID } });

    const res = await getAgent()
      .delete('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fcm_token: TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.device.registered).toBe(false);

    const persisted = await User.findByPk(OWNER_ID);
    expect(persisted.fcmToken).toBeNull();
  });

  it('should not clear a newer token when a stale device logs out', async () => {
    await User.update({ fcmToken: 'fcm-token-newer-1234567890' }, { where: { id: OWNER_ID } });

    const res = await getAgent()
      .delete('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ fcm_token: TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.device.registered).toBe(true);

    const persisted = await User.findByPk(OWNER_ID);
    expect(persisted.fcmToken).toBe('fcm-token-newer-1234567890');
  });

  it('should clear the token when no token is provided', async () => {
    await User.update({ fcmToken: TOKEN }, { where: { id: OWNER_ID } });

    const res = await getAgent()
      .delete('/api/notifications/device')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.device.registered).toBe(false);

    const persisted = await User.findByPk(OWNER_ID);
    expect(persisted.fcmToken).toBeNull();
  });

  it('should require authentication', async () => {
    const res = await getAgent().delete('/api/notifications/device');

    expect(res.status).toBe(401);
  });
});
