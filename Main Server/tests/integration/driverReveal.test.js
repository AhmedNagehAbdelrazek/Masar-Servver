const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, TripSeat, Trip, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'f6000000-0000-4000-8000-000000000001';
const OWNER_ID = 'f6000000-0000-4000-8000-000000000002';
const OTHER_PASSENGER_ID = 'f6000000-0000-4000-8000-000000000003';
const ADMIN_ID = 'f6000000-0000-4000-8000-000000000004';
const VEHICLE_ID = 'f6000000-0000-4000-8000-000000000010';

let driverToken;
let ownerToken;
let otherPassengerToken;
let adminToken;
let tripId;
let bookingId;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function makeBooking() {
  await getAgent()
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ seat_number: 2 });
  const res = await getAgent()
    .post('/api/bookings')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.00' });
  return res.body.booking.id;
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, OWNER_ID, OTHER_PASSENGER_ID, ADMIN_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Reveal Driver', phone: '+962795559040',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    age: 34, gender: 'male', avgRating: 4.8, avatarUrl: 'http://example.com/d.png',
  });
  await User.create({
    id: OWNER_ID, fullName: 'Reveal Owner', phone: '+962795559041',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: OTHER_PASSENGER_ID, fullName: 'Reveal Other', phone: '+962795559042',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: ADMIN_ID, fullName: 'Reveal Admin', phone: '+962795559043',
    countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Hyundai', model: 'Elantra',
    vehicleType: 'sedan', modelYear: 2016, plateNumber: '12-34567', color: 'White', seats: 4, isVerified: true,
  });
  await DriverProfile.create({
    driverId: DRIVER_ID, totalTrips: 32, punctualityRate: 96, professionalDriver: true, responseRate: 100,
  });

  const plan = await SubscriptionPlan.create({
    name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
    features: [], isFree: false, isActive: true,
  });
  await DriverSubscription.create({
    driverId: DRIVER_ID, planId: plan.id, planName: plan.name, planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut, planCost: plan.cost, balance: 100,
    paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
  otherPassengerToken = generateAccessToken({ id: OTHER_PASSENGER_ID, role: 'passenger' });
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });

  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_date: getFutureDate(1),
      departure_time: '14:00',
      type_of_trip: 'once',
      fare_per_seat: '15.00',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
    });
  expect(res.status).toBe(201);
  tripId = res.body.trip_id;
});

describe('US5 - driver reveal for a confirmed booking', () => {
  beforeEach(async () => {
    bookingId = await makeBooking();
  });

  it('returns driver identity, stats and vehicle to the booking owner', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver.id).toBe(DRIVER_ID);
    expect(res.body.driver.first_name).toBe('Reveal');
    expect(res.body.driver.last_name).toBe('Driver');
    expect(res.body.driver.phone).toBe('+962795559040');
    expect(res.body.driver.age).toBe(34);
    expect(res.body.driver.gender).toBe('male');
    expect(res.body.driver.is_professional_driver).toBe(true);
    expect(res.body.driver.driver_stats).toMatchObject({
      punctuality_rate: 96,
      completed_trips: 32,
      rating: 4.8,
    });
    expect(res.body.driver.vehicle_details).toMatchObject({
      manufacturer: 'Hyundai',
      model: 'Elantra',
      year: 2016,
      color: 'White',
      plate_number: '12-34567',
      seat_capacity: 4,
    });
  });

  it('allows the trip driver to read their own reveal', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver.id).toBe(DRIVER_ID);
  });

  it('allows an admin to read the reveal', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.driver.id).toBe(DRIVER_ID);
  });

  it('forbids a non-participant passenger', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${otherPassengerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('YOU_DO_NOT_HAVE_ACCESS_TO_THIS_BOOKING_DRIVER_PROFILE');
  });

  it('returns 409 when the booking is not confirmed', async () => {
    await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${ownerToken}`);

    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/driver-profile`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DRIVER_REVEAL_AVAILABLE_ONLY_AFTER_BOOKING_CONFIRMATION');
  });

  it('returns 404 for an unknown booking', async () => {
    const res = await getAgent()
      .get('/api/bookings/f6000000-0000-4000-8000-000000000099/driver-profile')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(404);
  });
});
