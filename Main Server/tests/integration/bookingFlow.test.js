const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, SubscriptionPlan, DriverSubscription, Booking } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_PHONE = '+962795556001';
const PASSENGER1_PHONE = '+962795556002';
const PASSENGER2_PHONE = '+962795556003';
const DRIVER_ID = 'a1000000-0000-4000-8000-000000000001';
const PASSENGER1_ID = 'a1000000-0000-4000-8000-000000000002';
const PASSENGER2_ID = 'a1000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'a1000000-0000-4000-8000-000000000010';
let driverToken;
let passenger1Token;
let passenger2Token;
let tripId;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function createTripFixture() {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_date: getFutureDate(1),
      departure_time: '15:00',
      type_of_trip: 'once',
      fare_per_seat: '20.00',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
    });
  expect(res.status).toBe(201);
  return res.body.trip_id;
}

async function lockSeat(token, seatNumber) {
  return getAgent()
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${token}`)
    .send({ seat_number: seatNumber });
}

async function createBooking(token, overrides = {}) {
  return getAgent()
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({
      trip_id: tripId,
      seat_number: 2,
      agreed_fare: '20.00',
      ...overrides,
    });
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER1_PHONE, PASSENGER2_PHONE] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Booking Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER1_ID,
    fullName: 'Booking Passenger 1',
    phone: PASSENGER1_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER2_ID,
    fullName: 'Booking Passenger 2',
    phone: PASSENGER2_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
  passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });

  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'BKF-101',
    color: 'White',
    seats: 4,
    isVerified: true,
  });

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

  tripId = await createTripFixture();
});

describe('POST /api/bookings - create booking from locked seat', () => {
  it('should create a confirmed booking from a held seat lock', async () => {
    await lockSeat(passenger1Token, 2);

    const res = await createBooking(passenger1Token);

    expect(res.status).toBe(201);
    expect(res.body.booking.id).toBeDefined();
    expect(res.body.booking.reference_code).toMatch(/^MSR-[A-Z0-9]{6}$/);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.payment_status).toBe('pending');
    expect(res.body.booking.seat_number).toBe(2);
    expect(res.body.booking.agreed_fare).toBe(20);
    expect(res.body.booking.driver.phone_masked).not.toBe('+962795556001');
  });

  it('should mark the seat unavailable and decrement trip capacity', async () => {
    await lockSeat(passenger1Token, 2);
    const res = await createBooking(passenger1Token);
    expect(res.status).toBe(201);

    const seat = await TripSeat.findOne({ where: { tripId: tripId, seatNumber: 2 } });
    expect(seat.seatType).toBe('unavailable');

    const trip = await Trip.findByPk(tripId);
    expect(trip.availableSeats).toBe(1);

    const booking = await Booking.findOne({ where: { tripId } });
    expect(booking.status).toBe('confirmed');
  });

  it('should flip trip status to full when the last seat is booked', async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);
    await lockSeat(passenger1Token, 3);
    const res = await createBooking(passenger1Token, { seat_number: 3 });
    expect(res.status).toBe(201);

    const trip = await Trip.findByPk(tripId);
    expect(trip.availableSeats).toBe(0);
    expect(trip.status).toBe('full');
  });

  it('should reject when no seat lock is held', async () => {
    const res = await createBooking(passenger1Token);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it('should reject when the lock belongs to another passenger', async () => {
    await lockSeat(passenger1Token, 2);

    const res = await createBooking(passenger2Token);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it('should reject when agreed_fare does not match trip fare', async () => {
    await lockSeat(passenger1Token, 2);

    const res = await createBooking(passenger1Token, { agreed_fare: '25.00' });

    expect(res.status).toBe(422);
  });

  it('should reject booking an already-booked seat', async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);

    const lockRes = await lockSeat(passenger2Token, 2);
    expect(lockRes.status).toBe(422);

    const res = await createBooking(passenger2Token);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it('should reject a driver creating a passenger booking', async () => {
    const res = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '20.00' });

    expect(res.status).toBe(403);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await getAgent()
      .post('/api/bookings')
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '20.00' });

    expect(res.status).toBe(401);
  });

  it('should reject invalid payload', async () => {
    const res = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ trip_id: 'not-a-uuid' });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/bookings - passenger booking list', () => {
  beforeEach(async () => {
    await lockSeat(passenger1Token, 2);
    await createBooking(passenger1Token);
  });

  it('should list own bookings with masked driver phone', async () => {
    const res = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('confirmed');
    expect(res.body.data[0].reference_code).toMatch(/^MSR-/);
    expect(String(res.body.data[0].driver.phone_masked)).not.toContain('5556001');
    expect(res.body.pagination).toBeDefined();
  });

  it('should filter bookings by status', async () => {
    const res = await getAgent()
      .get('/api/bookings?status=cancelled')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('should not include another passenger bookings', async () => {
    const res = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

describe('GET /api/bookings/:booking_id - booking detail', () => {
  let bookingId;

  beforeEach(async () => {
    await lockSeat(passenger1Token, 2);
    const res = await createBooking(passenger1Token);
    bookingId = res.body.booking.id;
  });

  it('should return booking detail for the owner', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.id).toBe(bookingId);
    expect(res.body.booking.trip.origin).toBe('Amman');
    expect(res.body.booking.driver.full_name).toBe('Booking Driver');
  });

  it('should forbid another passenger from viewing the booking', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for unknown booking', async () => {
    const fakeId = 'b1000000-0000-4000-8000-000000000099';
    const res = await getAgent()
      .get(`/api/bookings/${fakeId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/bookings/:booking_id/cancel', () => {
  let bookingId;

  beforeEach(async () => {
    await lockSeat(passenger1Token, 2);
    const res = await createBooking(passenger1Token);
    bookingId = res.body.booking.id;
  });

  it('should cancel a booking more than one hour before departure', async () => {
    const res = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');

    const seat = await TripSeat.findOne({ where: { tripId: tripId, seatNumber: 2 } });
    expect(seat.seatType).toBe('available');

    const trip = await Trip.findByPk(tripId);
    expect(trip.availableSeats).toBe(2);

    const booking = await Booking.findByPk(bookingId);
    expect(booking.cancelledAt).toBeTruthy();
    expect(booking.cancellationReason).toBe('cancelled_by_passenger');
  });

  it('should restore trip status from full to published on cancellation', async () => {
    await lockSeat(passenger1Token, 3);
    await createBooking(passenger1Token, { seat_number: 3 });
    let trip = await Trip.findByPk(tripId);
    expect(trip.status).toBe('full');

    const res = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(res.status).toBe(200);

    trip = await Trip.findByPk(tripId);
    expect(trip.status).toBe('published');
  });

  it('should allow the seat to be rebooked after cancellation', async () => {
    await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    const lockRes = await lockSeat(passenger2Token, 2);
    expect(lockRes.status).toBe(200);

    const res = await createBooking(passenger2Token);
    expect(res.status).toBe(201);
    expect(res.body.booking.passenger.full_name).toBe('Booking Passenger 2');
  });

  it('should reject cancelling twice', async () => {
    await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    const res = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(409);
  });

  it('should reject cancelling inside the one-hour window', async () => {
    await Trip.update(
      { departureTime: new Date(Date.now() + 30 * 60 * 1000) },
      { where: { id: tripId } }
    );

    const res = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CANCELLATION_WINDOW_CLOSED');
  });

  it('should forbid another passenger from cancelling', async () => {
    const res = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(res.status).toBe(403);
  });
});
