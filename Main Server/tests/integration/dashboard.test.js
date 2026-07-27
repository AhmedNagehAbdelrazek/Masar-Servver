const { getAgent, getRedisStore } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_PHONE = '+962793333333';
const PASSENGER_PHONE = '+962794444444';
const DRIVER_ID = '6ba7b810-9dad-41d4-80b4-00c04fd43001';
const PASSENGER_ID = '6ba7b810-9dad-41d4-80b4-00c04fd43002';
const VEHICLE_ID = '6ba7b810-9dad-41d4-80b4-00c04fd43010';

let driverToken;
let passengerToken;

beforeEach(async () => {
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER_PHONE] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Dashboard Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Dashboard Passenger',
    phone: PASSENGER_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'DB-123',
    color: 'White',
    seats: 4,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

describe('Dashboard - GET /api/driver/dashboard', () => {
  it('should return dashboard with correct structure', async () => {
    const res = await getAgent()
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.account).toBeDefined();
    expect(res.body.account.driver_id).toBe(DRIVER_ID);
    expect(res.body.account.full_name).toBe('Dashboard Driver');
    expect(res.body.account.phone).toBe(DRIVER_PHONE);
    expect(typeof res.body.account.rating).toBe('number');
    expect(typeof res.body.account.total_trips_completed).toBe('number');
    expect(typeof res.body.account.verified).toBe('boolean');

    expect(res.body.schedule).toBeDefined();
    expect(Array.isArray(res.body.schedule.today)).toBe(true);
    expect(Array.isArray(res.body.schedule.upcoming)).toBe(true);

    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary.today_trips_count).toBe('number');
    expect(typeof res.body.summary.total_completed_trips).toBe('number');
    expect(typeof res.body.summary.monthly_earnings).toBe('number');
    expect(typeof res.body.summary.avg_passenger_rating).toBe('number');

    expect(res.body.reservation_history).toBeDefined();
    expect(Array.isArray(res.body.reservation_history.recent)).toBe(true);
    expect(res.body.reservation_history.pagination).toBeDefined();
  });

  it('should include today\'s trips in schedule', async () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);

    const trip = await Trip.create({
      driverId: DRIVER_ID,
      vehicleId: VEHICLE_ID,
      originCity: 'Amman',
      destinationCity: 'Irbid',
      departureTime: today,
      totalSeats: 4,
      availableSeats: 3,
      farePerSeat: 15,
      isRecurring: false,
      status: 'published',
    });

    await TripSeat.bulkCreate([
      { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
      { tripId: trip.id, seatNumber: 2, seatType: 'available' },
      { tripId: trip.id, seatNumber: 3, seatType: 'available' },
      { tripId: trip.id, seatNumber: 4, seatType: 'available' },
    ]);

    const res = await getAgent()
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.schedule.today.length).toBe(1);
    expect(res.body.schedule.today[0].trip_id).toBe(trip.id);
    expect(res.body.summary.today_trips_count).toBe(1);
  });

  it('should cache dashboard response', async () => {
    const res1 = await getAgent()
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res1.status).toBe(200);

    const store = getRedisStore();
    const keys = [...store.keys()];
    expect(keys.some(k => k.includes('dashboard'))).toBe(true);
  });

  it('should reject without auth token', async () => {
    const res = await getAgent().get('/api/driver/dashboard');
    expect(res.status).toBe(401);
  });

  it('should reject if user is a passenger', async () => {
    const res = await getAgent()
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(403);
  });

  it('should return empty schedule when no trips', async () => {
    const res = await getAgent()
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.schedule.today.length).toBe(0);
    expect(res.body.schedule.upcoming.length).toBe(0);
    expect(res.body.summary.today_trips_count).toBe(0);
    expect(res.body.summary.total_completed_trips).toBe(0);
    expect(res.body.summary.monthly_earnings).toBe(0);
  });
});
