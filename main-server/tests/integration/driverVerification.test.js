const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, DriverProfile, Notification, VerificationStatusChange,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = 'a500e840-e29b-41d4-a716-446655440000';
const DRIVER_ID = 'a500e840-e29b-41d4-a716-446655440001';

let driverToken;
let adminToken;

beforeEach(async () => {
  await VerificationStatusChange.destroy({ where: {}, force: true });
  await Notification.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({
    id: ADMIN_ID,
    fullName: 'Admin User',
    phone: '+962799900001',
    countryCode: 'JO',
    role: 'admin',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: DRIVER_ID,
    fullName: 'Ali Ahmed',
    phone: '+962799900002',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: false,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

const VALID_PACKAGE = {
  full_name: 'Ali Ahmed',
  national_id: '1234567890',
  license_number: 'L-12345',
  license_expiry: '2028-06-30',
  vehicle: {
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicle_type: 'sedan',
    model_year: 2022,
    plate_number: 'ABC-123',
    code_number: '88-99',
    color: 'white',
    seats: 4,
  },
};

async function seedApprovedDriver() {
  await DriverProfile.create({ driverId: DRIVER_ID, idVerified: true, nationalID: '1234567890' });
  await Vehicle.create({
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2022,
    plateNumber: 'ABC-123',
    seats: 4,
    isVerified: true,
  });
  await User.update(
    { verificationStatus: 'approved', isVerified: true },
    { where: { id: DRIVER_ID } }
  );
}

describe('US1 - Driver verification status', () => {
  it('renders unverified for a driver with no submission', async () => {
    const res = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status.value).toBe('unverified');
    expect(res.body.data.status.can_edit).toBe(true);
    expect(res.body.data.status.submitted_at).toBeNull();
    expect(res.body.data.status.rejection_reason).toBeNull();
    expect(res.body.data.status.fields_to_fix).toEqual([]);
    expect(res.body.data.driver.full_name).toBe('Ali Ahmed');
    expect(res.body.data.vehicle.id).toBeNull();
  });

  it('renders pending with can_edit false after submission', async () => {
    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const res = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status.value).toBe('pending');
    expect(res.body.data.status.can_edit).toBe(false);
    expect(res.body.data.status.submitted_at).not.toBeNull();
    expect(res.body.data.driver.national_id).toBe('1234567890');
    expect(res.body.data.vehicle.plate_number).toBe('ABC-123');
  });

  it('renders approved with can_edit false for a fully verified driver', async () => {
    await seedApprovedDriver();

    const res = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status.value).toBe('approved');
    expect(res.body.data.status.can_edit).toBe(false);
  });

  it('renders rejected with reason, fields_to_fix, and pre-filled submission', async () => {
    await DriverProfile.create({
      driverId: DRIVER_ID,
      idVerified: false,
      nationalID: '1234567890',
      licenseNumber: 'L-12345',
    });
    await Vehicle.create({
      driverId: DRIVER_ID,
      manufacturer: 'Toyota',
      model: 'Camry',
      vehicleType: 'sedan',
      modelYear: 2022,
      plateNumber: 'ABC-123',
      seats: 4,
      isVerified: false,
    });
    await User.update(
      {
        verificationStatus: 'rejected',
        verificationRejectedAt: new Date(),
        verificationRejectionReason: 'License document illegible',
        verificationRejectionFields: ['license', 'vehicle_photo'],
      },
      { where: { id: DRIVER_ID } }
    );

    const res = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status.value).toBe('rejected');
    expect(res.body.data.status.can_edit).toBe(true);
    expect(res.body.data.status.rejection_reason).toBe('License document illegible');
    expect(res.body.data.status.fields_to_fix).toEqual(['license', 'vehicle_photo']);
    expect(res.body.data.status.rejected_at).not.toBeNull();
    expect(res.body.data.driver.national_id).toBe('1234567890');
    expect(res.body.data.vehicle.plate_number).toBe('ABC-123');
  });
});

describe('US1 - Driver current submission (prefill)', () => {
  it('returns empty blocks for a first-time submitter', async () => {
    const res = await getAgent()
      .get('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.driver.full_name).toBe('Ali Ahmed');
    expect(res.body.data.driver.national_id).toBeNull();
    expect(res.body.data.vehicle.id).toBeNull();
  });

  it('returns the latest submitted values', async () => {
    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const res = await getAgent()
      .get('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.driver.license_number).toBe('L-12345');
    expect(res.body.data.vehicle.manufacturer).toBe('Toyota');
    expect(res.body.data.vehicle.seats).toBe(4);
  });
});

describe('US2 - Initial submission', () => {
  it('submits a valid package -> pending with submitted_at', async () => {
    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.submitted_at).not.toBeNull();

    const user = await User.findByPk(DRIVER_ID);
    expect(user.verificationStatus).toBe('pending');
    expect(user.verificationSubmittedAt).not.toBeNull();
    expect(user.isVerified).toBe(false);

    const profile = await DriverProfile.findOne({ where: { driverId: DRIVER_ID } });
    expect(profile).not.toBeNull();
    expect(profile.nationalID).toBe('1234567890');

    const vehicle = await Vehicle.findOne({ where: { driverId: DRIVER_ID } });
    expect(vehicle).not.toBeNull();
    expect(vehicle.plateNumber).toBe('ABC-123');
    expect(vehicle.isVerified).toBe(false);

    const transitions = await VerificationStatusChange.findAll({ where: { driverId: DRIVER_ID } });
    expect(transitions.some((t) => t.fromStatus === 'unverified' && t.toStatus === 'pending')).toBe(true);
  });

  it('rejects a package with missing required vehicle fields with 422', async () => {
    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ full_name: 'Ali Ahmed', vehicle: { manufacturer: 'Toyota' } });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
    const fields = res.body.details.map((m) => m.field);
    expect(fields).toContain('vehicle.model');
    expect(fields).toContain('vehicle.plate_number');
    expect(fields).toContain('vehicle.seats');
  });

  it('rejects phone changes with 422', async () => {
    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_PACKAGE, phone: '+962700000000' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('US3 - Resubmit after rejection', () => {
  it('resubmission moves back to pending and clears rejection data in place', async () => {
    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Documents illegible', fields_to_fix: ['license', 'vehicle_photo'] });

    let user = await User.findByPk(DRIVER_ID);
    expect(user.verificationStatus).toBe('rejected');

    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_PACKAGE, vehicle: { ...VALID_PACKAGE.vehicle, color: 'black' } });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');

    user = await User.findByPk(DRIVER_ID);
    expect(user.verificationStatus).toBe('pending');
    expect(user.verificationRejectedAt).toBeNull();
    expect(user.verificationRejectionReason).toBeNull();
    expect(user.verificationRejectionFields).toEqual([]);

    const vehicles = await Vehicle.findAll({ where: { driverId: DRIVER_ID } });
    expect(vehicles.length).toBe(1);
    expect(vehicles[0].color).toBe('black');

    const transitions = await VerificationStatusChange.findAll({
      where: { driverId: DRIVER_ID },
      order: [['createdat', 'ASC']],
    });
    const toStatuses = transitions.map((t) => t.toStatus);
    expect(toStatuses).toContain('rejected');
    expect(toStatuses[toStatuses.length - 1]).toBe('pending');
  });
});

describe('US4 - Block editing while under review', () => {
  it('rejects submit while pending with 409', async () => {
    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');

    const statusRes = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(statusRes.body.data.status.can_edit).toBe(false);
  });
});

describe('US5 - Lock approved drivers', () => {
  it('rejects submit while approved with 403 contact-support', async () => {
    await seedApprovedDriver();

    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');

    const statusRes = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(statusRes.body.data.status.value).toBe('approved');
    expect(statusRes.body.data.status.can_edit).toBe(false);
  });
});
