const { getAgent } = require('../setup/setup');
const {
  User,
  Vehicle,
  Trip,
  TripSeat,
  TripStop,
  SubscriptionPlan,
  DriverSubscription,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const { encode, haversineM } = require('../../Services/geo');

const DRIVER_ID = 'e4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e4000000-0000-4000-8000-000000000010';

const AMMAN = [31.9539, 35.9106];
const IRBID = [32.5568, 35.8469];
const ZARQA = [32.25, 35.8793];
const AQABA = [29.532, 35.006];

let driverToken;
let passengerToken;
let tripAmmanIrbid;
let tripWiden;
let tripReturn;

function jordanDate(daysAhead = 1) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Amman',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date(Date.now() + daysAhead * 24 * 3600 * 1000));
}

function routeDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineM(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return Math.round(total);
}

async function seedDriver() {
  await User.create({
    id: DRIVER_ID,
    fullName: 'Proximity Driver',
    phone: '+962796666001',
    countryCode: 'JO',
    role: 'driver',
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
    plateNumber: 'PS-V1',
    color: 'White',
    seats: 4,
    isVerified: true,
  });
  const plan = await SubscriptionPlan.create({
    name: 'Proximity Basic',
    periodDays: 30,
    percentageCut: 8,
    cost: 100,
    features: [],
    isFree: false,
    isActive: true,
  });
  const now = new Date();
  await DriverSubscription.create({
    driverId: DRIVER_ID,
    planId: plan.id,
    planName: plan.name,
    planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut,
    planCost: plan.cost,
    balance: 100,
    paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE,
    approvedAt: now,
    activatedAt: now,
    expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
  });
  await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
}

async function createTrip(date, time, body) {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${date}T${time}:00+03:00`,
      type_of_trip: 'once',
      fare_per_seat: '15.00',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'available' },
      ],
      ...body,
    });
  expect(res.status).toBe(201);
  return res.body.trip_id;
}

async function setRoute(tripId, points) {
  await Trip.update(
    {
      routePolyline: encode(points),
      routeStatus: 'ready',
      routeDistanceM: routeDistance(points),
      routeDurationS: 5400,
      routeVersion: 1,
    },
    { where: { id: tripId } },
  );
}

beforeEach(async () => {
  await TripSeat.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await SubscriptionPlan.destroy({ where: { name: 'Proximity Basic' }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Proximity Passenger',
    phone: '+962796666002',
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await seedDriver();
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

  tripAmmanIrbid = await createTrip(jordanDate(1), '10:00', {
    origin_lat: AMMAN[0],
    origin_lng: AMMAN[1],
    destination_lat: IRBID[0],
    destination_lng: IRBID[1],
  });
  await setRoute(tripAmmanIrbid, [AMMAN, ZARQA, IRBID]);

  tripWiden = await createTrip(jordanDate(2), '10:00', {
    origin_lat: AMMAN[0],
    origin_lng: 35.9379,
    destination_lat: IRBID[0],
    destination_lng: IRBID[1],
  });
  await setRoute(tripWiden, [[AMMAN[0], 35.9379], IRBID]);

  tripReturn = await createTrip(jordanDate(3), '10:00', {
    origin_city: 'Irbid',
    destination_city: 'Amman',
    origin_lat: IRBID[0],
    origin_lng: IRBID[1],
    destination_lat: AMMAN[0],
    destination_lng: AMMAN[1],
  });
  await setRoute(tripReturn, [IRBID, AMMAN]);

  const far = await createTrip(jordanDate(4), '10:00', {
    origin_city: 'Aqaba',
    destination_city: 'Amman',
    origin_lat: AQABA[0],
    origin_lng: AQABA[1],
    destination_lat: AMMAN[0],
    destination_lng: AMMAN[1],
  });
  await setRoute(far, [AQABA, AMMAN]);
});

function search(query) {
  return getAgent()
    .get('/api/trips/search/available')
    .query(query)
    .set('Authorization', `Bearer ${passengerToken}`);
}

describe('trip search proximity (v1)', () => {
  it('matches by coordinates even when city strings differ', async () => {
    const res = await search({
      origin_city: 'Nowhere',
      destination_city: 'Nowhere',
      origin_lat: AMMAN[0],
      origin_lng: AMMAN[1],
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
      include_enroute: 'false',
      date: jordanDate(1),
    });
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].id).toBe(tripAmmanIrbid);
    expect(res.body.trips[0].search_match.origin.kind).toBe('origin');
    expect(res.body.trips[0].search_match.destination.kind).toBe('destination');
    expect(res.body.search.widened).toBe(false);
  });

  it('matches a passenger 10 m from the trip origin', async () => {
    const res = await search({
      origin_lat: AMMAN[0] + 10 / 111320,
      origin_lng: AMMAN[1],
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
      include_enroute: 'false',
      date: jordanDate(1),
    });
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].search_match.origin.distance_m).toBeLessThanOrEqual(20);
  });

  it('returns nothing for a pickup far from every endpoint', async () => {
    const res = await search({
      origin_lat: AQABA[0],
      origin_lng: AQABA[1],
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
      include_enroute: 'false',
      date: jordanDate(1),
    });
    expect(res.status).toBe(200);
    expect(res.body.trips).toEqual([]);
    expect(res.body.search.widened).toBe(false);
  });

  it('widens the radius once when the tight search is empty', async () => {
    const res = await search({
      origin_lat: AMMAN[0],
      origin_lng: AMMAN[1],
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
      include_enroute: 'false',
      date: jordanDate(2),
    });
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].id).toBe(tripWiden);
    expect(res.body.search.widened).toBe(true);
    expect(res.body.search.origin_radius_m).toBe(5000);
  });

  it('matches a pickup in the route corridor and a short hop', async () => {
    const corridor = await search({
      origin_lat: 32.1,
      origin_lng: 35.8886,
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
      date: jordanDate(1),
    });
    expect(corridor.status).toBe(200);
    expect(corridor.body.trips).toHaveLength(1);
    expect(corridor.body.trips[0].search_match.origin.kind).toBe('enroute');

    const shortHop = await search({
      origin_lat: 32.1,
      origin_lng: 35.8886,
      destination_lat: 32.35,
      destination_lng: 35.866,
      date: jordanDate(1),
    });
    expect(shortHop.status).toBe(200);
    expect(shortHop.body.trips).toHaveLength(1);
    expect(shortHop.body.trips[0].search_match.destination.kind).toBe('enroute');
  });

  it('swaps coordinates for returning trips without city strings', async () => {
    const res = await search({
      origin_lat: AMMAN[0],
      origin_lng: AMMAN[1],
      destination_lat: IRBID[0],
      destination_lng: IRBID[1],
      date: jordanDate(1),
      return_date: jordanDate(3),
    });
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.returning_trips).toHaveLength(1);
    expect(res.body.returning_trips[0].id).toBe(tripReturn);
  });

  it('keeps the case-insensitive city fallback', async () => {
    const res = await search({
      origin_city: 'amman',
      destination_city: 'IRBID',
      date: jordanDate(1),
    });
    expect(res.status).toBe(200);
    expect(res.body.trips.map((t) => t.id)).toContain(tripAmmanIrbid);
  });

  it('rejects a latitude without a longitude', async () => {
    const res = await search({ origin_lat: AMMAN[0], date: jordanDate(1) });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
