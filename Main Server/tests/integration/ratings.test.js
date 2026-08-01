const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, Rating, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_PHONE = '+962791111111';
const PASSENGER_PHONE = '+962792222222';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440010';

let driverToken;
let passengerToken;

async function seedActiveSubscription() {
  const plan = await SubscriptionPlan.create({
    name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
    features: [], isFree: false, isActive: true,
  });
  await DriverSubscription.create({
    driverId: DRIVER_ID, planId: plan.id, planName: plan.name,
    planPeriodDays: plan.periodDays, planPercentageCut: plan.percentageCut,
    planCost: plan.cost, balance: 100,
    paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
}

beforeEach(async () => {
  await Rating.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER_PHONE] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Omar Khaled', phone: DRIVER_PHONE,
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true, avgRating: 0,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Lina Haddad', phone: PASSENGER_PHONE,
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true, avgRating: 0,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'TEST-123', color: 'White', seats: 4, isVerified: true,
  });

  await seedActiveSubscription();

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

const VALID_TRIP_BODY = {
  origin_city: 'Amman', origin_area: 'Abdoun', origin_lat: '31.9500', origin_lng: '35.9100',
  destination_city: 'Irbid', destination_area: 'Downtown', destination_lat: '32.5500', destination_lng: '35.8500',
  departure_date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
  departure_time: '14:00', type_of_trip: 'once', fare_per_seat: '15.50',
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

function makeRef() {
  return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}

async function createBooking() {
  const tripRes = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send(VALID_TRIP_BODY);
  const tripId = tripRes.body.trip_id;
  return Booking.create({
    tripId, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
    agreedFare: 15.5, status: BOOKING_STATUS.CONFIRMED, referenceCode: makeRef(),
  });
}

describe('US3 - Ratings', () => {
  describe('POST /api/ratings', () => {
    it('should let passenger rate driver and recompute avg_rating', async () => {
      const booking = await createBooking();

      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          booking_id: booking.id,
          stars: 5,
          was_late: false,
          review: 'Smooth ride, on time',
          tags: ['punctual', 'clean_car'],
        });

      expect(res.status).toBe(200);
      expect(res.body.rating).toBeDefined();
      expect(res.body.rating.stars).toBe(5);
      expect(res.body.rating.review).toBe('Smooth ride, on time');
      expect(res.body.rating.tags).toEqual(['punctual', 'clean_car']);
      expect(res.body.rating.booking_id).toBe(booking.id);
      expect(res.body.already_rated).toBe(false);

      const driver = await User.findByPk(DRIVER_ID);
      expect(parseFloat(driver.avgRating)).toBe(5);
    });

    it('should be idempotent — second rating returns existing with already_rated true', async () => {
      const booking = await createBooking();

      await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ booking_id: booking.id, stars: 5 });

      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ booking_id: booking.id, stars: 1 });

      expect(res.status).toBe(200);
      expect(res.body.already_rated).toBe(true);
      expect(res.body.rating.stars).toBe(5);

      const count = await Rating.count({ where: { bookingId: booking.id } });
      expect(count).toBe(1);
    });

    it('should let driver rate passenger', async () => {
      const booking = await createBooking();

      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ booking_id: booking.id, stars: 4 });

      expect(res.status).toBe(200);
      expect(res.body.rating.stars).toBe(4);

      const rating = await Rating.findOne({ where: { bookingId: booking.id } });
      expect(rating.rateeId).toBe(PASSENGER_ID);
      expect(rating.raterId).toBe(DRIVER_ID);
    });

    it('should reject negative late_minutes with 422', async () => {
      const booking = await createBooking();
      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ booking_id: booking.id, stars: 4, late_minutes: -1 });

      expect(res.status).toBe(422);
    });

    it('should reject stars out of range with 422', async () => {
      const booking = await createBooking();
      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ booking_id: booking.id, stars: 6 });

      expect(res.status).toBe(422);
    });

    it('should return 404 for unknown booking', async () => {
      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ booking_id: '550e8400-e29b-41d4-a716-446655440099', stars: 4 });

      expect(res.status).toBe(404);
    });

    it('should reject a third party who is not part of the booking with 403', async () => {
      const booking = await createBooking();
      const outsiderToken = generateAccessToken({ id: '550e8400-e29b-41d4-a716-446655440098', role: 'passenger' });
      await User.create({
        id: '550e8400-e29b-41d4-a716-446655440098', fullName: 'Outsider',
        phone: '+962799999999', countryCode: 'JO', role: 'passenger',
        passwordHash: 'hashed', isVerified: true, avgRating: 0,
      });

      const res = await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ booking_id: booking.id, stars: 5 });

      expect(res.status).toBe(403);
      const count = await Rating.count({ where: { bookingId: booking.id } });
      expect(count).toBe(0);
      await User.destroy({ where: { id: '550e8400-e29b-41d4-a716-446655440098' }, force: true });
    });
  });

  describe('GET /api/driver/ratings', () => {
    it('should list ratings received with rater_name and pagination', async () => {
      const booking = await createBooking();
      await getAgent()
        .post('/api/ratings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ booking_id: booking.id, stars: 5 });

      const res = await getAgent()
        .get('/api/driver/ratings')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].stars).toBe(5);
      expect(res.body.data[0].rater_name).toBe('Lina Haddad');
      expect(res.body.data[0].booking_id).toBe(booking.id);
      expect(res.body.pagination.total).toBe(1);
    });
  });
});
