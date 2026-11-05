const { getAgent } = require('../setup/setup');
const { User, DriverProfile, SubscriptionPlan, PaymentMethod, DriverSubscription, UploadedImage } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440e01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e02';

let adminToken;
let driverToken;
let plan;
let method;
let screenshot;

beforeEach(async () => {
  await DriverSubscription.destroy({ where: {}, force: true });
  await UploadedImage.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await PaymentMethod.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962710000301', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: DRIVER_ID, fullName: 'Driver Three', phone: '+962710000302', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
  await DriverProfile.create({ driverId: DRIVER_ID, nationalID: 'N5554443' });

  plan = await SubscriptionPlan.create({
    name: 'Basic',
    periodDays: 30,
    percentageCut: 8,
    cost: 15,
    features: [],
    isFree: false,
    isActive: true,
  });
  method = await PaymentMethod.create({
    name: 'Bank of Jordan',
    accountNumber: 'JO94BOJX0000000000',
    type: 'bank_account',
    email: 'payments@boj.com',
    isActive: true,
  });

  screenshot = await UploadedImage.create({
    hash: 'admin-subscription-screenshot-hash',
    url: 'https://res.cloudinary.com/x/screenshot.jpg',
    filename: 'admin-subscription-screenshot.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

async function createPending() {
  const res = await getAgent()
    .post('/api/subscriptions')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      plan_id: plan.id,
      payment_method_id: method.id,
      screenshot_id: screenshot.id,
    });
  expect(res.status).toBe(201);
  return res.body.subscription_id;
}

describe('Admin pending queue - US2', () => {
  it('lists pending requests with masked national id', async () => {
    await createPending();

    const res = await getAgent().get('/api/admin/subscriptions/pending').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pending).toHaveLength(1);
    expect(res.body.pending[0].driver.national_id_masked).toBe('****4443');
    expect(res.body.pending[0].driver.full_name).toBe('Driver Three');
    expect(res.body.pending[0].plan.name).toBe('Basic');
    expect(res.body.pending[0].payment_method.name).toBe('Bank of Jordan');
    expect(res.body.pending[0].screenshot_id).toBe(screenshot.id);
    expect(res.body.pending[0].screenshot_url).toContain('res.cloudinary.com');
  });
});

describe('Admin approval - US2', () => {
  it('approves, credits balance, sets expiry and activates the plan', async () => {
    const id = await createPending();

    const res = await getAgent().post(`/api/admin/subscriptions/${id}/approve`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.subscription_id).toBe(id);
    expect(res.body.balance_added).toBe(15);

    const sub = await DriverSubscription.findByPk(id);
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.ACTIVE);
    expect(sub.approvedAt).not.toBeNull();
    expect(sub.activatedAt).not.toBeNull();
    expect(sub.expiresAt).not.toBeNull();
    expect(Number(sub.balance)).toBe(15);

    const user = await User.findByPk(DRIVER_ID);
    expect(Number(user.totalBalance)).toBe(15);
    expect(user.isInDebt).toBe(false);
  });

  it('clears debt before adding positive balance', async () => {
    await User.update({ totalBalance: -10, isInDebt: true }, { where: { id: DRIVER_ID } });

    const id = await createPending();
    const res = await getAgent().post(`/api/admin/subscriptions/${id}/approve`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.balance_added).toBe(15);

    const user = await User.findByPk(DRIVER_ID);
    expect(Number(user.totalBalance)).toBe(5);
    expect(user.isInDebt).toBe(false);
  });

  it('is first-action-wins: second approve returns 409 REQUEST_ALREADY_PROCESSED', async () => {
    const id = await createPending();

    const first = await getAgent().post(`/api/admin/subscriptions/${id}/approve`).set('Authorization', `Bearer ${adminToken}`);
    expect(first.status).toBe(200);

    const second = await getAgent().post(`/api/admin/subscriptions/${id}/approve`).set('Authorization', `Bearer ${adminToken}`);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('REQUEST_ALREADY_PROCESSED');
  });

  it('is blocked when the plan is deactivated (APPROVAL_BLOCKED)', async () => {
    const id = await createPending();
    await plan.update({ isActive: false });

    const res = await getAgent().post(`/api/admin/subscriptions/${id}/approve`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('APPROVAL_BLOCKED');
  });
});

describe('Admin rejection - US2', () => {
  it('rejects with a reason and records admin_notes', async () => {
    const id = await createPending();

    const res = await getAgent()
      .post(`/api/admin/subscriptions/${id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Payment proof unclear' });

    expect(res.status).toBe(200);
    expect(res.body.subscription_id).toBe(id);

    const sub = await DriverSubscription.findByPk(id);
    expect(sub.status).toBe(SUBSCRIPTION_STATUS.REJECTED);
    expect(sub.adminNotes).toBe('Payment proof unclear');
  });

  it('reject is first-action-wins after approval', async () => {
    const id = await createPending();
    await getAgent().post(`/api/admin/subscriptions/${id}/approve`).set('Authorization', `Bearer ${adminToken}`);

    const res = await getAgent()
      .post(`/api/admin/subscriptions/${id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Too late' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('REQUEST_ALREADY_PROCESSED');
  });

  it('reject requires a non-empty reason (422)', async () => {
    const id = await createPending();
    const res = await getAgent()
      .post(`/api/admin/subscriptions/${id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: '' });

    expect(res.status).toBe(422);
  });
});
