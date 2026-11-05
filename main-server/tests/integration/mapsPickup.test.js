const { getAgent, getRedisStore } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, Notification, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const mapsClient = require('../../Services/mapsClient');
const routeService = require('../../Services/routeService');

const DRIVER_ID = 'e1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e1300000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e1300000-0000-4000-8000-000000000010';

let driverToken;
let passengerToken;

const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

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

async function createTrip(extra = {}) {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      origin_lat: 31.9539,
      origin_lng: 35.9106,
      destination_city: 'Irbid',
      destination_lat: 32.5568,
      destination_lng: 35.8469,
      departure_time: `${dayOffset(5 + Math.floor(Math.random() * 20))}T14:00:00+03:00`,
      type_of_trip: 'once',
      fare_per_seat: '15.50',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
      ...extra,
    });
  expect(res.status).toBe(201);
  return res.body.trip_id;
}

async function lockAndBook(tripId, seat, extraBody = {}) {
  await getAgent()
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${passengerToken}`)
    .send({ seat_number: seat });
  return getAgent()
    .post('/api/bookings')
    .set('Authorization', `Bearer ${passengerToken}`)
    .send({ trip_id: tripId, seat_numbers: [seat], agreed_fare: '15.50', ...extraBody });
}

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Pickup Driver', phone: '+962799141111',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Pickup Passenger', phone: '+962799142222',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'PCK-1301', color: 'White', seats: 4, isVerified: true,
  });
  await seed();
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

describe('US1 Integration - pickup booking, recompute, notify, cancel', () => {
  it('publishes with a ready route, books a custom pickup, bumps version, notifies driver', async () => {
    const tripId = await createTrip();
    const trip = await Trip.findByPk(tripId);
    expect(trip.routeStatus).toBe('ready');
    expect(Number(trip.routeVersion)).toBeGreaterThanOrEqual(1);

    const res = await lockAndBook(tripId, 2, { pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 } });
    expect(res.status).toBe(201);

    const booking = await Booking.findOne({ where: { tripId } });
    expect(booking.pickupType).toBe('custom');
    expect(Number(booking.pickupLat)).toBeCloseTo(32.25, 4);

    const after = await Trip.findByPk(tripId);
    expect(Number(after.routeVersion)).toBeGreaterThan(Number(trip.routeVersion));

    const note = await Notification.findOne({ where: { userId: DRIVER_ID, type: 'PICKUP_ADDED' } });
    expect(note).not.toBeNull();
  });

  it('accepts any custom pickup point, adds it to the route, and defaults missing pickup to origin', async () => {
    const tripId = await createTrip();

    const far = await lockAndBook(tripId, 2, { pickup: { name: 'Aqaba', lat: 29.53, lng: 35.01 } });
    expect(far.status).toBe(201);

    const farBooking = await Booking.findOne({
      where: { tripId, passengerId: PASSENGER_ID, seatNumber: 2 },
    });
    expect(Number(farBooking.pickupLat)).toBeCloseTo(29.53, 4);

    const route = await getAgent()
      .get(`/api/trips/${tripId}/route`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(route.status).toBe(200);
    expect(
      route.body.pickups.some(
        (p) => Math.abs(Number(p.lat) - 29.53) < 0.001 && Math.abs(Number(p.lng) - 35.01) < 0.001
      )
    ).toBe(true);

    const def = await lockAndBook(tripId, 3);
    expect(def.status).toBe(201);
    const defaultBooking = await Booking.findOne({
      where: { tripId, passengerId: PASSENGER_ID, seatNumber: 3 },
    });
    expect(Number(defaultBooking.pickupLat)).toBeCloseTo(31.9539, 4);
  });

  it('provider failure still publishes (route failed) and recovers via recompute', async () => {
    const spy = jest.spyOn(mapsClient, 'computeRoutes').mockRejectedValueOnce(new Error('boom'));
    const tripId = await createTrip();
    const failed = await Trip.findByPk(tripId);
    expect(failed.routeStatus).toBe('failed');

    const out = await routeService.computeTripRoute(tripId);
    expect(out.ok).toBe(true);
    const recovered = await Trip.findByPk(tripId);
    expect(recovered.routeStatus).toBe('ready');
    spy.mockRestore();
  });

  it('cancelling a booking recomputes and notifies without breaking', async () => {
    const tripId = await createTrip();
    const created = await lockAndBook(tripId, 2, { pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 } });
    const bookingId = created.body.booking.id;

    const cancelled = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});
    expect(cancelled.status).toBe(200);

    const trip = await Trip.findByPk(tripId);
    expect(trip.routeStatus).toBe('ready');
    const note = await Notification.findOne({ where: { userId: DRIVER_ID, type: 'PICKUP_CANCELLED' } });
    expect(note).not.toBeNull();
  });

  it('driver can replace stops: recompute, notify passengers, bump version', async () => {
    const tripId = await createTrip();
    await lockAndBook(tripId, 2, { pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 } });
    const before = await Trip.findByPk(tripId);

    const res = await getAgent()
      .patch(`/api/trips/${tripId}/stops`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ stops: [{ stop_name: 'Jerash', city: 'Jerash', lat: 32.27, lng: 35.89, stop_type: 'both' }] });
    expect(res.status).toBe(200);
    expect(res.body.stops).toBe(1);

    const after = await Trip.findByPk(tripId);
    expect(Number(after.routeVersion)).toBeGreaterThan(Number(before.routeVersion));
    const note = await Notification.findOne({ where: { userId: PASSENGER_ID, type: 'ROUTE_UPDATED' } });
    expect(note).not.toBeNull();
  });
});
