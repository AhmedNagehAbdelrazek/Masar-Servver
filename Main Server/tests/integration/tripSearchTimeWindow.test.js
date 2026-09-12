const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, Trip, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_A_ID = 'e3000000-0000-4000-8000-00000000aa01';
const DRIVER_B_ID = 'e3000000-0000-4000-8000-00000000aa02';
const PASSENGER_ID = 'e3000000-0000-4000-8000-00000000aa03';
const VEHICLE_A_ID = 'e3000000-0000-4000-8000-00000000aa10';
const VEHICLE_B_ID = 'e3000000-0000-4000-8000-00000000aa11';

let driverAToken;
let driverBToken;
let passengerToken;

function jordanDate(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

async function seedDriver(driverId, vehicleId, phone) {
  await User.create({
    id: driverId, fullName: `Driver ${driverId.slice(-2)}`, phone, countryCode: 'JO',
    role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: vehicleId, driverId, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: `PLT${driverId.slice(-2)}`, color: 'White', seats: 4, isVerified: true,
  });
}

async function createTripIso(token, iso) {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${token}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: iso,
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
  return res.body.trip_id;
}

beforeEach(async () => {
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: [DRIVER_A_ID, DRIVER_B_ID] }, force: true });
  await Vehicle.destroy({ where: { id: [VEHICLE_A_ID, VEHICLE_B_ID] }, force: true });
  await User.destroy({ where: { id: [DRIVER_A_ID, DRIVER_B_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: PASSENGER_ID, fullName: 'Search Passenger', phone: '+962795559099',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await seedDriver(DRIVER_A_ID, VEHICLE_A_ID, '+962795559091');
  await seedDriver(DRIVER_B_ID, VEHICLE_B_ID, '+962795559092');

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

  // A: tomorrow 10:00 and 16:00 (Jordan); B: day-after 09:00 (Jordan)
  await createTripIso(driverAToken, `${jordanDate(1)}T10:00:00+03:00`);
  await createTripIso(driverAToken, `${jordanDate(1)}T16:00:00+03:00`);
  await createTripIso(driverBToken, `${jordanDate(2)}T09:00:00+03:00`);
});

async function search(q) {
  const res = await getAgent()
    .get('/api/trips/search/available')
    .query({ origin_city: 'Amman', destination_city: 'Irbid', ...q })
    .set('Authorization', `Bearer ${passengerToken}`);
  expect(res.status).toBe(200);
  return res.body.trips.map((t) => t.departureTime);
}

describe('search time-window modes (getAvailableTrips)', () => {
  it('from-only: searched date and after, nearest future first', async () => {
    const got = await search({ date: jordanDate(1), time_from: '15:00' });
    expect(got).toEqual([
      `${jordanDate(1)}T13:00:00.000Z`, // 16:00+03:00
      `${jordanDate(2)}T06:00:00.000Z`, // 09:00+03:00 next day
    ]);
  });

  it('to-only: now till to-time', async () => {
    const got = await search({ date: jordanDate(1), time_to: '12:00' });
    expect(got).toEqual([`${jordanDate(1)}T07:00:00.000Z`]); // 10:00+03:00
  });

  it('both: window across the range, closest to from at top', async () => {
    const got = await search({ date: jordanDate(1), time_from: '09:00', time_to: '11:00' });
    expect(got).toEqual([
      `${jordanDate(1)}T07:00:00.000Z`, // 10:00+03:00, 1h from window start
      `${jordanDate(2)}T06:00:00.000Z`, // 09:00+03:00 next day, in-window by time-of-day
    ]);
  });

  it('from-only without date anchors to today (cutoff clamps to now when from already passed)', async () => {
    // From = Jordan midnight: the cutoff always clamps to now, so every
    // future trip is returned nearest-first — deterministic at any hour.
    const got = await search({ time_from: '00:00' });
    expect(got).toEqual([
      `${jordanDate(1)}T07:00:00.000Z`,
      `${jordanDate(1)}T13:00:00.000Z`,
      `${jordanDate(2)}T06:00:00.000Z`,
    ]);
  });
});
