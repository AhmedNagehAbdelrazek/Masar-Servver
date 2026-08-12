const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, DriverProfile, UploadedImage, VerificationStatusChange,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = 'd500e840-e29b-41d4-a716-446655440000';
const DRIVER_ID = 'd500e840-e29b-41d4-a716-446655440001';

let driverToken;
let adminToken;

beforeEach(async () => {
  await VerificationStatusChange.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({
    id: ADMIN_ID,
    fullName: 'Admin User',
    phone: '+962799800001',
    countryCode: 'JO',
    role: 'admin',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: DRIVER_ID,
    fullName: 'Sami Nasser',
    phone: '+962799800002',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: false,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

const VALID_PACKAGE = {
  vehicle: {
    manufacturer: 'Toyota',
    model: 'Corolla',
    vehicle_type: 'sedan',
    model_year: 2022,
    plate_number: 'ONE-001',
    seats: 4,
  },
};

describe('US6 - One vehicle per driver', () => {
  it('rejects a direct duplicate driver_id insert at the DB level', async () => {
    await Vehicle.create({
      driverId: DRIVER_ID,
      manufacturer: 'Toyota',
      model: 'Corolla',
      vehicleType: 'sedan',
      modelYear: 2022,
      plateNumber: 'ONE-001',
      seats: 4,
    });

    await expect(
      Vehicle.create({
        driverId: DRIVER_ID,
        manufacturer: 'Honda',
        model: 'Civic',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: 'ONE-002',
        seats: 4,
      })
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('submit updates the existing vehicle in place, never duplicating', async () => {
    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_PACKAGE);

    await getAgent()
      .post(`/api/admin/verification/drivers/${DRIVER_ID}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Fix details', fields_to_fix: ['vehicle_details'] });

    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_PACKAGE, vehicle: { ...VALID_PACKAGE.vehicle, color: 'silver' } });

    const vehicles = await Vehicle.findAll({ where: { driverId: DRIVER_ID } });
    expect(vehicles.length).toBe(1);
    expect(vehicles[0].color).toBe('silver');
  });

  it('legacy onboarding vehicle submit returns graceful 422 when a vehicle already exists', async () => {
    await DriverProfile.create({ driverId: DRIVER_ID, idVerified: false });

    const imageIds = [];
    for (let i = 0; i < 4; i++) {
      const img = await UploadedImage.create({
        hash: `h${Date.now()}-${i}`,
        url: `https://res.cloudinary.com/example/doc${i}.jpg`,
        filename: `doc${i}.jpg`,
        mimetype: 'image/jpeg',
        size: 1024,
      });
      imageIds.push(img.id);
    }

    await Vehicle.create({
      driverId: DRIVER_ID,
      manufacturer: 'Toyota',
      model: 'Corolla',
      vehicleType: 'sedan',
      modelYear: 2022,
      plateNumber: 'ONE-001',
      seats: 4,
    });

    const res = await getAgent()
      .post('/api/auth/onboarding/vehicle')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleType: 'suv',
        manufacturer: 'Honda',
        model: 'Civic',
        modelYear: 2021,
        color: 'black',
        plateNumber: 'ONE-999',
        seats: 4,
        registrationDocFront: imageIds[0],
        registrationDocBack: imageIds[1],
        vehiclePhotoFront: imageIds[2],
        vehiclePhotoBack: imageIds[3],
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toContain('You already have a registered vehicle. Update it instead.');

    const vehicles = await Vehicle.findAll({ where: { driverId: DRIVER_ID } });
    expect(vehicles.length).toBe(1);
  });
});
