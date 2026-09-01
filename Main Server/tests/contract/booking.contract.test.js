const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, Booking, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = 'c2000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'c2000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'c2000000-0000-4000-8000-000000000010';

let driverToken;
let passengerToken;
let tripId;

async function seed() {
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
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Contract Driver', phone: '+962799111111',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Contract Passenger', phone: '+962799222222',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'CTR-2001', color: 'White', seats: 4, isVerified: true,
  });

  await seed();

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

  const departureDate = (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })();
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_date: departureDate,
      departure_time: '14:00',
      type_of_trip: 'once',
      fare_per_seat: '15.50',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
    });
  tripId = res.body.trip_id;
});

describe('US2 Contract - Passenger Booking Endpoints', () => {
  it('POST /api/bookings returns 201 with booking envelope fields', async () => {
    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });

    const res = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.50' });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.reference_code).toMatch(/^MSR-[A-Z0-9]{6}$/);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.payment_status).toBe('pending');
  });

  it('GET /api/bookings returns data + pagination envelope', async () => {
    const res = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 0,
    });
  });

  it('GET /api/bookings/:booking_id returns detail envelope with trip and driver', async () => {
    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
    const created = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.50' });
    const bookingId = created.body.booking.id;

    const res = await getAgent()
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.trip.origin).toMatchObject({ city: 'Amman' });
    expect(res.body.booking.trip.destination).toMatchObject({ city: 'Irbid' });
    expect(res.body.booking.trip.price).toBe(15.5);
    expect(typeof res.body.booking.driver.rating).toBe('number');
    expect(res.body.booking.driver).toMatchObject({
      id: DRIVER_ID,
      full_name: 'Contract Driver',
    });
    expect(res.body.booking.driver.phone_masked).not.toBe('+962799111111');
  });

  it('POST /api/bookings without lock returns 404 SEAT_LOCK_EXPIRED error code', async () => {
    const res = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_number: 3, agreed_fare: '15.50' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SEAT_LOCK_EXPIRED');
  });

  it('POST /api/bookings/:booking_id/cancel returns cancelled status', async () => {
    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
    const created = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.50' });
    const bookingId = created.body.booking.id;

    const res = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('cancelled');
    expect(res.body.booking.cancelled_at).toBeDefined();
  });
});

describe('US5 Contract - Driver Profile Reveal', () => {
  it('GET /api/bookings/:booking_id/driver-profile returns reveal shape', async () => {
    await User.update(
      { age: 34, gender: 'male' },
      { where: { id: DRIVER_ID } }
    );
    await DriverProfile.create({
      driverId: DRIVER_ID, totalTrips: 32, punctualityRate: 96, professionalDriver: true,
    });

    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
    const created = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.50' });
    const bookingId = created.body.booking.id;

    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver).toMatchObject({
      first_name: 'Contract',
      last_name: 'Driver',
      phone: '+962799111111',
      age: 34,
      gender: 'male',
      is_professional_driver: true,
      driver_stats: {
        punctuality_rate: 96,
        completed_trips: 32,
        rating: 0,
      },
      vehicle_details: {
        manufacturer: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
        plate_number: 'CTR-2001',
        seat_capacity: 4,
      },
    });
  });

  it('GET driver-profile on cancelled booking returns 409 reveal code', async () => {
    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
    const created = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.50' });
    const bookingId = created.body.booking.id;
    await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passengerToken}`);

    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION');
  });
});
