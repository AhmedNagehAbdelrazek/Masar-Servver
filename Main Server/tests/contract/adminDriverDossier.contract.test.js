const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, DriverProfile, DriverSubscription, UploadedImage, SubscriptionPlan,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = 'a7000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a7000000-0000-4000-8000-000000000002';
let adminToken;

beforeAll(async () => {
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  await User.destroy({ where: {}, force: true });
  await UploadedImage.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });

  await User.bulkCreate([
    { id: ADMIN_ID, fullName: 'Admin', phone: '+962700007001', role: 'admin', passwordHash: 'x', isVerified: true },
    {
      id: DRIVER_ID, fullName: 'Dossier Driver', phone: '+962780007002', role: 'driver',
      passwordHash: 'x', isVerified: true, verificationStatus: 'approved',
    },
  ]);
  const img = await UploadedImage.create({
    hash: `hash-contract-${Date.now()}`, url: 'http://img/x.jpg', filename: 'x.jpg', mimetype: 'image/jpeg',
  });
  await DriverProfile.create({ driverId: DRIVER_ID, userIdentificationFront: img.id });
  await Vehicle.create({
    driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Yaris', vehicleType: 'sedan',
    plateNumber: `F-${Date.now() % 100000}`, seats: 4,
    registrationDocFront: img.id, registrationDocBack: img.id,
  });
  const plan = await SubscriptionPlan.create({
    name: `Pro-${Date.now()}`, periodDays: 30, percentageCut: 10, cost: 12,
    features: [], isFree: false, isActive: true,
  });
  await DriverSubscription.create({
    driverId: DRIVER_ID, planId: plan.id,
    planName: plan.name, planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut, planCost: plan.cost,
    paymentMethod: { kind: 'cash' }, status: 'active',
    activatedAt: new Date('2026-08-01T00:00:00Z'), expiresAt: new Date('2026-08-31T00:00:00Z'),
  });
});

const get = (path) => getAgent()
  .get(`/api/admin/dashboard/drivers/${DRIVER_ID}${path}`)
  .set('Authorization', `Bearer ${adminToken}`);

describe('Contract: dossier tab payload shapes', () => {
  it('header keys', async () => {
    const res = await get('');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([
      'account_status', 'age', 'avatar_url', 'avg_rating', 'balance', 'city', 'id', 'name', 'phone',
      'reviews_count', 'trip_stats',
    ]);
    expect(Object.keys(res.body.trip_stats).sort())
      .toEqual(['canceled_trips', 'completed_trips', 'total_trips']);
  });

  it('overview keys incl. balance_details', async () => {
    const res = await get('/overview');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['balance_details', 'personal_info', 'trip_statistics']);
    expect(Object.keys(res.body.balance_details).sort()).toEqual([
      'duration_days', 'end_date', 'interest_rate', 'price_per_month', 'start_date',
    ]);
  });

  it('trips row keys + pagination', async () => {
    const res = await get('/trips?status=all');
    expect(res.status).toBe(200);
    for (const trip of res.body.data) {
      expect(Object.keys(trip).sort()).toEqual([
        'date_time', 'passengers_count', 'price', 'reservations_count', 'route', 'status', 'trip_id',
      ]);
    }
  });

  it('evaluations keys with complete distribution and review shape', async () => {
    const res = await get('/evaluations');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['distribution', 'pagination', 'reviews', 'summary', 'top_tags']);
    expect(res.body.distribution.map((d) => d.rating)).toEqual([5, 4, 3, 2, 1]);
    for (const review of res.body.reviews) {
      expect(Object.keys(review).sort()).toEqual([
        'comment', 'date', 'passenger_avatar', 'passenger_name', 'rating', 'was_late',
      ]);
    }
  });

  it('account-log keys with summary counters', async () => {
    const res = await get('/account-log');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['log', 'summary']);
    expect(Object.keys(res.body.summary).sort()).toEqual([
      'complaints_against', 'complaints_by', 'suspensions', 'violations', 'warnings',
    ]);
  });

  it('car keys', async () => {
    const res = await get('/car');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['car_info', 'car_photos', 'document_status', 'vehicle_verified']);
    expect(res.body.car_photos).toHaveProperty('front');
    expect(res.body.car_photos).toHaveProperty('rear');
  });

  it('documents grouped shape with status enum values', async () => {
    const res = await get('/documents');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['personal_documents', 'vehicle_documents']);
    for (const doc of [...res.body.personal_documents, ...res.body.vehicle_documents]) {
      expect(['approved', 'rejected', 'pending', 'missing']).toContain(doc.status);
      expect(doc).toHaveProperty('key');
    }
    const personalKeys = res.body.personal_documents.map((d) => d.key);
    expect(personalKeys).toEqual(expect.arrayContaining(['id_front', 'id_back', 'face_photo']));
    const vehicleKeys = res.body.vehicle_documents.map((d) => d.key);
    expect(vehicleKeys).toEqual(expect.arrayContaining(['registration_front', 'insurance']));
  });

  it('unknown driver â†’ 404 error envelope on every tab', async () => {
    for (const path of ['', '/overview', '/trips', '/evaluations', '/account-log', '/car', '/documents']) {
      const res = await getAgent()
        .get(`/api/admin/dashboard/drivers/00000000-0000-4000-8000-000000000099${path}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ status: 'error' });
    }
  });
});
