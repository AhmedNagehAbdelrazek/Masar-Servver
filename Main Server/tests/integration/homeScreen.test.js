const { getAgent, getRedisStore } = require('../setup/setup');
const {
  User,
  DriverProfile,
  Vehicle,
  Trip,
  TripSeat,
  Booking,
  SubscriptionPlan,
  DriverSubscription,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const {
  TRIP_STATUS,
  SUBSCRIPTION_STATUS,
  BOOKING_STATUS,
  USER_STATUS,
} = require('../../config/constants');

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e51';
const DRIVER2_ID = '550e8400-e29b-41d4-a716-446655440e52';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440e53';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440e60';
const VEHICLE2_ID = '550e8400-e29b-41d4-a716-446655440e61';

let driverToken;

function future(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

async function seedDriver(userId, vehicleId, { verified = true, status = USER_STATUS.ACTIVE } = {}) {
  const phone = `+962710000${userId.slice(-6)}`;
  await User.create({
    id: userId,
    fullName: `Driver ${userId.slice(-2)}`,
    phone,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: verified,
    status,
    avgRating: 4.5,
  });
  await DriverProfile.create({ driverId: userId, totalTrips: 10 });
  await Vehicle.create({
    id: vehicleId,
    driverId: userId,
    manufacturer: 'Hyundai',
    model: 'Elantra',
    vehicleType: 'sedan',
    modelYear: 2021,
    plateNumber: `ABC-${vehicleId.slice(-4)}`,
    color: 'White',
    seats: 4,
    isVerified: true,
  });
}

async function seedActiveSubscription(userId, balance = 100) {
  const plan = await SubscriptionPlan.create({
    name: 'Basic',
    periodDays: 30,
    percentageCut: 8,
    cost: 100,
    features: [],
    isFree: false,
    isActive: true,
  });
  const sub = await DriverSubscription.create({
    driverId: userId,
    planId: plan.id,
    planName: plan.name,
    planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut,
    planCost: plan.cost,
    balance,
    paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE,
    approvedAt: new Date(),
    activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await User.update({ totalBalance: balance, isInDebt: false }, { where: { id: userId } });
  return sub;
}

async function createTrip(userId, vehicleId, departureTime, { status = TRIP_STATUS.PUBLISHED, availableSeats = 1, totalSeats = 4 } = {}) {
  const trip = await Trip.create({
    driverId: userId,
    vehicleId,
    originCity: 'Amman',
    originArea: 'Abdoun',
    destinationCity: 'Irbid',
    destinationArea: 'Downtown',
    departureTime,
    totalSeats,
    availableSeats,
    farePerSeat: 5,
    isRecurring: false,
    genderPreference: 'all',
    status,
  });
  await TripSeat.bulkCreate([
    { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
    { tripId: trip.id, seatNumber: 2, seatType: 'available' },
  ]);
  return trip;
}

async function addBooking(tripId, passengerId, { seatNumber = 2, seatsBooked = 1, status = BOOKING_STATUS.CONFIRMED, ref = 'REF00000001' } = {}) {
  return Booking.create({
    tripId,
    passengerId,
    seatNumber,
    seatsBooked,
    agreedFare: 5,
    referenceCode: ref,
    status,
  });
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { driverId: [DRIVER_ID, DRIVER2_ID] }, force: true });
  await DriverProfile.destroy({ where: { driverId: [DRIVER_ID, DRIVER2_ID] }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, DRIVER2_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Passenger One',
    phone: '+962710000253',
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await seedDriver(DRIVER_ID, VEHICLE_ID);
  await seedDriver(DRIVER2_ID, VEHICLE2_ID);

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

describe('US1 - Home screen', () => {
  it('returns the full home payload with can_start true and derived seat numbers', async () => {
    await seedActiveSubscription(DRIVER_ID);
    const trip = await createTrip(DRIVER_ID, VEHICLE_ID, future(30));
    await addBooking(trip.id, PASSENGER_ID, { seatNumber: 2 });

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver.full_name).toBe('Driver 51');
    expect(res.body.driver.rating).toBe(4.5);
    expect(res.body.driver.total_trips_completed).toBe(10);
    expect(res.body.subscription.tier).toBe('basic');
    expect(res.body.subscription.price).toBe(100);
    expect(res.body.subscription.days_remaining).toBeGreaterThan(0);
    expect(res.body.subscription.free_trips).toBeNull();
    expect(res.body.next_trip.trip_id).toBe(trip.id);
    expect(res.body.next_trip.can_start).toBe(true);
    expect(res.body.next_trip.passengers).toEqual([
      expect.objectContaining({
        booking_id: expect.any(String),
        passenger_name: 'Passenger One',
        seats_booked: 1,
        seat_numbers: [2],
      }),
    ]);
    expect(res.body.next_trip.booked_seats_count).toBe(1);
    expect(res.body.summary.reserved_seats_for_next_trip).toBe(1);
    expect(res.body.recent_bookings).toHaveLength(1);
    expect(res.body.recent_bookings[0].seat_numbers).toEqual([2]);
  });

  it('returns can_start false for a trip more than one hour away', async () => {
    await seedActiveSubscription(DRIVER_ID);
    const trip = await createTrip(DRIVER_ID, VEHICLE_ID, future(120));

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.next_trip.trip_id).toBe(trip.id);
    expect(res.body.next_trip.can_start).toBe(false);
  });

  it('computes summary counts over the today window', async () => {
    await seedActiveSubscription(DRIVER_ID);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    startOfToday.setSeconds(1);
    await createTrip(DRIVER_ID, VEHICLE_ID, startOfToday, { status: TRIP_STATUS.COMPLETED });
    await createTrip(DRIVER_ID, VEHICLE_ID, future(30));

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.completed_trips_today).toBe(1);
    expect(res.body.summary.trips_today).toBe(2);
  });

  it('derives empty seat_numbers for bookings without a seat number', async () => {
    await seedActiveSubscription(DRIVER_ID);
    const trip = await createTrip(DRIVER_ID, VEHICLE_ID, future(30));
    await addBooking(trip.id, PASSENGER_ID, { seatNumber: null, ref: 'REF00000002' });

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.next_trip.passengers[0].seat_numbers).toEqual([]);
    expect(res.body.recent_bookings[0].seat_numbers).toEqual([]);
  });

  it('serves the second call from the Redis cache', async () => {
    await seedActiveSubscription(DRIVER_ID);
    const trip = await createTrip(DRIVER_ID, VEHICLE_ID, future(30));
    await addBooking(trip.id, PASSENGER_ID, { seatNumber: 2 });

    const first = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(first.status).toBe(200);

    const cachedRaw = getRedisStore().get(`driver_home:${DRIVER_ID}`);
    expect(cachedRaw).toBeDefined();
    expect(JSON.parse(cachedRaw)).toEqual(first.body);

    const second = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
  });

  it('returns 403 for an unverified driver', async () => {
    await User.update({ isVerified: false }, { where: { id: DRIVER_ID } });

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 for a suspended driver', async () => {
    await User.update({ status: USER_STATUS.SUSPENDED }, { where: { id: DRIVER_ID } });

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(403);
  });

  it('exposes remaining free trips for a free-trips plan', async () => {
    const plan = await SubscriptionPlan.create({
      name: 'Starter',
      periodDays: 30,
      percentageCut: 10,
      cost: 0,
      features: [],
      isFree: true,
      freeOffer: { type: 'trips', value: 5 },
      isActive: true,
    });
    await DriverSubscription.create({
      driverId: DRIVER_ID,
      planId: plan.id,
      planName: plan.name,
      planPeriodDays: plan.periodDays,
      planPercentageCut: plan.percentageCut,
      planCost: plan.cost,
      balance: 0,
      paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
      status: SUBSCRIPTION_STATUS.ACTIVE,
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      freeOffer: { type: 'trips', value: 5 },
      freeTripsUsed: 2,
    });
    await createTrip(DRIVER_ID, VEHICLE_ID, future(30));

    const res = await getAgent()
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.tier).toBe('starter');
    expect(res.body.subscription.price).toBe(0);
    expect(res.body.subscription.free_trips).toEqual({ max: 5, used: 2, remaining: 3 });
  });
});
