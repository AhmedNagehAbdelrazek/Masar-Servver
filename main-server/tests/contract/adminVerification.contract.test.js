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

describe('US7/US8 Contract - Admin Verification', () => {
  it('GET /queue returns combined driver+vehicle package with meta', async () => {
    const img = await UploadedImage.create({
      hash: `h${Date.now()}`,
      url: 'https://res.cloudinary.com/example/id.jpg',
      filename: 'id.jpg', mimetype: 'image/jpeg', size: 1024,
    });
    await User.update({ verificationStatus: 'pending' }, { where: { id: DRIVER_ID } });
    await DriverProfile.create({
      driverId: DRIVER_ID,
      userIdentificationFront: img.id,
      nationalID: '1234567890',
      idVerified: false,
    });
    await Vehicle.create({
      id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
      vehicleType: 'sedan', modelYear: 2022, plateNumber: 'CTR-555', seats: 4, isVerified: false,
    });

    const res = await getAgent()
      .get('/api/admin/verification/queue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.requests)).toBe(true);
    expect(res.body.data.meta.total_pages).toBe(1);
    expect(res.body.data.meta.total).toBe(1);

    const item = res.body.data.requests[0];
    expect(item.id).toBe(DRIVER_ID);
    expect(item.status.value).toBe('pending');
    expect(item.driver.user_id).toBe(DRIVER_ID);
    expect(item.driver.full_name).toBe('Contract Driver');
    expect(item.driver.phone).toContain('***');
    expect(item.driver.user_identification_front).toBe(img.id);
    expect(item.driver.national_id).toBe('1234567890');
    expect(item.vehicle.vehicle_id).toBe(VEHICLE_ID);
    expect(item.vehicle.plate_number).toBe('CTR-555');
    expect(item.documents).toEqual([{ label: 'national_id_front', url: 'https://res.cloudinary.com/example/id.jpg' }]);
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

  it('reject without reason or fields_to_fix (422)', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const res = await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('reject with reason but without fields_to_fix (422)', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const res = await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Documents illegible' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('valid reject with reason + fields_to_fix succeeds', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const res = await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Documents illegible', fields_to_fix: ['license', 'vehicle_photo'] });

    expect(res.status).toBe(200);
    expect(res.body.driver_id).toBe(DRIVER_ID);
    expect(res.body.id_verified).toBe(false);
    expect(res.body.reason).toBe('Documents illegible');
    expect(res.body.notified).toBe(true);
  });

  it('reject with invalid field keys (422)', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const res = await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Documents illegible', fields_to_fix: ['not_a_real_key'] });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
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
