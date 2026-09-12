const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, Trip, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_A_ID = 'e3000000-0000-4000-8000-000000000001';
const DRIVER_B_ID = 'e3000000-0000-4000-8000-000000000003';
const PASSENGER_ID = 'e3000000-0000-4000-8000-000000000002';
const VEHICLE_A_ID = 'e3000000-0000-4000-8000-000000000010';
const VEHICLE_B_ID = 'e3000000-0000-4000-8000-000000000011';

let driverAToken;
let driverBToken;
let passengerToken;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function seedDriver(driverId, vehicleId, vehicleType, phone) {
  await User.create({
    id: driverId, fullName: `Driver ${vehicleType}`, phone, countryCode: 'JO',
    role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: vehicleId, driverId, manufacturer: 'Toyota', model: 'Camry',
    vehicleType, modelYear: 2023, plateNumber: `PLT${vehicleType}`, color: 'White', seats: 4, isVerified: true,
  });
}

async function createTrip(token, { departure_time, seats }) {
  return getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${getFutureDate(1)}T${departure_time}:00+03:00`,
      type_of_trip: 'once',
      fare_per_seat: '15.00',
      seats,
    });
}

beforeEach(async () => {
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: [DRIVER_A_ID, DRIVER_B_ID] }, force: true });
  await Vehicle.destroy({ where: { id: [VEHICLE_A_ID, VEHICLE_B_ID] }, force: true });
  await User.destroy({ where: { id: [DRIVER_A_ID, DRIVER_B_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: PASSENGER_ID, fullName: 'Search Passenger', phone: '+962795559010',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await seedDriver(DRIVER_A_ID, VEHICLE_A_ID, 'sedan', '+962795559011');
  await seedDriver(DRIVER_B_ID, VEHICLE_B_ID, 'van', '+962795559012');

  const plan = await SubscriptionPlan.create({
    name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
    features: [], isFree: false, isActive: true,
  });
  for (const driverId of [DRIVER_A_ID, DRIVER_B_ID]) {
    await DriverSubscription.create({
      driverId, planId: plan.id, planName: plan.name, planPeriodDays: plan.periodDays,
      planPercentageCut: plan.percentageCut, planCost: plan.cost, balance: 100,
      paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
      status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: driverId } });
  }

  driverAToken = generateAccessToken({ id: DRIVER_A_ID, role: 'driver' });
  driverBToken = generateAccessToken({ id: DRIVER_B_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

  // Driver A (sedan): seats 2,3 available (avail=2) at 10:00
  await createTrip(driverAToken, {
    departure_time: '10:00',
    seats: [
      { seat_number: 1, type: 'driver' },
      { seat_number: 2, type: 'available' },
      { seat_number: 3, type: 'available' },
      { seat_number: 4, type: 'unavailable' },
    ],
  });
  // Driver B (van): seats 2 available (avail=1) at 10:00
  await createTrip(driverBToken, {
    departure_time: '10:00',
    seats: [
      { seat_number: 1, type: 'driver' },
      { seat_number: 2, type: 'available' },
      { seat_number: 3, type: 'unavailable' },
      { seat_number: 4, type: 'unavailable' },
    ],
  });
});

describe('US1 - trip search filters', () => {
  it('base search returns all matching trips in the raw shape', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1) })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(2);
    const trip = res.body.trips[0];
    expect(typeof trip.id).toBe('string');
    expect(trip.originCity).toBe('Amman');
  });

  it('filters by vehicle_type', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1), vehicle_type: 'van' })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(1);
  });

  it('filters by minimum seats', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1), seats: 2 })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    // only driver A has >= 2 available seats
    expect(res.body.trips.length).toBe(1);
  });

  it('filters by time window (no trips in window -> empty)', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1), time_from: '15:00', time_to: '18:00' })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toEqual([]);
  });

  it('filters by time window (trips within window -> returned)', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1), time_from: '09:00', time_to: '11:00' })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(2);
  });

  it('returns trips on the date AND all future ones', async () => {
    // Seeded trips depart tomorrow; searching from today must still include them
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(0) })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips.length).toBe(2);
  });

  it('excludes stale recurring trips that neither start on/after the date nor run on it', async () => {
    // A recurring series whose first departure is already past and which does
    // not run on the searched weekday looks outdated and must not be returned,
    // even though the series itself has not ended yet.
    const searchedWeekday = new Date().getDay();
    const otherDay = (searchedWeekday + 1) % 7;

    const createRes = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverAToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: `${getFutureDate(1)}T10:00:00+03:00`,
        type_of_trip: 'repeated',
        repeated_days: [otherDay],
        repeated_end_date: getFutureDate(30),
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(createRes.status).toBe(201);
    const staleTripId = createRes.body.trip_id;
    expect(typeof staleTripId).toBe('string');

    // Backdate the first departure into the past to simulate a stale series
    const past = new Date();
    past.setDate(past.getDate() - 2);
    await Trip.update({ departureTime: past }, { where: { id: staleTripId } });

    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(0) })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    // only the 2 seeded once-trips departing tomorrow; the stale series is out
    expect(res.body.trips.length).toBe(2);
    expect(res.body.trips.map((t) => t.id)).not.toContain(staleTripId);
  });

  it('rejects invalid time range (from after to)', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: getFutureDate(1), time_from: '12:00', time_to: '09:00' })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(422);
  });
});
