const { getAgent } = require('../setup/setup');
const {
  startSocketServer,
  stopSocketServer,
  connectSocket,
  connect,
  waitFor,
  emitWithAck,
} = require('../setup/socket');
const { User, Vehicle, Trip, TripSeat, TripStop, TripLocation, Booking, Notification, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const mapsClient = require('../../Services/mapsClient');
const trackingService = require('../../Services/trackingService');

const DRIVER_ID = 'f1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'f1300000-0000-4000-8000-000000000002';
const STRANGER_ID = 'f1300000-0000-4000-8000-000000000003';
const ADMIN_ID = 'f1300000-0000-4000-8000-000000000004';
const VEHICLE_ID = 'f1300000-0000-4000-8000-000000000010';

let driverToken;
let passengerToken;
let strangerToken;
let adminToken;
let tripId;
let bookingId;

// On-corridor points (mock Amman->Irbid segment)
const PICKUP_POINT = { lat: 32.25, lng: 35.8793 };

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

async function openSocket(token) {
  const s = connectSocket(token);
  await connect(s);
  return s;
}

beforeAll(async () => {
  await startSocketServer();
});

afterAll(async () => {
  await stopSocketServer();
});

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await TripLocation.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID, STRANGER_ID, ADMIN_ID] }, force: true });

  await User.create({ id: DRIVER_ID, fullName: 'Live Driver', phone: '+962799151111', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: PASSENGER_ID, fullName: 'Live Passenger', phone: '+962799152222', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: STRANGER_ID, fullName: 'Live Stranger', phone: '+962799153333', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: ADMIN_ID, fullName: 'Live Admin', phone: '+962799154444', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'LIV-1301', color: 'White', seats: 4, isVerified: true,
  });
  await seed();
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  strangerToken = generateAccessToken({ id: STRANGER_ID, role: 'passenger' });
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });

  const departureDate = (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })();
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman', origin_lat: 31.9539, origin_lng: 35.9106,
      destination_city: 'Irbid', destination_lat: 32.5568, destination_lng: 35.8469,
      departure_time: `${departureDate}T14:00:00+03:00`,
      type_of_trip: 'once', fare_per_seat: '15.50',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
    });
  tripId = res.body.trip_id;

  await getAgent().post(`/api/trips/${tripId}/seats/lock`).set('Authorization', `Bearer ${passengerToken}`).send({ seat_number: 2 });
  const booked = await getAgent().post('/api/bookings').set('Authorization', `Bearer ${passengerToken}`).send({
    trip_id: tripId, seat_numbers: [2], agreed_fare: '15.50',
    pickup: { name: 'Wasfi Al-Tal St', lat: PICKUP_POINT.lat, lng: PICKUP_POINT.lng },
  });
  bookingId = booked.body.booking.id;

  await Trip.update({ status: 'in_progress' }, { where: { id: tripId } });
});

afterEach(async () => {
  jest.restoreAllMocks();
});

describe('US2 Realtime - join auth and live ingest', () => {
  it('driver and booked passenger join; stranger and pre-start trips are refused', async () => {
    const driver = await openSocket(driverToken);
    const passenger = await openSocket(passengerToken);
    const stranger = await openSocket(strangerToken);
    try {
      expect(await emitWithAck(driver, 'tracking:join', { trip_id: tripId })).toMatchObject({ status: 'ok' });
      expect(await emitWithAck(passenger, 'tracking:join', { trip_id: tripId })).toMatchObject({ status: 'ok' });
      expect(await emitWithAck(stranger, 'tracking:join', { trip_id: tripId })).toMatchObject({ status: 'error' });

      await Trip.update({ status: 'published' }, { where: { id: tripId } });
      const driver2 = await openSocket(driverToken);
      try {
        expect(await emitWithAck(driver2, 'tracking:join', { trip_id: tripId })).toMatchObject({ status: 'error' });
      } finally {
        driver2.disconnect();
      }
    } finally {
      driver.disconnect();
      passenger.disconnect();
      stranger.disconnect();
    }
  });

  it('single location persists, broadcasts, and reaches the passenger with an ETA', async () => {
    const driver = await openSocket(driverToken);
    const passenger = await openSocket(passengerToken);
    try {
      await emitWithAck(driver, 'tracking:join', { trip_id: tripId });
      await emitWithAck(passenger, 'tracking:join', { trip_id: tripId });
      const personal = waitFor(passenger, 'tracking:update');
      const ack = await emitWithAck(driver, 'tracking:location', { trip_id: tripId, lat: 32.0, lng: 35.895, speed: 60 });
      expect(ack.status).toBe('ok');

      const row = await TripLocation.findOne({ where: { tripId } });
      expect(row).not.toBeNull();
      expect(Number(row.lat)).toBeCloseTo(32.0, 4);

      const update = await personal;
      expect(update.driver_lat).toBeCloseTo(32.0, 4);
      expect(update.eta_minutes).not.toBeNull();
    } finally {
      driver.disconnect();
      passenger.disconnect();
    }
  });

  it('batch ingest stores in-window points and rejects stale single sends', async () => {
    const driver = await openSocket(driverToken);
    try {
      await emitWithAck(driver, 'tracking:join', { trip_id: tripId });
      const fresh = new Date(Date.now() - 60 * 1000).toISOString();
      const ack = await emitWithAck(driver, 'tracking:location', {
        trip_id: tripId,
        points: [
          { lat: 32.0, lng: 35.895, speed: 60, recorded_at: fresh },
          { lat: 32.01, lng: 35.894, speed: 60, recorded_at: fresh },
        ],
      });
      expect(ack.status).toBe('ok');
      expect(ack.data.stored).toBe(2);

      // Stale single sends are discarded (service-level: socket throttle allows
      // only one location emit per test, so this goes direct).
      const driverUser = { id: DRIVER_ID, role: 'driver' };
      await expect(
        trackingService.updateLocation(driverUser, {
          tripId, lat: 32.0, lng: 35.895, speed: 60,
          recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        }),
      ).rejects.toMatchObject({ code: 'LOCATION_POINT_TOO_OLD' });
    } finally {
      driver.disconnect();
    }
  });

  it('proximity near+arrived fire once per booking with notifications', async () => {
    const driver = await openSocket(driverToken);
    const passenger = await openSocket(passengerToken);
    try {
      await emitWithAck(driver, 'tracking:join', { trip_id: tripId });
      await emitWithAck(passenger, 'tracking:join', { trip_id: tripId });
      const first = waitFor(passenger, 'tracking:proximity');
      await emitWithAck(driver, 'tracking:location', { trip_id: tripId, ...PICKUP_POINT, speed: 40 });
      const event = await first;
      expect(['near', 'arrived']).toContain(event.state);

      // Second sighting at the same spot: no duplicate (service-level, dodges socket throttle).
      const driverUser = { id: DRIVER_ID, role: 'driver' };
      await trackingService.updateLocation(driverUser, { tripId, ...PICKUP_POINT, speed: 40 });
      const notes = await Notification.findAll({ where: { userId: PASSENGER_ID } });
      const states = notes.map((n) => n.type);
      expect(states.filter((t) => t === 'DRIVER_NEARBY').length).toBeLessThanOrEqual(1);
      expect(states.filter((t) => t === 'DRIVER_ARRIVED').length).toBeLessThanOrEqual(1);
    } finally {
      driver.disconnect();
      passenger.disconnect();
    }
  });

  it('cancelled bookings and completed trips lose live access', async () => {
    const passenger = await openSocket(passengerToken);
    try {
      // Cancel the booking, then join must refuse even though the trip is live.
      const { Booking: BookingModel } = require('../../Models');
      const booking = await BookingModel.findOne({ where: { tripId } });
      await getAgent().put(`/api/bookings/${booking.id}/cancel`).set('Authorization', `Bearer ${passengerToken}`).send({});
      expect(await emitWithAck(passenger, 'tracking:join', { trip_id: tripId })).toMatchObject({ status: 'error' });

      // Completed trips refuse everyone, driver included.
      const { Trip: TripModel } = require('../../Models');
      await TripModel.update({ status: 'completed' }, { where: { id: tripId } });
      const driver = await openSocket(driverToken);
      try {
        expect(await emitWithAck(driver, 'tracking:join', { trip_id: tripId })).toMatchObject({ status: 'error' });
      } finally {
        driver.disconnect();
      }
    } finally {
      passenger.disconnect();
    }
  });

  it('live updates never call the route provider', async () => {
    const spy = jest.spyOn(mapsClient, 'computeRoutes');
    const driver = await openSocket(driverToken);
    try {
      await emitWithAck(driver, 'tracking:join', { trip_id: tripId });
      await emitWithAck(driver, 'tracking:location', { trip_id: tripId, lat: 32.0, lng: 35.895, speed: 60 });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      driver.disconnect();
    }
  });
});

describe('US2 Contract - route view and pickup status', () => {
  it('GET /api/trips/:id/route shows pickups first-name-only with nav links', async () => {
    const res = await getAgent().get(`/api/trips/${tripId}/route`).set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.polyline).toBeDefined();
    expect(res.body.navigation_url).toContain('google.com/maps/dir');
    expect(res.body.pickups).toHaveLength(1);
    expect(res.body.pickups[0]).toMatchObject({ first_name: 'Live', seats: 1 });
    expect(JSON.stringify(res.body.pickups)).not.toContain('799152222');

    const denied = await getAgent().get(`/api/trips/${tripId}/route`).set('Authorization', `Bearer ${strangerToken}`);
    expect(denied.status).toBe(403);

    const admin = await getAgent().get(`/api/trips/${tripId}/route`).set('Authorization', `Bearer ${adminToken}`);
    expect(admin.status).toBe(200);
  });

  it('PATCH pickup status transitions and advances next pickup', async () => {
    const arrived = await getAgent()
      .patch(`/api/trips/${tripId}/pickups/${bookingId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ pickup_status: 'arrived' });
    expect(arrived.status).toBe(200);
    expect(arrived.body.pickup_status).toBe('arrived');

    const picked = await getAgent()
      .patch(`/api/trips/${tripId}/pickups/${bookingId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ pickup_status: 'picked_up' });
    expect(picked.status).toBe(200);

    const row = await Booking.findByPk(bookingId);
    expect(row.pickupStatus).toBe('picked_up');
    expect(row.pickedUpAt).not.toBeNull();

    const bad = await getAgent()
      .patch(`/api/trips/${tripId}/pickups/${bookingId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ pickup_status: 'teleported' });
    expect(bad.status).toBe(422);
  });
});
