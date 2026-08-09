const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';

let token;

beforeEach(async () => {
  await Vehicle.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await User.destroy({ where: { id: DRIVER_ID }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Omar Khaled', phone: '+962798800001',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed',
    isVerified: true, avgRating: 4.8, status: 'active',
  });
  await DriverProfile.create({
    driverId: DRIVER_ID, idVerified: true, licenseExpiry: '2027-05-01',
    totalTrips: 14, totalEarnings: 425, responseRate: 98, nationalID: '1234567890',
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
    vehicleType: 'sedan', modelYear: 2022, plateNumber: '12-34567', codeNumber: 'CODE-100',
    color: 'White', seats: 4, isVerified: true,
  });

  token = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

describe('US9 Contract - Driver Profile & Vehicles', () => {
  it('GET /api/driver/profile returns aggregate envelope', async () => {
    const res = await getAgent()
      .get('/api/driver/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      user: {
        id: DRIVER_ID,
        full_name: 'Omar Khaled',
        phone: expect.any(String),
        role: 'driver',
        status: 'active',
        avg_rating: 4.8,
      },
      driver: {
        id_verified: true,
        license_expiry: '2027-05-01',
        total_trips: 14,
        total_earnings: 425,
        response_rate: 98,
      },
      verification: {
        identity_verified: true,
        vehicle_verified: true,
        fully_verified: true,
      },
      vehicles: [
        {
          id: VEHICLE_ID,
          manufacturer: 'Toyota',
          model: 'Corolla',
          vehicle_type: 'sedan',
          is_verified: true,
        },
      ],
      ratings_summary: { avg: 4.8, count: 0 },
    });
  });

  it('GET /api/vehicles returns vehicles envelope', async () => {
    const res = await getAgent()
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicles[0]).toEqual({
      id: VEHICLE_ID,
      manufacturer: 'Toyota',
      model: 'Corolla',
      vehicle_type: 'sedan',
      model_year: 2022,
      plate_number: '12-34567',
      code_number: 'CODE-100',
      color: 'White',
      seats: 4,
      is_verified: true,
    });
  });

  it('PUT /api/vehicles/:id returns updated vehicle envelope', async () => {
    const res = await getAgent()
      .put(`/api/vehicles/${VEHICLE_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ color: 'Silver', seats: 4 });

    expect(res.status).toBe(200);
    expect(res.body.vehicle).toMatchObject({
      id: VEHICLE_ID,
      color: 'Silver',
      seats: 4,
      is_verified: true,
    });
  });
});
