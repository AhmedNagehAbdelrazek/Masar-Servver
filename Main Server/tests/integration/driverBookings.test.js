const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_PHONE = '+962791111111';
const OTHER_DRIVER_PHONE = '+962793333333';
const PASSENGER_PHONE = '+962792222222';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_DRIVER_ID = '550e8400-e29b-41d4-a716-446655440003';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';
const OTHER_VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440011';

let driverToken;
let otherDriverToken;

async function seedActiveSubscription(driverId) {
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
    driverId,
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
  await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: driverId } });
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: [DRIVER_ID, OTHER_DRIVER_ID] }, force: true });
  await Vehicle.destroy({ where: { driverId: [DRIVER_ID, OTHER_DRIVER_ID] }, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, OTHER_DRIVER_PHONE, PASSENGER_PHONE] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Test Driver', phone: DRIVER_PHONE,
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: OTHER_DRIVER_ID, fullName: 'Other Driver', phone: OTHER_DRIVER_PHONE,
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Lina Haddad', phone: PASSENGER_PHONE,
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });

  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'TEST-123', color: 'White', seats: 4, isVerified: true,
  });
  await Vehicle.create({
    id: OTHER_VEHICLE_ID, driverId: OTHER_DRIVER_ID, manufacturer: 'Hyundai', model: 'Elantra',
    vehicleType: 'sedan', modelYear: 2022, plateNumber: 'TEST-456', color: 'Black', seats: 4, isVerified: true,
  });

  await seedActiveSubscription(DRIVER_ID);
  await seedActiveSubscription(OTHER_DRIVER_ID);

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  otherDriverToken = generateAccessToken({ id: OTHER_DRIVER_ID, role: 'driver' });
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

async function createTrip(driverTokenArg, body = VALID_TRIP_BODY) {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverTokenArg}`)
    .send(body);
  return res.body.trip_id;
}

function makeRef() {
  return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}

describe('US2 - Driver Bookings', () => {
  describe('GET /api/driver/bookings', () => {
    it('should list bookings on own trips with masked phone and reference code', async () => {
      const tripId = await createTrip(driverToken);
      await Booking.create({
        tripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 15.5, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
      });

      const res = await getAgent()
        .get('/api/driver/bookings')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].passenger_name).toBe('Lina Haddad');
      expect(res.body.data[0].passenger_phone).not.toContain('792222');
      expect(res.body.data[0].passenger_phone).toContain('***');
      expect(res.body.data[0].passenger_phone.endsWith('2222')).toBe(true);
      expect(res.body.data[0].reference_code).toMatch(/^MSR-/);
      expect(res.body.data[0].status).toBe(BOOKING_STATUS.CONFIRMED);
      expect(res.body.data[0].trip_id).toBe(tripId);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.pagination.total_pages).toBe(1);
    });

    it('should filter by status', async () => {
      const tripId = await createTrip(driverToken);
      await Booking.create({
        tripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 15.5, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
      });
      await Booking.create({
        tripId, passengerId: PASSENGER_ID, seatNumber: 3, seatsBooked: 1,
        agreedFare: 15.5, status: BOOKING_STATUS.NO_SHOW, referenceCode: makeRef(),
      });

      const res = await getAgent()
        .get('/api/driver/bookings')
        .query({ status: BOOKING_STATUS.NO_SHOW })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe(BOOKING_STATUS.NO_SHOW);
    });

    it('should never return bookings from another driver\'s trips', async () => {
      const myTripId = await createTrip(driverToken);
      const otherTripId = await createTrip(otherDriverToken);

      await Booking.create({
        tripId: myTripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 15.5, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
      });
      await Booking.create({
        tripId: otherTripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 20, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
      });

      const res = await getAgent()
        .get('/api/driver/bookings')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].trip_id).toBe(myTripId);
    });

    it('should validate invalid status with 422', async () => {
      const res = await getAgent()
        .get('/api/driver/bookings')
        .query({ status: 'bogus' })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/driver/bookings/:booking_id', () => {
    it('should return booking detail with trip info', async () => {
      const tripId = await createTrip(driverToken);
      const booking = await Booking.create({
        tripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 15.5, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
      });

      const res = await getAgent()
        .get(`/api/driver/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.id).toBe(booking.id);
      expect(res.body.booking.passenger_name).toBe('Lina Haddad');
      expect(res.body.booking.seat_number).toBe(2);
      expect(res.body.booking.trip.origin).toBe('Amman');
      expect(res.body.booking.trip.destination).toBe('Irbid');
      expect(res.body.booking.reference_code).toMatch(/^MSR-/);
    });

    it('should return 403 for another driver\'s booking', async () => {
      const otherTripId = await createTrip(otherDriverToken);
      const booking = await Booking.create({
        tripId: otherTripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
        agreedFare: 20, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
      });

      const res = await getAgent()
        .get(`/api/driver/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await getAgent()
        .get('/api/driver/bookings/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(404);
    });
  });
});
