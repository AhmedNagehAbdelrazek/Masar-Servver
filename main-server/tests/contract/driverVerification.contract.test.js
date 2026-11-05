const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, DriverProfile, VerificationStatusChange,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = 'c1b9d6bc-bbfd-4b2d-9b5d-ab8dfbbd4d81';

let driverToken;

beforeEach(async () => {
  await VerificationStatusChange.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Ali Ahmed',
    phone: '+962798800010',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: false,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

describe('US1 Contract - Driver verification endpoints', () => {
  it('GET /verification-status matches contract §1 shape', async () => {
    const res = await getAgent()
      .get('/api/driver/verification-status')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const data = res.body.data;
    expect(data.status).toEqual({
      value: 'unverified',
      can_edit: true,
      submitted_at: null,
      rejected_at: null,
      rejection_reason: null,
      fields_to_fix: [],
    });
    expect(data.driver).toEqual({
      full_name: 'Ali Ahmed',
      national_id: null,
      license_number: null,
      license_expiry: null,
      user_identification_front: null,
      user_identification_back: null,
      lincese_front: null,
      lincese_back: null,
      personal_image_with_id: null,
    });
    expect(data.vehicle).toEqual({
      id: null,
      manufacturer: null,
      model: null,
      vehicle_type: null,
      model_year: null,
      plate_number: null,
      code_number: null,
      color: null,
      seats: null,
      registration_doc_front: null,
      registration_doc_back: null,
      vehicle_photo_front: null,
      vehicle_photo_back: null,
    });
  });

  it('GET /verification matches contract §1b shape after a submission', async () => {
    await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
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
      });

    const res = await getAgent()
      .get('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.driver.national_id).toBe('1234567890');
    expect(data.driver.license_number).toBe('L-12345');
    expect(data.driver.license_expiry).toBe('2028-06-30');
    expect(data.vehicle.manufacturer).toBe('Toyota');
    expect(data.vehicle.model).toBe('Camry');
    expect(data.vehicle.vehicle_type).toBe('sedan');
    expect(data.vehicle.model_year).toBe(2022);
    expect(data.vehicle.plate_number).toBe('ABC-123');
    expect(data.vehicle.code_number).toBe('88-99');
    expect(data.vehicle.color).toBe('white');
    expect(data.vehicle.seats).toBe(4);
    expect(data.vehicle.id).toBeTruthy();
  });

  it('PUT /verification success matches contract §2', async () => {
    const res = await getAgent()
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicle: {
          manufacturer: 'Toyota',
          model: 'Camry',
          vehicle_type: 'sedan',
          plate_number: 'ABC-123',
          seats: 4,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.submitted_at).toBeTruthy();
  });
});
