// 1:1 port of Main Server/tests/integration/driverProfileVehicles.test.js
// (Wave 3.1): driver aggregate profile + vehicles CRUD.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const OTHER_DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d83';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const OTHER_VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d91';
const TRIP_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
const BOOKING_1 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b01';
const BOOKING_2 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b02';

describe('GET /api/driver/profile', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    for (const [id, fullName, phone, role] of [
      [DRIVER_ID, 'Omar Khaled', '+962798800001', 'driver'],
      [OTHER_DRIVER_ID, 'Other Driver', '+962798800002', 'driver'],
      [PASSENGER_ID, 'Sara Ali', '+962798800003', 'passenger'],
    ] as const) {
      await ctx.prisma.user.create({
        data: {
          id,
          fullName,
          phone,
          countryCode: 'JO',
          role,
          passwordHash: 'hashed',
          isVerified: true,
          avgRating: role === 'driver' && id === DRIVER_ID ? 4.8 : 0,
          status: 'active',
        },
      });
    }
    await ctx.prisma.driverProfile.create({
      data: {
        driverId: DRIVER_ID,
        idVerified: true,
        licenseExpiry: new Date('2027-05-01'),
        totalTrips: 14,
        totalEarnings: 425.0,
        responseRate: 98,
        nationalID: '1234567890',
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: '12-34567',
        codeNumber: 'CODE-100',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: OTHER_VEHICLE_ID,
        driverId: OTHER_DRIVER_ID,
        manufacturer: 'Honda',
        model: 'Civic',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: '77-00000',
        codeNumber: 'CODE-200',
        color: 'Black',
        seats: 4,
        isVerified: false,
      },
    });
    const departure = new Date(Date.now() + 24 * 3600 * 1000);
    await ctx.prisma.trip.create({
      data: {
        id: TRIP_ID,
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: departure,
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 10,
        status: 'completed',
      },
    });
    for (const [id, ref] of [
      [BOOKING_1, 'REF-00000001'],
      [BOOKING_2, 'REF-00000002'],
    ] as const) {
      await ctx.prisma.booking.create({
        data: {
          id,
          tripId: TRIP_ID,
          passengerId: PASSENGER_ID,
          seatsBooked: 1,
          agreedFare: 10,
          referenceCode: ref,
          status: 'completed',
        },
      });
    }
    await ctx.prisma.rating.create({
      data: { bookingId: BOOKING_1, raterId: PASSENGER_ID, rateeId: DRIVER_ID, stars: 5, isVisible: true },
    });
    await ctx.prisma.rating.create({
      data: { bookingId: BOOKING_2, raterId: PASSENGER_ID, rateeId: DRIVER_ID, stars: 4, isVisible: true },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it('returns the aggregated profile', async () => {
    const res = await ctx.agent
      .get('/api/driver/profile')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile.user).toMatchObject({
      id: DRIVER_ID,
      full_name: 'Omar Khaled',
      phone: '+96279***0001',
      role: 'driver',
      status: 'active',
      avg_rating: 4.8,
    });
    expect(res.body.profile.driver).toMatchObject({
      id_verified: true,
      license_expiry: '2027-05-01',
      total_trips: 14,
      total_earnings: 425,
      response_rate: 98,
      national_id: '123***890',
    });
    expect(res.body.profile.verification).toEqual({
      identity_verified: true,
      vehicle_verified: true,
      fully_verified: true,
    });
    expect(res.body.profile.vehicles).toHaveLength(1);
    expect(res.body.profile.vehicles[0]).toMatchObject({
      id: VEHICLE_ID,
      manufacturer: 'Toyota',
      model: 'Corolla',
      vehicle_type: 'sedan',
      is_verified: true,
    });
    expect(res.body.profile.ratings_summary).toEqual({ avg: 4.8, count: 2 });
  });

  it('requires a driver role', async () => {
    const res = await ctx.agent
      .get('/api/driver/profile')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/vehicles', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;

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
        id: DRIVER_ID,
        fullName: 'Omar Khaled',
        phone: '+962798800001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Sara Ali',
        phone: '+962798800003',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d99',
        fullName: 'Other Owner',
        phone: '+962798800099',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: '12-34567',
        codeNumber: 'CODE-100',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: OTHER_VEHICLE_ID,
        driverId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d99',
        manufacturer: 'Honda',
        model: 'Civic',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: '77-00000',
        color: 'Black',
        seats: 4,
        isVerified: false,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  it("lists only the calling driver's vehicles", async () => {
    const res = await ctx.agent
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.vehicles[0].id).toBe(VEHICLE_ID);
    expect(res.body.vehicles[0].plate_number).toBe('12-34567');
    expect(res.body.vehicles[0].is_verified).toBe(true);
  });

  it('requires a driver role', async () => {
    const res = await ctx.agent
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/vehicles/:vehicle_id', () => {
  let ctx: TestContext;
  let driverToken: string;

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
        id: DRIVER_ID,
        fullName: 'Omar Khaled',
        phone: '+962798800001',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d99',
        fullName: 'Other Owner',
        phone: '+962798800099',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: '12-34567',
        codeNumber: 'CODE-100',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: OTHER_VEHICLE_ID,
        driverId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d99',
        manufacturer: 'Honda',
        model: 'Civic',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: '77-00000',
        color: 'Black',
        seats: 4,
        isVerified: false,
      },
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  });

  it("partially updates the driver's own vehicle", async () => {
    const res = await ctx.agent
      .put(`/api/vehicles/${VEHICLE_ID}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ color: 'Silver', seats: 4 });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.id).toBe(VEHICLE_ID);
    expect(res.body.vehicle.color).toBe('Silver');
    expect(res.body.vehicle.seats).toBe(4);
    expect(res.body.vehicle.is_verified).toBe(true);

    const persisted = await ctx.prisma.vehicle.findUnique({ where: { id: VEHICLE_ID } });
    expect(persisted?.color).toBe('Silver');
  });

  it("rejects updating another driver's vehicle", async () => {
    const res = await ctx.agent
      .put(`/api/vehicles/${OTHER_VEHICLE_ID}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ color: 'Red' });
    expect(res.status).toBe(403);
  });

  it('returns 409 when the plate number is already taken', async () => {
    const res = await ctx.agent
      .put(`/api/vehicles/${VEHICLE_ID}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plate_number: '77-00000' });
    expect(res.status).toBe(409);
  });

  it('allows a shared code number (not unique)', async () => {
    const res = await ctx.agent
      .put(`/api/vehicles/${VEHICLE_ID}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ code_number: 'CODE-200' });
    expect(res.status).toBe(200);
    expect(res.body.vehicle.code_number).toBe('CODE-200');
  });

  it('updates the code number', async () => {
    const res = await ctx.agent
      .put(`/api/vehicles/${VEHICLE_ID}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ code_number: 'CODE-999' });
    expect(res.status).toBe(200);
    expect(res.body.vehicle.code_number).toBe('CODE-999');
  });

  it('returns 404 for a nonexistent vehicle', async () => {
    const res = await ctx.agent
      .put('/api/vehicles/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ color: 'Red' });
    expect(res.status).toBe(404);
  });

  it('returns 422 for an invalid vehicle_type', async () => {
    const res = await ctx.agent
      .put(`/api/vehicles/${VEHICLE_ID}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ vehicle_type: 'spaceship' });
    expect(res.status).toBe(422);
  });
});
