const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, UploadedImage } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';

let adminToken;

beforeEach(async () => {
  await DriverProfile.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [ADMIN_ID, DRIVER_ID] }, force: true });

  await User.create({
    id: ADMIN_ID, fullName: 'Contract Admin', phone: '+962790000001',
    countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: DRIVER_ID, fullName: 'Contract Driver', phone: '+962798888888',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: false,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

describe('US5 Contract - Admin Verification', () => {
  it('GET /queue returns paginated items with documents', async () => {
    const img = await UploadedImage.create({
      hash: `h${Date.now()}`,
      url: 'https://res.cloudinary.com/example/id.jpg',
      filename: 'id.jpg', mimetype: 'image/jpeg', size: 1024,
    });
    await DriverProfile.create({
      driverId: DRIVER_ID,
      userIdentificationFront: img.id,
      nationalID: '1234567890',
      idVerified: false,
    });

    const res = await getAgent()
      .get('/api/admin/verification/queue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination.total_pages).toBe(1);
    const item = res.body.data[0];
    expect(item.type).toBe('driver');
    expect(item.driver_id).toBe(DRIVER_ID);
    expect(item.full_name).toBe('Contract Driver');
    expect(item.phone).toContain('***');
    expect(item.documents).toEqual([{ label: 'national_id_front', url: 'https://res.cloudinary.com/example/id.jpg' }]);
    expect(item.id_verified).toBe(false);
  });

  it('approve returns driver_id envelope', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const res = await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver_id).toBe(DRIVER_ID);
    expect(res.body.id_verified).toBe(true);
    expect(res.body.notified).toBe(true);
  });

  it('reject requires reason (422)', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const res = await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('approve vehicle returns vehicle_id envelope', async () => {
    await Vehicle.create({
      id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
      vehicleType: 'sedan', modelYear: 2022, plateNumber: 'CTR-555', seats: 4, isVerified: false,
    });

    const res = await getAgent()
      .post(`/api/admin/verification/vehicles/${VEHICLE_ID}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicle_id).toBe(VEHICLE_ID);
    expect(res.body.is_verified).toBe(true);
    expect(res.body.notified).toBe(true);
  });
});
