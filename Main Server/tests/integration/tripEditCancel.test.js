const { getAgent, getRedisStore } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, Notification, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { TRIP_STATUS, BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const { getSeatLockKey, acquireSeatLock } = require('../../utils/seatLock');

const DRIVER_PHONE = '+962791111111';
const PASSENGER_PHONE = '+962792222222';
const OTHER_DRIVER_PHONE = '+962793333333';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const OTHER_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440003';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const OTHER_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440011';

let driverToken;
let otherDriverToken;
let passengerToken;

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
  await Notification.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: [DRIVER_ID, OTHER_DRIVER_ID] }, force: true });
  await Vehicle.destroy({ where: { driverId: [DRIVER_ID, OTHER_DRIVER_ID] }, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER_PHONE, OTHER_DRIVER_PHONE] }, force: true });

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
    id: OTHER_DRIVER_ID,
    fullName: 'Other Driver',
    phone: OTHER_DRIVER_PHONE,
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
  await Vehicle.create({
    id: OTHER_VEHICLE_ID,
    driverId: OTHER_DRIVER_ID,
    manufacturer: 'Hyundai',
    model: 'Elantra',
    vehicleType: 'sedan',
    modelYear: 2022,
    plateNumber: 'TEST-456',
    color: 'Black',
    seats: 4,
    isVerified: true,
  });

  await seedActiveSubscription();

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  otherDriverToken = generateAccessToken({ id: OTHER_DRIVER_ID, role: 'driver' });
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
  departure_date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
  departure_time: '14:00',
  type_of_trip: 'once',
  fare_per_seat: '15.50',
  seats: [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ],
  instructions: ['No smoking please'],
  additional_instructions: 'Bring water',
  waypoints: [{ stop_name: 'Khalda', stop_lat: '31.9600', stop_lng: '35.9000' }],
};

async function createTrip() {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send(VALID_TRIP_BODY);
  return res.body.trip_id;
}

async function createConfirmedBooking(tripId, passengerId = PASSENGER_ID, seatNumber = 2) {
  return Booking.create({
    tripId,
    passengerId,
    seatNumber,
    seatsBooked: 1,
    agreedFare: 15.5,
    status: BOOKING_STATUS.CONFIRMED,
    referenceCode: 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase(),
  });
}

describe('US1 - Trip Edit & Cancel', () => {
  describe('PUT /api/trips/:trip_id', () => {
    it('should partially update fare only, leaving other fields unchanged', async () => {
      const tripId = await createTrip();
      const res = await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ fare_per_seat: 8.5 });

      expect(res.status).toBe(200);
      expect(res.body.trip.id).toBe(tripId);
      expect(res.body.trip.fare_per_seat).toBe(8.5);
      expect(res.body.trip.status).toBe(TRIP_STATUS.PUBLISHED);
      expect(res.body.trip.origin_city).toBe('Amman');
      expect(res.body.trip.departure_time).toBeDefined();

      const trip = await Trip.findByPk(tripId);
      expect(parseFloat(trip.farePerSeat)).toBe(8.5);
      expect(trip.originCity).toBe('Amman');
      expect(trip.status).toBe(TRIP_STATUS.PUBLISHED);
    });

    it('should reject non-owner edit with 403', async () => {
      const tripId = await createTrip();
      const res = await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherDriverToken}`)
        .send({ fare_per_seat: 1 });

      expect(res.status).toBe(403);
    });

    it('should notify confirmed passengers when departure_time changes', async () => {
      const tripId = await createTrip();
      const booking = await createConfirmedBooking(tripId);
      const newDeparture = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(9, 0, 0, 0);
        return d.toISOString();
      })();

      const res = await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ departure_time: newDeparture });

      expect(res.status).toBe(200);
      expect(res.body.trip.notified_passengers).toBe(1);

      const notifications = await Notification.findAll({
        where: { userId: PASSENGER_ID, type: 'TRIP_TIME_CHANGED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
      expect(notifications[0].data.trip_id).toBe(tripId);
      expect(booking.id).toBeDefined();
    });

    it('should validate departure_time in the past with 422', async () => {
      const tripId = await createTrip();
      const res = await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ departure_time: '2020-01-01T00:00:00Z' });

      expect(res.status).toBe(422);
    });

    it('should reject invalid gender_preference with 422', async () => {
      const tripId = await createTrip();
      const res = await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ gender_preference: 'everyone' });

      expect(res.status).toBe(422);
    });

    it('should replace attributes when provided', async () => {
      const tripId = await createTrip();
      const res = await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ attributes: [{ attr_key: 'ac', attr_value: 'true' }] });

      expect(res.status).toBe(200);
      expect(res.body.trip.attributes).toEqual([{ attr_key: 'ac', attr_value: 'true' }]);
    });
  });

  describe('DELETE /api/trips/:trip_id', () => {
    it('should cancel trip, cancel bookings, release seat locks, and notify', async () => {
      const tripId = await createTrip();
      await createConfirmedBooking(tripId, PASSENGER_ID, 2);
      await acquireSeatLock(tripId, 2, PASSENGER_ID);

      const store = getRedisStore();
      expect(store.has(getSeatLockKey(tripId, 2))).toBe(true);

      const res = await getAgent()
        .delete(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trip.status).toBe(TRIP_STATUS.CANCELLED);
      expect(res.body.trip.notified_passengers).toBe(1);

      const trip = await Trip.findByPk(tripId);
      expect(trip.status).toBe(TRIP_STATUS.CANCELLED);

      const booking = await Booking.findOne({ where: { tripId } });
      expect(booking.status).toBe(BOOKING_STATUS.CANCELLED);

      expect(store.has(getSeatLockKey(tripId, 2))).toBe(false);

      const notifications = await Notification.findAll({
        where: { userId: PASSENGER_ID, type: 'TRIP_CANCELLED' },
      });
      expect(notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('should refuse cancelling a trip that already started with 403', async () => {
      const tripId = await createTrip();
      await Trip.update({ status: TRIP_STATUS.IN_PROGRESS }, { where: { id: tripId } });

      const res = await getAgent()
        .delete(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject non-owner cancel with 403', async () => {
      const tripId = await createTrip();
      const res = await getAgent()
        .delete(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${otherDriverToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/trips/:trip_id/attributes', () => {
    it('should return attributes for a trip', async () => {
      const tripId = await createTrip();
      await getAgent()
        .put(`/api/trips/${tripId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ attributes: [{ attr_key: 'ac', attr_value: 'true' }, { attr_key: 'women_only', attr_value: 'false' }] });

      const res = await getAgent()
        .get(`/api/trips/${tripId}/attributes`)
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trip_id).toBe(tripId);
      expect(res.body.attributes).toEqual([
        { attr_key: 'ac', attr_value: 'true' },
        { attr_key: 'women_only', attr_value: 'false' },
      ]);
    });

    it('should return 404 for non-existent trip', async () => {
      const res = await getAgent()
        .get('/api/trips/550e8400-e29b-41d4-a716-446655440099/attributes')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
    });
  });
});
