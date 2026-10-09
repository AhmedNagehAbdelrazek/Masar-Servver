const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, TripLocation, Booking, Notification, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'a1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'a1300000-0000-4000-8000-000000000002';
const ADMIN_ID = 'a1300000-0000-4000-8000-000000000004';
const VEHICLE_ID = 'a1300000-0000-4000-8000-000000000010';

let driverToken;
let passengerToken;
let adminToken;
let tripId;
let bookingId;

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
  await Notification.destroy({ where: {}, force: true });
  await TripLocation.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID, ADMIN_ID] }, force: true });

  await User.create({ id: DRIVER_ID, fullName: 'History Driver', phone: '+962799161111', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: PASSENGER_ID, fullName: 'History Passenger', phone: '+962799162222', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: ADMIN_ID, fullName: 'History Admin', phone: '+962799164444', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'HST-1301', color: 'White', seats: 4, isVerified: true,
  });
  await seed();
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
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
    pickup: { name: 'Wasfi Al-Tal St', lat: 32.25, lng: 35.8793 },
  });
  bookingId = booked.body.booking.id;
});

describe('US3 Contract - history, pickup edit, admin views', () => {
  it('GET /api/bookings/:id/route shows planned route plus only my pickup', async () => {
    const res = await getAgent().get(`/api/bookings/${bookingId}/route`).set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.polyline).toBeDefined();
    expect(res.body.my_pickup).toMatchObject({ label: 'Wasfi Al-Tal St' });
    expect(res.body.pickups).toBeUndefined();
  });

  it('PATCH /api/bookings/:id/pickup edits before cutoff and rejects after', async () => {
    const ok = await getAgent()
      .patch(`/api/bookings/${bookingId}/pickup`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 32.3, lng: 35.875 });
    expect(ok.status).toBe(200);

    // Push departure inside the cutoff window: edits now refuse.
    await Trip.update({ departureTime: new Date(Date.now() + 30 * 60 * 1000) }, { where: { id: tripId } });
    const late = await getAgent()
      .patch(`/api/bookings/${bookingId}/pickup`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ lat: 32.3, lng: 35.875 });
    expect(late.status).toBe(422);
    expect(late.body.code).toBe('PICKUP_EDIT_CUTOFF_PASSED');
  });

  it('admin planned view works; recorded view needs completion', async () => {
    const planned = await getAgent().get(`/api/admin/trips/${tripId}/route`).set('Authorization', `Bearer ${adminToken}`);
    expect(planned.status).toBe(200);
    expect(planned.body.polyline).toBeDefined();

    const early = await getAgent().get(`/api/admin/trips/${tripId}/route/actual`).set('Authorization', `Bearer ${adminToken}`);
    expect(early.status).toBe(403);

    await Trip.update({ status: 'completed' }, { where: { id: tripId } });
    const actual = await getAgent().get(`/api/admin/trips/${tripId}/route/actual`).set('Authorization', `Bearer ${adminToken}`);
    expect(actual.status).toBe(200);
  });

  it('driver recorded view returns the compacted path after completion', async () => {
    await TripLocation.bulkCreate([
      { tripId, driverId: DRIVER_ID, lat: 31.96, lng: 35.91 },
      { tripId, driverId: DRIVER_ID, lat: 32.2, lng: 35.88 },
      { tripId, driverId: DRIVER_ID, lat: 32.55, lng: 35.847 },
    ]);
    const routeService = require('../../Services/routeService');
    await routeService.compactActualPath(tripId);
    await Trip.update({ status: 'completed' }, { where: { id: tripId } });

    const res = await getAgent().get(`/api/trips/${tripId}/route/actual`).set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.actual_path_polyline).toBe('string');
  });
});
