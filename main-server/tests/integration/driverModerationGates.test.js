/**
 * Client report regression: a temp-stopped (suspension penalty) driver could
 * still publish trips and no signal was sent. These tests pin the moderation
 * gates on every mutating driver flow while read access stays available.
 */
const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, Trip, TripSeat, Booking, SubscriptionPlan, DriverSubscription,
  RideRequest, RequestOffer, Penalty, Notification,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS, TRIP_STATUS, RIDE_REQUEST_STATUS } = require('../../config/constants');
const {
  startTrip, updateTrip, cancelTrip, cancelTripWithPenalty,
  replaceTripStops, abandonTrip, completeTrip,
} = require('../../Services/tripService');
const { submitOffer } = require('../../Services/rideRequestService');

const ADMIN_ID = 'a3000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a3000000-0000-4000-8000-000000000002';
const PASSENGER_ID = 'a3000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'a3000000-0000-4000-8000-000000000010';
let adminToken;
let driverToken;

function futureDeparture(hoursAhead = 24) {
  return new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString().replace('Z', '+03:00');
}

function tripPayload() {
  return {
    origin_city: 'Amman',
    destination_city: 'Irbid',
    departure_time: futureDeparture(24),
    type_of_trip: 'once',
    fare_per_seat: '20.00',
    seats: [
      { seat_number: 1, type: 'driver' },
      { seat_number: 2, type: 'available' },
      { seat_number: 3, type: 'available' },
      { seat_number: 4, type: 'unavailable' },
    ],
  };
}

async function cleanAll() {
  await RequestOffer.destroy({ where: {}, force: true });
  await RideRequest.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await Penalty.destroy({ where: {}, force: true });
  await Notification.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
}

async function seedDriver() {
  await User.bulkCreate([
    { id: ADMIN_ID, fullName: 'Admin', phone: '+962700003001', role: 'admin', passwordHash: 'x', isVerified: true },
    {
      id: DRIVER_ID, fullName: 'Gated Driver', phone: '+962780003002', countryCode: 'JO', role: 'driver',
      passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active',
    },
    {
      id: PASSENGER_ID, fullName: 'Passenger', phone: '+962780003003', countryCode: 'JO',
      role: 'passenger', passwordHash: 'x', isVerified: true,
    },
  ]);

  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'GTD-101',
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

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
}

async function publishTripViaApi() {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send(tripPayload());
  expect(res.status).toBe(201);
  return res.body.trip_id;
}

/** Admin temp stop: open suspension penalty through the moderation API. */
async function tempStopDriver() {
  return getAgent()
    .post('/api/admin/penalties')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      user_id: DRIVER_ID,
      type: 'suspension',
      reason: 'Temp stop',
      ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
}

beforeAll(async () => {
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

describe('temp-stopped driver (suspension penalty) — publish gate', () => {
  beforeEach(async () => {
    await cleanAll();
    await seedDriver();
  });

  it('can publish while active and cannot publish while temp-stopped', async () => {
    await publishTripViaApi();

    const stop = await tempStopDriver();
    expect(stop.status).toBe(200);
    const driver = await User.findByPk(DRIVER_ID);
    expect(driver.status).toBe('suspended');

    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(tripPayload());
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Suspended accounts cannot perform this action/i);
  });

  it('the temp stop cancels the driver\u2019s published trip (inventory block)', async () => {
    const tripId = await publishTripViaApi();
    await tempStopDriver();

    const trip = await Trip.findByPk(tripId);
    expect(trip.status).toBe(TRIP_STATUS.CANCELLED);
    expect(trip.isModerated).toBe(true);
  });

  it('keeps read access while temp-stopped (penalties list shows the state)', async () => {
    await tempStopDriver();

    const res = await getAgent()
      .get('/api/driver/penalties')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ type: 'suspension', enforcement_state: 'suspended' });
  });

  it('sends the ACCOUNT_SUSPENDED notification so the app can show the stopped state', async () => {
    await tempStopDriver();

    const notices = await Notification.findAll({
      where: { userId: DRIVER_ID, type: 'ACCOUNT_SUSPENDED' },
    });
    expect(notices).toHaveLength(1);
  });
});

describe('moderation gates in trip/offer services (defense in depth)', () => {
  beforeEach(async () => {
    await cleanAll();
    await seedDriver();
  });

  // Simulates the race window where the account is already suspended but the
  // inventory sweep has not (or could not) cancel the live trip yet — the
  // exact scenario the client hit between moderation steps.
  async function seedSuspendedDriverWithLiveTrip() {
    const tripId = await publishTripViaApi();
    await User.update({ status: 'suspended' }, { where: { id: DRIVER_ID } });
    await Trip.update({ status: TRIP_STATUS.PUBLISHED, isModerated: false }, { where: { id: tripId } });
    return tripId;
  }

  const gateError = { messageKey: 'SUSPENDED_ACCOUNTS_CANNOT_PERFORM_THIS_ACTION' };

  it('startTrip refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(startTrip(DRIVER_ID, tripId)).rejects.toMatchObject(gateError);
  });

  it('completeTrip refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(completeTrip(DRIVER_ID, tripId)).rejects.toMatchObject(gateError);
  });

  it('abandonTrip refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(abandonTrip(DRIVER_ID, tripId)).rejects.toMatchObject(gateError);
  });

  it('updateTrip refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(updateTrip(DRIVER_ID, tripId, { fare_per_seat: '30.00' })).rejects.toMatchObject(gateError);
  });

  it('replaceTripStops refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(replaceTripStops(DRIVER_ID, tripId, [])).rejects.toMatchObject(gateError);
  });

  it('cancelTrip refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(cancelTrip(DRIVER_ID, tripId)).rejects.toMatchObject(gateError);
  });

  it('cancelTripWithPenalty refuses a suspended driver', async () => {
    const tripId = await seedSuspendedDriverWithLiveTrip();
    await expect(
      cancelTripWithPenalty(DRIVER_ID, tripId, { reason: 'change of plans', note: null })
    ).rejects.toMatchObject(gateError);
  });

  it('submitOffer refuses a suspended driver', async () => {
    await User.update({ status: 'suspended' }, { where: { id: DRIVER_ID } });
    const request = await RideRequest.create({
      passengerId: PASSENGER_ID,
      originPlace: 'Dabouq',
      originCity: 'Amman',
      destinationPlace: 'University',
      destinationCity: 'Irbid',
      seatsNeeded: 1,
      status: RIDE_REQUEST_STATUS.OPEN,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });
    await expect(
      submitOffer(DRIVER_ID, request.id, { offered_fare: '10.00' })
    ).rejects.toMatchObject(gateError);
  });

  it('the system expiry sweep still abandons a suspended driver\u2019s stale trip', async () => {
    // Flow guard: the moderation gate must not block system lifecycle
    // close-out (tripExpiryService) — otherwise a stopped account whose
    // inventory sweep failed would keep live trips running forever.
    const { refreshStaleTrips } = require('../../Services/tripExpiryService');
    const tripId = await publishTripViaApi();
    await User.update({ status: 'suspended' }, { where: { id: DRIVER_ID } });
    await Trip.update(
      { status: TRIP_STATUS.IN_PROGRESS, startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { where: { id: tripId } }
    );

    const result = await refreshStaleTrips([tripId]);
    expect(result.abandoned).toContain(tripId);
    expect(result.errors).toHaveLength(0);
    const trip = await Trip.findByPk(tripId);
    expect(trip.status).toBe(TRIP_STATUS.ABANDONED);
  });
});
