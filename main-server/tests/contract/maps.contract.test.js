const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = 'd1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'd1300000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'd1300000-0000-4000-8000-000000000010';

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
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Maps Driver', phone: '+962799131111',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Maps Passenger', phone: '+962799132222',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'MAPS-1301', color: 'White', seats: 4, isVerified: true,
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
      origin_lat: 31.9539,
      origin_lng: 35.9106,
      destination_city: 'Irbid',
      destination_lat: 32.5568,
      destination_lng: 35.8469,
      departure_time: `${departureDate}T14:00:00+03:00`,
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

describe('US1 Contract - Maps endpoints', () => {
  it('POST /api/maps/route-preview returns polyline, distance, duration, arrival', async () => {
    const res = await getAgent()
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin: { lat: 31.9539, lng: 35.9106 },
        destination: { lat: 32.5568, lng: 35.8469 },
        stops: [],
      });

    expect(res.status).toBe(200);
    expect(typeof res.body.polyline).toBe('string');
    expect(res.body.distance_m).toBeGreaterThan(0);
    expect(res.body.duration_s).toBeGreaterThan(0);
    expect(res.body.suggested_arrival).toBeDefined();
  });

  it('POST /api/maps/route-preview rejects passengers and identical points', async () => {
    const denied = await getAgent()
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ origin: { lat: 31.95, lng: 35.91 }, destination: { lat: 32.55, lng: 35.84 } });
    expect(denied.status).toBe(403);

    const same = await getAgent()
      .post('/api/maps/route-preview')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ origin: { lat: 31.9539, lng: 35.9106 }, destination: { lat: 31.9539, lng: 35.9106 } });
    expect(same.status).toBe(422);
    expect(same.body.code).toBe('ORIGIN_DESTINATION_TOO_CLOSE');
  });

  it('POST /api/maps/reverse-geocode resolves a label', async () => {
    const res = await getAgent()
      .post('/api/maps/reverse-geocode')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 31.9539, lng: 35.9106 });

    expect(res.status).toBe(200);
    expect(res.body.label).toBeDefined();
  });

  it('POST /api/trips/:id/pickup-preview accepts near, rejects far', async () => {
    const near = await getAgent()
      .post(`/api/trips/${tripId}/pickup-preview`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 32.25, lng: 35.8793 });

    expect(near.status).toBe(200);
    expect(near.body.accepted).toBe(true);
    expect(near.body.detour_seconds).toBeDefined();

    const far = await getAgent()
      .post(`/api/trips/${tripId}/pickup-preview`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 31.5, lng: 35.5 });

    expect(far.status).toBe(200);
    expect(far.body.accepted).toBe(false);
    expect(far.body.reason).toBe('PICKUP_TOO_FAR_FROM_ROUTE');
  });

  it('identical route-preview hits cache with zero provider calls', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const body = {
      origin: { lat: 31.9539, lng: 35.9106 },
      destination: { lat: 32.5568, lng: 35.8469 },
      stops: [],
    };
    const first = await getAgent().post('/api/maps/route-preview').set('Authorization', `Bearer ${driverToken}`).send(body);
    const callsAfterFirst = fetchSpy.mock.calls.length;
    const second = await getAgent().post('/api/maps/route-preview').set('Authorization', `Bearer ${driverToken}`).send(body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.cached).toBe(true);
    // MAPS_MOCK never touches the network; the cache proves no recompute either.
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst);
    fetchSpy.mockRestore();
  });
});
