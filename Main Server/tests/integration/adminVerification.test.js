const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, UploadedImage, Notification } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_PHONE = '+962790000000';
const DRIVER_PHONE = '+962791111111';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';

let adminToken;

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { phone: [ADMIN_PHONE, DRIVER_PHONE] }, force: true });

  await User.create({
    id: ADMIN_ID,
    fullName: 'Admin User',
    phone: ADMIN_PHONE,
    countryCode: 'JO',
    role: 'admin',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: DRIVER_ID,
    fullName: 'Omar Khaled',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: false,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

async function seedDriverProfile() {
  const img = await UploadedImage.create({
    hash: `h${Date.now()}`,
    url: 'https://res.cloudinary.com/example/id_front.jpg',
    filename: 'id_front.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  });
  await DriverProfile.create({
    driverId: DRIVER_ID,
    userIdentificationFront: img.id,
    nationalID: '1234567890',
    idVerified: false,
  });
  return img;
}

async function seedVehicle() {
  const img = await UploadedImage.create({
    hash: `h${Date.now()}`,
    url: 'https://res.cloudinary.com/example/reg.jpg',
    filename: 'reg.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  });
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Corolla',
    vehicleType: 'sedan',
    modelYear: 2022,
    plateNumber: '77-99999',
    seats: 4,
    registrationDocFront: img.id,
    isVerified: false,
  });
  return img;
}

describe('US5 - Admin Verification', () => {
  describe('GET /api/admin/verification/queue', () => {
    it('should list pending drivers and vehicles with document URLs', async () => {
      await seedDriverProfile();
      await seedVehicle();

      const res = await getAgent()
        .get('/api/admin/verification/queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);

      const driver = res.body.data.find((d) => d.type === 'driver');
      expect(driver.driver_id).toBe(DRIVER_ID);
      expect(driver.full_name).toBe('Omar Khaled');
      expect(driver.phone).toContain('***');
      expect(driver.id_verified).toBe(false);
      expect(driver.documents.length).toBeGreaterThanOrEqual(1);
      expect(driver.documents[0].label).toBe('national_id_front');
      expect(driver.documents[0].url).toContain('https://');

      const vehicle = res.body.data.find((d) => d.type === 'vehicle');
      expect(vehicle.vehicle_id).toBe(VEHICLE_ID);
      expect(vehicle.plate_number).toBe('77-99999');
      expect(vehicle.is_verified).toBe(false);
    });

    it('should filter by type', async () => {
      await seedDriverProfile();
      await seedVehicle();

      const res = await getAgent()
        .get('/api/admin/verification/queue')
        .query({ type: 'vehicle' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('vehicle');
    });

    it('should reject non-admin with 403', async () => {
      const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
      const res = await getAgent()
        .get('/api/admin/verification/queue')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/admin/verification/drivers/:driver_id/approve', () => {
    it('should approve driver, set id_verified true, and notify', async () => {
      await seedDriverProfile();

      const res = await getAgent()
        .post(`/api/admin/verification/drivers/${DRIVER_ID}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.driver_id).toBe(DRIVER_ID);
      expect(res.body.id_verified).toBe(true);
      expect(res.body.notified).toBe(true);

      const profile = await DriverProfile.findOne({ where: { driverId: DRIVER_ID } });
      expect(profile.idVerified).toBe(true);

      const notifications = await Notification.findAll({
        where: { userId: DRIVER_ID, type: 'VERIFICATION_APPROVED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/admin/verification/drivers/:driver_id/reject', () => {
    it('should reject with reason and notify; resubmission re-enters queue', async () => {
      await seedDriverProfile();

      const res = await getAgent()
        .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'License document illegible — please re-upload' });

      expect(res.status).toBe(200);
      expect(res.body.id_verified).toBe(false);
      expect(res.body.reason).toContain('illegible');
      expect(res.body.notified).toBe(true);

      const notifications = await Notification.findAll({
        where: { userId: DRIVER_ID, type: 'VERIFICATION_REJECTED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);

      await DriverProfile.update(
        { userIdentificationFront: (await UploadedImage.create({
          hash: `h${Date.now()}b`,
          url: 'https://res.cloudinary.com/example/new.jpg',
          filename: 'new.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        })).id },
        { where: { driverId: DRIVER_ID } }
      );

      const queueRes = await getAgent()
        .get('/api/admin/verification/queue')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(queueRes.body.data.some((d) => d.type === 'driver' && d.driver_id === DRIVER_ID)).toBe(true);
    });

    it('should reject missing reason with 422', async () => {
      await seedDriverProfile();
      const res = await getAgent()
        .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/admin/verification/vehicles/:vehicle_id/approve', () => {
    it('should approve vehicle and set is_verified true', async () => {
      await seedVehicle();

      const res = await getAgent()
        .post(`/api/admin/verification/vehicles/${VEHICLE_ID}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.vehicle_id).toBe(VEHICLE_ID);
      expect(res.body.is_verified).toBe(true);

      const vehicle = await Vehicle.findByPk(VEHICLE_ID);
      expect(vehicle.isVerified).toBe(true);
    });
  });

  describe('POST /api/admin/verification/vehicles/:vehicle_id/reject', () => {
    it('should reject vehicle, store reason, and notify owner', async () => {
      await seedVehicle();

      const res = await getAgent()
        .post(`/api/admin/verification/vehicles/${VEHICLE_ID}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Registration expired' });

      expect(res.status).toBe(200);
      expect(res.body.is_verified).toBe(false);
      expect(res.body.reason).toBe('Registration expired');

      const vehicle = await Vehicle.findByPk(VEHICLE_ID);
      expect(vehicle.verificationNotes).toBe('Registration expired');

      const notifications = await Notification.findAll({
        where: { userId: DRIVER_ID, type: 'VERIFICATION_REJECTED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });
});
