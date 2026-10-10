// 1:1 port of Main Server/tests/integration/driverVerification.test.js (Wave 3.2).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const ADMIN_ID = 'a500e840-e29b-41d4-a716-446655440000';
const DRIVER_ID = 'a500e840-e29b-41d4-a716-446655440001';

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

describe('US1 - Driver verification status', () => {
  let ctx: TestContext;
  let driverToken: string;
  let adminToken: string;

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
        fullName: 'Admin User',
        phone: '+962799900001',
        countryCode: 'JO',
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Ali Ahmed',
        phone: '+962799900002',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: false,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  });

  async function seedApprovedDriver(): Promise<void> {
    await ctx.prisma.driverProfile.create({
      data: { driverId: DRIVER_ID, idVerified: true, nationalID: '1234567890' },
    });
    await ctx.prisma.vehicle.create({
      data: {
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'ABC-123',
        seats: 4,
        isVerified: true,
      },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { verificationStatus: 'approved', isVerified: true },
    });
  }

  it('renders unverified for a driver with no submission', async () => {
    const res = await ctx.agent
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
    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const res = await ctx.agent
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

    const res = await ctx.agent
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status.value).toBe('approved');
    expect(res.body.data.status.can_edit).toBe(false);
  });

  it('renders rejected with reason, fields_to_fix, and pre-filled submission', async () => {
    await ctx.prisma.driverProfile.create({
      data: { driverId: DRIVER_ID, idVerified: false, nationalID: '1234567890', licenseNumber: 'L-12345' },
    });
    await ctx.prisma.vehicle.create({
      data: {
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'ABC-123',
        seats: 4,
        isVerified: false,
      },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: {
        verificationStatus: 'rejected',
        verificationRejectedAt: new Date(),
        verificationRejectionReason: 'License document illegible',
        verificationRejectionFields: ['license', 'vehicle_photo'],
      },
    });

    const res = await ctx.agent
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

  it('returns empty blocks for a first-time submitter', async () => {
    const res = await ctx.agent
      .get('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.driver.full_name).toBe('Ali Ahmed');
    expect(res.body.data.driver.national_id).toBeNull();
    expect(res.body.data.vehicle.id).toBeNull();
  });

  it('returns the latest submitted values', async () => {
    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const res = await ctx.agent
      .get('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.driver.license_number).toBe('L-12345');
    expect(res.body.data.vehicle.manufacturer).toBe('Toyota');
    expect(res.body.data.vehicle.seats).toBe(4);
  });

  it('submits a valid package -> pending with submitted_at', async () => {
    const res = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.submitted_at).not.toBeNull();

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.verificationStatus).toBe('pending');
    expect(user?.verificationSubmittedAt).not.toBeNull();
    expect(user?.isVerified).toBe(false);

    const profile = await ctx.prisma.driverProfile.findFirst({ where: { driverId: DRIVER_ID } });
    expect(profile).not.toBeNull();
    expect(profile?.nationalID).toBe('1234567890');

    const vehicle = await ctx.prisma.vehicle.findFirst({ where: { driverId: DRIVER_ID } });
    expect(vehicle).not.toBeNull();
    expect(vehicle?.plateNumber).toBe('ABC-123');
    expect(vehicle?.isVerified).toBe(false);

    const transitions = await ctx.prisma.verificationStatusChange.findMany({
      where: { driverId: DRIVER_ID },
    });
    expect(
      transitions.some((t) => t.fromStatus === 'unverified' && t.toStatus === 'pending'),
    ).toBe(true);
  });

  it('rejects a package with missing required vehicle fields with 422', async () => {
    const res = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ full_name: 'Ali Ahmed', vehicle: { manufacturer: 'Toyota' } });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.details)).toBe(true);
    const fields = res.body.details.map((m: { field: string }) => m.field);
    expect(fields).toContain('vehicle.model');
    expect(fields).toContain('vehicle.plate_number');
    expect(fields).toContain('vehicle.seats');
  });

  it('rejects phone changes with 422', async () => {
    const res = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_PACKAGE, phone: '+962700000000' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('resubmission after admin reject moves back to pending in place', async () => {
    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    await ctx.agent
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Documents illegible', fields_to_fix: ['license', 'vehicle_photo'] });

    let user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.verificationStatus).toBe('rejected');

    const res = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_PACKAGE, vehicle: { ...VALID_PACKAGE.vehicle, color: 'black' } });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending');

    user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(user?.verificationStatus).toBe('pending');
    expect(user?.verificationRejectedAt).toBeNull();
    expect(user?.verificationRejectionReason).toBeNull();
    expect(user?.verificationRejectionFields).toEqual([]);

    const vehicles = await ctx.prisma.vehicle.findMany({ where: { driverId: DRIVER_ID } });
    expect(vehicles.length).toBe(1);
    expect(vehicles[0].color).toBe('black');

    const transitions = await ctx.prisma.verificationStatusChange.findMany({
      where: { driverId: DRIVER_ID },
      orderBy: { createdAt: 'asc' },
    });
    const toStatuses = transitions.map((t) => t.toStatus);
    expect(toStatuses).toContain('rejected');
    expect(toStatuses[toStatuses.length - 1]).toBe('pending');
  });

  it('rejects submit while pending with 409', async () => {
    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const res = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');

    const statusRes = await ctx.agent
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(statusRes.body.data.status.can_edit).toBe(false);
  });

  it('upserts the vehicle in place on resubmission (one-vehicle constraint)', async () => {
    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const adminReject = await ctx.agent
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'fix color', fields_to_fix: ['vehicle_details'] });
    expect(adminReject.status).toBe(200);

    const resubmit = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_PACKAGE, vehicle: { ...VALID_PACKAGE.vehicle, color: 'silver' } });
    expect(resubmit.status).toBe(200);

    const vehicles = await ctx.prisma.vehicle.findMany({ where: { driverId: DRIVER_ID } });
    expect(vehicles.length).toBe(1);
    expect(vehicles[0].color).toBe('silver');
  });

  it('rejects legacy onboarding vehicle when one already exists with 422', async () => {
    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    const images: number[] = [];
    for (let i = 0; i < 4; i++) {
      const img = await ctx.prisma.uploadedImage.create({
        data: {
          hash: `ob${Date.now()}${i}${Math.random()}`,
          url: `https://example.com/v${i}.jpg`,
          filename: `v${i}.jpg`,
          mimetype: 'image/jpeg',
          size: 512,
        },
      });
      images.push(img.id);
    }

    const res = await ctx.agent
      .post('/api/auth/onboarding/vehicle')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleType: 'sedan',
        manufacturer: 'Toyota',
        model: 'Camry',
        modelYear: 2022,
        color: 'white',
        plateNumber: 'OTHER-1',
        seats: 4,
        registrationDocFront: images[0],
        registrationDocBack: images[1],
        vehiclePhotoFront: images[2],
        vehiclePhotoBack: images[3],
      });

    expect(res.status).toBe(422);
    const vehicles = await ctx.prisma.vehicle.findMany({ where: { driverId: DRIVER_ID } });
    expect(vehicles.length).toBe(1);
  });

  it('rejects submit while approved with 403', async () => {
    await seedApprovedDriver();

    const res = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');

    const statusRes = await ctx.agent
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(statusRes.body.data.status.value).toBe('approved');
    expect(statusRes.body.data.status.can_edit).toBe(false);
  });
});
