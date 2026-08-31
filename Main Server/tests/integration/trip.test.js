const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { TRIP_STATUS, SEAT_TYPE, GENDER_PREFERENCE, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_PHONE = '+962791111111';
const PASSENGER_PHONE = '+962792222222';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';

let driverToken;
let passengerToken;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function seedActiveSubscription() {
  const plan = await SubscriptionPlan.create({
    name: 'Basic',
    periodDays: 30,
    percentageCut: 8,
    cost: 100,
    features: [],
    isFree: false,
    isActive: true,
  });
  await DriverSubscription.create({
    driverId: DRIVER_ID,
    planId: plan.id,
    planName: plan.name,
    planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut,
    planCost: plan.cost,
    balance: 100,
    paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE,
    approvedAt: new Date(),
    activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
}

beforeEach(async () => {
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER_PHONE] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Test Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Test Passenger',
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
    plateNumber: 'TEST-123',
    color: 'White',
    seats: 4,
    isVerified: true,
  });

  await seedActiveSubscription();

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

const VALID_TRIP_BODY = {
  origin_city: 'Amman',
  origin_area: 'Abdoun',
  origin_lat: '31.9500',
  origin_lng: '35.9100',
  destination_city: 'Irbid',
  destination_area: 'Downtown',
  destination_lat: '32.5500',
  destination_lng: '35.8500',
  departure_date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(),
  departure_time: '14:00',
  type_of_trip: 'once',
  fare_per_seat: '15.50',
  seats: [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ],
  instructions: ['No smoking please', 'Be ready 10 mins early'],
  additional_instructions: 'Bring water',
  waypoints: [
    { stop_name: 'Khalda', stop_lat: '31.9600', stop_lng: '35.9000' },
  ],
};

describe('Trip - Create Trip', () => {
  describe('POST /api/trips', () => {
    it('should create a one-time trip with all fields', async () => {
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(VALID_TRIP_BODY);

      expect(res.status).toBe(201);
      expect(res.body.trip_id).toBeDefined();
      expect(res.body.status).toBe(TRIP_STATUS.PUBLISHED);
      expect(res.body.total_seats).toBe(4);
      expect(res.body.available_seats).toBe(2);
      expect(res.body.estimated_earnings).toBe(31);
      expect(res.body.message).toMatch(/successfully/i);

      const trip = await Trip.findByPk(res.body.trip_id);
      expect(trip.originCity).toBe('Amman');
      expect(trip.destinationCity).toBe('Irbid');
      expect(trip.isRecurring).toBe(false);
      expect(parseFloat(trip.farePerSeat)).toBe(15.5);

      const seats = await TripSeat.findAll({ where: { tripId: res.body.trip_id } });
      expect(seats.length).toBe(4);
      const driverSeat = seats.find(s => s.seatType === SEAT_TYPE.DRIVER);
      expect(driverSeat).toBeDefined();
      const availableSeats = seats.filter(s => s.seatType === SEAT_TYPE.AVAILABLE);
      expect(availableSeats.length).toBe(2);

      const stops = await TripStop.findAll({ where: { tripId: res.body.trip_id } });
      expect(stops.length).toBe(1);
      expect(stops[0].stopName).toBe('Khalda');
    });

    it('should create a recurring trip with days and end date', async () => {
      const body = {
        ...VALID_TRIP_BODY,
        type_of_trip: 'repeated',
        repeated_days: [1, 3, 5],
        repeated_end_date: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
      };

      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(201);

      const trip = await Trip.findByPk(res.body.trip_id);
      expect(trip.isRecurring).toBe(true);
      expect(trip.recurrenceDays).toEqual([1, 3, 5]);
      expect(trip.recurrenceEndDate).toBeDefined();
    });

    it('should reject without auth token', async () => {
      const res = await getAgent()
        .post('/api/trips')
        .send(VALID_TRIP_BODY);

      expect(res.status).toBe(401);
    });

    it('should reject if user is a passenger', async () => {
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(VALID_TRIP_BODY);

      expect(res.status).toBe(403);
    });

    it('should reject if driver has no vehicle', async () => {
      const noVehicleDriver = await User.create({
        id: '550e8400-e29b-41d4-a716-446655440099',
        fullName: 'No Vehicle Driver',
        phone: '+962799999999',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      });
      const noVehicleToken = generateAccessToken({ id: noVehicleDriver.id, role: 'driver' });
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${noVehicleToken}`)
        .send(VALID_TRIP_BODY);

      expect(res.status).toBe(403);
    });

    it('should reject if origin_city is missing', async () => {
      const { origin_city: _origin_city, ...body } = VALID_TRIP_BODY;
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if destination_city is missing', async () => {
      const { destination_city: _destination_city, ...body } = VALID_TRIP_BODY;
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if departure_date is missing', async () => {
      const { departure_date: _departure_date, ...body } = VALID_TRIP_BODY;
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if departure_time is missing', async () => {
      const { departure_time: _departure_time, ...body } = VALID_TRIP_BODY;
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if fare_per_seat is missing', async () => {
      const { fare_per_seat: _fare_per_seat, ...body } = VALID_TRIP_BODY;
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if seats config is missing', async () => {
      const { seats: _seats, ...body } = VALID_TRIP_BODY;
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if seat count does not match vehicle', async () => {
      const body = {
        ...VALID_TRIP_BODY,
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
        ],
      };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if no driver seat', async () => {
      const body = {
        ...VALID_TRIP_BODY,
        seats: [
          { seat_number: 1, type: 'available' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if no available seats', async () => {
      const body = {
        ...VALID_TRIP_BODY,
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'unavailable' },
          { seat_number: 3, type: 'unavailable' },
          { seat_number: 4, type: 'unavailable' },
        ],
      };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject if driver vehicle is not verified', async () => {
      await Vehicle.update(
        { isVerified: false },
        { where: { id: VEHICLE_ID } }
      );

      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(VALID_TRIP_BODY);

      expect(res.status).toBe(403);
    });

    it('should reject if departure time is in the past', async () => {
      const body = {
        ...VALID_TRIP_BODY,
        departure_date: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })(),
      };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject recurring trip without repeated_days', async () => {
      const body = {
        ...VALID_TRIP_BODY,
        type_of_trip: 'repeated',
        repeated_end_date: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
      };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject fare with invalid format', async () => {
      const body = { ...VALID_TRIP_BODY, fare_per_seat: 'abc' };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });

    it('should reject negative fare', async () => {
      const body = { ...VALID_TRIP_BODY, fare_per_seat: '-5.00' };
      const res = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(body);

      expect(res.status).toBe(422);
    });
  });
});

describe('Trip - Get Trip By ID', () => {
  let tripId;

  beforeEach(async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_TRIP_BODY);

    tripId = res.body.trip_id;
  });

  describe('GET /api/trips/:trip_id', () => {
    it('should return trip with seats and stops', async () => {
      const res = await getAgent()
        .get(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tripId);
      expect(res.body.originCity).toBe('Amman');
      expect(res.body.destinationCity).toBe('Irbid');
      expect(res.body.seats).toBeDefined();
      expect(res.body.seats.length).toBe(4);
      expect(res.body.stops).toBeDefined();
      expect(res.body.stops.length).toBe(1);
    });

    it('should return 404 for non-existent trip', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const res = await getAgent()
        .get(`/api/trips/${fakeId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject without auth token', async () => {
      const res = await getAgent().get(`/api/trips/${tripId}`);
      expect(res.status).toBe(401);
    });
  });
});

describe('Trip - Get Driver Trips', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_TRIP_BODY);

    await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ ...VALID_TRIP_BODY, origin_city: 'Zarqa', destination_city: 'Aqaba' });
  });

  describe('GET /api/trips/driver/my-trips', () => {
    it('should return all driver trips', async () => {
      const res = await getAgent()
        .get('/api/trips/driver/my-trips')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trips).toBeDefined();
      expect(res.body.trips.length).toBe(2);
    });

    it('should filter by status', async () => {
      const res = await getAgent()
        .get('/api/trips/driver/my-trips')
        .query({ status: TRIP_STATUS.PUBLISHED })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trips.length).toBe(2);
      res.body.trips.forEach(t => expect(t.status).toBe(TRIP_STATUS.PUBLISHED));
    });

    it('should reject if not a driver', async () => {
      const res = await getAgent()
        .get('/api/trips/driver/my-trips')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(403);
    });
  });
});

describe('Trip - Search Available Trips', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_TRIP_BODY);
  });

  describe('GET /api/trips/search/available', () => {
    it('should return published trips with available seats', async () => {
      const tomorrow = getFutureDate(1);
      const res = await getAgent()
        .get('/api/trips/search/available')
        .query({
          origin_city: 'Amman',
          destination_city: 'Irbid',
          date: tomorrow,
        })
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trips).toBeDefined();
      expect(res.body.trips.length).toBeGreaterThanOrEqual(1);
      expect(res.body.trips[0].seats).toBeDefined();
      expect(res.body.trips[0].seats.every(s => s.seatType === SEAT_TYPE.AVAILABLE)).toBe(true);
    });

    it('should filter by gender preference', async () => {
      await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          ...VALID_TRIP_BODY,
          allowed_type: GENDER_PREFERENCE.WOMEN_ONLY,
        });

      const tomorrow = getFutureDate(1);
      const res = await getAgent()
        .get('/api/trips/search/available')
        .query({
          date: tomorrow,
          gender_preference: GENDER_PREFERENCE.WOMEN_ONLY,
        })
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject without auth token', async () => {
      const res = await getAgent()
        .get('/api/trips/search/available')
        .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1) });

      expect(res.status).toBe(401);
    });
  });
});
