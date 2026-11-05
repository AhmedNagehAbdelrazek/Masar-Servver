const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, Trip, TripStop, TripAttribute, Booking, Rating, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'f5000000-0000-4000-8000-000000000001';
const PASSENGER1_ID = 'f5000000-0000-4000-8000-000000000002';
const PASSENGER2_ID = 'f5000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'f5000000-0000-4000-8000-000000000010';

let driverToken;
let passenger1Token;
let passenger2Token;
let tripId;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

beforeEach(async () => {
  await Rating.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER1_ID, PASSENGER2_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'List Driver', phone: '+962795559030',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    avatarUrl: 'http://example.com/driver.png',
  });
  await User.create({
    id: PASSENGER1_ID, fullName: 'List Passenger 1', phone: '+962795559031',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER2_ID, fullName: 'List Passenger 2', phone: '+962795559032',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'LST-101', color: 'White', seats: 4, isVerified: true,
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
  passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
  passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });

  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${getFutureDate(1)}T14:00:00+03:00`,
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

async function createBooking(token) {
  await getAgent()
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${token}`)
    .send({ seat_number: 2 });
  return getAgent()
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '15.00' });
}

describe('US4 - enriched passenger booking list', () => {
  it('returns enriched rows with vehicle and driver image', async () => {
    await createBooking(passenger1Token);

    const res = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    const row = res.body.data[0];
    expect(row.vehicle).toMatchObject({ type: 'sedan', plate: 'LST-101', seats: 4 });
    expect(row.vehicle.vehicle_id).toBeDefined();
    expect(row.driver.full_name).toBe('List Driver');
    expect(typeof row.driver.image).toBe('string');
    expect(row.passenger_rating).toBeNull();
  });

  it('exposes passenger_rating when the passenger rated the driver', async () => {
    const created = await createBooking(passenger1Token);
    const bookingId = created.body.booking.id;
    await Rating.create({
      bookingId, raterId: PASSENGER1_ID, rateeId: DRIVER_ID, stars: 5,
    });

    const res = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].passenger_rating).toBe(5);
  });

  it('filters by status', async () => {
    await createBooking(passenger1Token);

    const res = await getAgent()
      .get('/api/bookings?status=completed')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('does not leak other passengers bookings', async () => {
    await createBooking(passenger1Token);

    const res = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('list and detail include full trip, driver and vehicle details', async () => {
    const created = await createBooking(passenger1Token);
    const bookingId = created.body.booking.id;

    await Trip.update(
      {
        originArea: 'Abdoun',
        originAddress: '13 Abdoun St',
        originLat: 31.95,
        originLng: 35.87,
        destinationArea: 'Downtown',
        destinationAddress: '1 University St',
        destinationLat: 32.55,
        destinationLng: 35.85,
        driverInstructions: ['no smoking'],
        additionalInstructions: 'Be on time',
        routePolyline: 'encoded-polyline',
        routeDistanceM: 80000,
        routeDurationS: 5400,
        routeStatus: 'ready',
        routeVersion: 4,
      },
      { where: { id: tripId } }
    );
    await TripStop.create({
      tripId, stopOrder: 1, stopName: 'Sweileh', city: 'Amman',
      lat: 31.96, lng: 35.88, stopType: 'pickup',
    });
    await TripAttribute.create({ tripId, attrKey: 'wifi', attrValue: 'true' });

    const list = await getAgent()
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(list.status).toBe(200);
    const row = list.body.data[0];
    expect(row.trip.origin).toMatchObject({
      city: 'Amman', area: 'Abdoun', address: '13 Abdoun St',
    });
    expect(row.trip.destination).toMatchObject({
      city: 'Irbid', area: 'Downtown', address: '1 University St',
    });
    expect(row.trip.fare_per_seat).toBe(15);
    expect(row.trip.total_seats).toBe(4);
    expect(row.trip.available_seats).toBe(1);
    expect(row.trip.attributes).toEqual([{ key: 'wifi', value: true }]);
    expect(row.trip.stops).toHaveLength(1);
    expect(row.trip.waypoints[0]).toEqual({
      stop_name: 'Sweileh', stop_lat: 31.96, stop_lng: 35.88,
    });
    expect(row.trip.instructions).toEqual(['no smoking']);
    expect(row.trip.additional_instructions).toBe('Be on time');
    expect(row.trip.route).toMatchObject({
      status: 'ready', version: 4, polyline: 'encoded-polyline',
      distance_m: 80000, duration_s: 5400,
    });
    expect(row.vehicle.make_model).toBe('Toyota Camry');
    expect(row.vehicle.color).toBe('White');

    const res = await getAgent()
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.vehicle).toMatchObject({
      type: 'sedan', make_model: 'Toyota Camry', year: 2023,
      plate: 'LST-101', color: 'White', seats: 4, total_seats: 4,
    });
    expect(res.body.booking.trip.origin).toMatchObject({
      city: 'Amman', area: 'Abdoun', address: '13 Abdoun St',
    });
    expect(res.body.booking.trip.route).toMatchObject({ status: 'ready', version: 4 });
    // Legacy aliases still present for existing clients.
    expect(res.body.booking.trip.price).toBe(15);
    expect(res.body.booking.trip.route_points).toHaveLength(1);
    expect(res.body.booking.trip.meeting_point).toMatchObject({ stop_name: 'Sweileh' });
  });
});
