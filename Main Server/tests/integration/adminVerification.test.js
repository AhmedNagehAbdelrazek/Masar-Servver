const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, DriverProfile, UploadedImage, Notification, VerificationStatusChange,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_PHONE = '+962790000000';
const DRIVER_PHONE = '+962791111111';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';

let adminToken;

beforeEach(async () => {
  await VerificationStatusChange.destroy({ where: {}, force: true });
  await Notification.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
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

describe('US5/US7/US8 - Admin Verification', () => {
  describe('GET /api/admin/verification/queue', () => {
    it('should list the combined pending driver+vehicle package', async () => {
      await User.update({ verificationStatus: 'pending' }, { where: { id: DRIVER_ID } });
      await seedDriverProfile();
      await seedVehicle();

      const res = await getAgent()
        .get('/api/admin/verification/queue')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.requests.length).toBe(1);
      expect(res.body.data.meta.total).toBe(1);

      const item = res.body.data.requests[0];
      expect(item.id).toBe(DRIVER_ID);
      expect(item.status.value).toBe('pending');
      expect(item.driver.user_id).toBe(DRIVER_ID);
      expect(item.driver.full_name).toBe('Omar Khaled');
      expect(item.driver.phone).toContain('***');
      expect(item.driver.national_id).toBe('1234567890');
      expect(item.vehicle.vehicle_id).toBe(VEHICLE_ID);
      expect(item.vehicle.plate_number).toBe('77-99999');
      expect(item.documents.length).toBeGreaterThanOrEqual(2);
      expect(item.documents.some((d) => d.label === 'national_id_front')).toBe(true);
      expect(item.documents[0].url).toContain('https://');
    });

    it('should filter by status', async () => {
      await User.update({ verificationStatus: 'pending' }, { where: { id: DRIVER_ID } });
      await seedDriverProfile();

      const res = await getAgent()
        .get('/api/admin/verification/queue')
        .query({ status: 'approved' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.requests.length).toBe(0);
      expect(res.body.data.meta.total).toBe(0);
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
    it('should approve driver, set user status approved, is_verified true, and notify', async () => {
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

      const user = await User.findByPk(DRIVER_ID);
      expect(user.verificationStatus).toBe('approved');
      expect(user.isVerified).toBe(true);

      const transitions = await VerificationStatusChange.findAll({
        where: { driverId: DRIVER_ID },
      });
      expect(transitions.some((t) => t.toStatus === 'approved')).toBe(true);

      const notifications = await Notification.findAll({
        where: { userId: DRIVER_ID, type: 'VERIFICATION_APPROVED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/admin/verification/drivers/:driver_id/reject', () => {
    it('should reject without fields_to_fix with 422', async () => {
      await seedDriverProfile();

      const res = await getAgent()
        .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'License document illegible' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject with reason + fields_to_fix, store them, and notify; driver sees them', async () => {
      await seedDriverProfile();

      const res = await getAgent()
        .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'License document illegible — please re-upload',
          fields_to_fix: ['license', 'personal_photo'],
        });

      expect(res.status).toBe(200);
      expect(res.body.id_verified).toBe(false);
      expect(res.body.reason).toContain('illegible');
      expect(res.body.notified).toBe(true);

      const user = await User.findByPk(DRIVER_ID);
      expect(user.verificationStatus).toBe('rejected');
      expect(user.isVerified).toBe(false);
      expect(user.verificationRejectionReason).toContain('illegible');
      expect(user.verificationRejectionFields).toEqual(['license', 'personal_photo']);
      expect(user.verificationRejectedAt).not.toBeNull();

      const transitions = await VerificationStatusChange.findAll({
        where: { driverId: DRIVER_ID },
      });
      expect(transitions.some((t) => t.toStatus === 'rejected' && t.reason && t.markedFields.length === 2)).toBe(true);

      const notifications = await Notification.findAll({
        where: { userId: DRIVER_ID, type: 'VERIFICATION_REJECTED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);

      const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
      const statusRes = await getAgent()
        .get('/api/driver/verification-status')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.status.value).toBe('rejected');
      expect(statusRes.body.data.status.can_edit).toBe(true);
      expect(statusRes.body.data.status.rejection_reason).toContain('illegible');
      expect(statusRes.body.data.status.fields_to_fix).toEqual(['license', 'personal_photo']);
    });

    it('should reject missing reason with 422', async () => {
      await seedDriverProfile();
      const res = await getAgent()
        .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fields_to_fix: ['license'] });

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
        .send({ reason: 'Registration expired', fields_to_fix: ['vehicle_registration'] });

      expect(res.status).toBe(200);
      expect(res.body.is_verified).toBe(false);
      expect(res.body.reason).toBe('Registration expired');

      const vehicle = await Vehicle.findByPk(VEHICLE_ID);
      expect(vehicle.verificationNotes).toBe('Registration expired');
      expect(vehicle.verificationRejectionReason).toBe('Registration expired');

      const user = await User.findByPk(DRIVER_ID);
      expect(user.verificationStatus).toBe('rejected');

      const notifications = await Notification.findAll({
        where: { userId: DRIVER_ID, type: 'VERIFICATION_REJECTED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Admin alert on new driver submission (US8)', () => {
    it('should persist an admin in-app notification when a driver submits', async () => {
      const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });

      const res = await getAgent()
        .put('/api/driver/verification')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          full_name: 'Omar Khaled',
          vehicle: {
            manufacturer: 'Toyota',
            model: 'Corolla',
            vehicle_type: 'sedan',
            model_year: 2022,
            plate_number: '77-10000',
            seats: 4,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');

      const adminNotifications = await Notification.findAll({
        where: { userId: ADMIN_ID, type: 'ADMIN_VERIFICATION_NEW' },
      });
      expect(adminNotifications.length).toBeGreaterThanOrEqual(1);
    });
  });
});
