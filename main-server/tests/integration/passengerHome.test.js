const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, TripStop, TripAttribute, Trip, Booking, RecentSearch, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'f8000000-0000-4000-8000-000000000001';
const PASSENGER1_ID = 'f8000000-0000-4000-8000-000000000002';
const PASSENGER2_ID = 'f8000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'f8000000-0000-4000-8000-000000000010';

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
  await RecentSearch.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripAttribute.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER1_ID, PASSENGER2_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Home Driver', phone: '+962795559060',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    avgRating: 4.7, avatarUrl: 'http://example.com/d.png',
  });
  await User.create({
    id: PASSENGER1_ID, fullName: 'Home Passenger 1', phone: '+962795559061',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    avatarUrl: 'http://example.com/p.png',
  });
  await User.create({
    id: PASSENGER2_ID, fullName: 'Home Passenger 2', phone: '+962795559062',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'HOM-101', color: 'White', seats: 4, isVerified: true,
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

async function makeBooking(token) {
  await getAgent()
    .post(`/api/trips/${tripId}/seats/lock`)
    .set('Authorization', `Bearer ${token}`)
    .send({ seat_number: 2 });
  return getAgent()
    .post('/api/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '15.00' });
}

describe('US7 - passenger home', () => {
  it('returns empty sections for a passenger with no activity', async () => {
    const res = await getAgent()
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger.id).toBe(PASSENGER2_ID);
    expect(res.body.next_booking).toBeNull();
    expect(res.body.last_searched_trips).toEqual([]);
    expect(res.body.last_trips).toEqual([]);
  });

  it('returns passenger, next_booking, last_searched and last_trips', async () => {
    await RecentSearch.create({
      passengerId: PASSENGER1_ID, originCity: 'Amman', destinationCity: 'Zarqa', searchedOn: getFutureDate(0),
    });
    const created = await makeBooking(passenger1Token);
    const bookingId = created.body.booking.id;

    const res = await getAgent()
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger).toMatchObject({
      id: PASSENGER1_ID,
      full_name: 'Home Passenger 1',
      profile_picture_url: 'http://example.com/p.png',
    });
    expect(res.body.next_booking).toMatchObject({
      booking_id: bookingId,
      status: 'confirmed',
    });
    expect(res.body.next_booking.trip.origin.city).toBe('Amman');
    expect(res.body.next_booking.driver.full_name).toBe('Home Driver');
    expect(res.body.next_booking.vehicle).toMatchObject({ type: 'sedan', plate: 'HOM-101' });
    expect(res.body.last_searched_trips[0]).toMatchObject({
      origin_city: 'Amman',
      destination_city: 'Zarqa',
    });
    // upcoming booking is not yet an ended trip
    expect(res.body.last_trips).toEqual([]);
  });

  it('includes all next-trip details (locations, stops, route and pickup)', async () => {
    const created = await makeBooking(passenger1Token);
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
        arrivalTime: new Date(Date.now() + 25 * 3600 * 1000),
        genderPreference: 'all',
        driverInstructions: ['no smoking'],
        additionalInstructions: 'Be on time',
        routePolyline: 'encoded-polyline',
        routeDistanceM: 80000,
        routeDurationS: 5400,
        routeStatus: 'ready',
        routeVersion: 2,
        routeComputedAt: new Date(),
      },
      { where: { id: tripId } },
    );
    await TripStop.bulkCreate([
      { tripId, stopOrder: 1, stopName: 'Sweileh', city: 'Amman', lat: 31.96, lng: 35.88, stopType: 'pickup' },
    ]);
    await TripAttribute.bulkCreate([
      { tripId, attrKey: 'wifi', attrValue: 'true' },
    ]);
    await Booking.update(
      {
        pickupType: 'custom',
        pickupPlace: 'Sweileh circle',
        pickupLabel: 'Sweileh',
        pickupCity: 'Amman',
        pickupArea: 'Sweileh',
        pickupLat: 31.96,
        pickupLng: 35.88,
        pickupOrder: 1,
        pickupStatus: 'pending',
        detourSeconds: 90,
      },
      { where: { id: bookingId } },
    );

    const res = await getAgent()
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    const next = res.body.next_booking;
    expect(next.booking_id).toBe(bookingId);
    expect(next.seat_numbers).toEqual([2]);
    expect(next.pickup).toMatchObject({
      type: 'custom',
      place: 'Sweileh circle',
      label: 'Sweileh',
      city: 'Amman',
      area: 'Sweileh',
      lat: 31.96,
      lng: 35.88,
      order: 1,
      status: 'pending',
      detour_seconds: 90,
    });
    expect(next.created_at).toBeTruthy();
    expect(next.driver).toMatchObject({
      id: DRIVER_ID,
      full_name: 'Home Driver',
      phone: '+962795559060',
    });
    expect(next.vehicle).toMatchObject({
      vehicle_id: VEHICLE_ID,
      type: 'sedan',
      make_model: 'Toyota Camry',
      year: 2023,
      plate: 'HOM-101',
      color: 'White',
      seats: 4,
      total_seats: 4,
    });
    expect(next.trip.origin).toMatchObject({
      city: 'Amman',
      area: 'Abdoun',
      address: '13 Abdoun St',
    });
    expect(next.trip.destination).toMatchObject({
      city: 'Irbid',
      area: 'Downtown',
      address: '1 University St',
    });
    expect(next.trip.arrival_time).toBeTruthy();
    expect(next.trip.fare_per_seat).toBe(15);
    expect(next.trip.currency).toBe('JOD');
    expect(next.trip.total_seats).toBe(4);
    expect(next.trip.status).toBe('published');
    expect(next.trip.is_recurring).toBe(false);
    expect(next.trip.gender_preference).toBe('all');
    expect(next.trip.attributes).toEqual([{ key: 'wifi', value: true }]);
    expect(next.trip.stops).toHaveLength(1);
    expect(next.trip.stops[0]).toMatchObject({
      stop_order: 1,
      stop_name: 'Sweileh',
      city: 'Amman',
      lat: 31.96,
      lng: 35.88,
      stop_type: 'pickup',
    });
    expect(next.trip.waypoints[0]).toEqual({ stop_name: 'Sweileh', stop_lat: 31.96, stop_lng: 35.88 });
    expect(next.trip.instructions).toEqual(['no smoking']);
    expect(next.trip.additional_instructions).toBe('Be on time');
    expect(next.trip.created_at).toBeTruthy();
    expect(next.trip.route).toMatchObject({
      status: 'ready',
      version: 2,
      polyline: 'encoded-polyline',
      distance_m: 80000,
      duration_s: 5400,
    });
  });

  it('moves a booking to last_trips with full trip details once the trip departs', async () => {
    const created = await makeBooking(passenger1Token);
    const bookingId = created.body.booking.id;

    await Trip.update(
      {
        departureTime: new Date(Date.now() - 60 * 60 * 1000),
        originArea: 'Abdoun',
        originAddress: '13 Abdoun St',
        destinationArea: 'Downtown',
        destinationAddress: '1 University St',
        status: 'completed',
        driverInstructions: ['no smoking'],
        additionalInstructions: 'Be on time',
        routePolyline: 'encoded-polyline',
        routeDistanceM: 80000,
        routeDurationS: 5400,
        routeStatus: 'ready',
        routeVersion: 3,
      },
      { where: { id: tripId } }
    );
    await TripStop.create({
      tripId, stopOrder: 1, stopName: 'Sweileh', city: 'Amman',
      lat: 31.96, lng: 35.88, stopType: 'pickup',
    });
    await TripAttribute.create({ tripId, attrKey: 'wifi', attrValue: 'true' });
    await Booking.update(
      { status: 'completed', paymentStatus: 'paid_cash' },
      { where: { id: bookingId } }
    );

    const res = await getAgent()
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passenger1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.next_booking).toBeNull();
    expect(res.body.last_trips.length).toBe(1);
    const last = res.body.last_trips[0];
    expect(last.booking_id).toBe(bookingId);
    expect(last.trip_cost).toBe(15);
    expect(last.currency).toBe('JOD');
    expect(last.reference_code).toMatch(/^MSR-/);
    expect(last.payment_status).toBe('paid_cash');
    expect(last.seat_numbers).toEqual([2]);
    expect(last.trip.origin).toMatchObject({ city: 'Amman', area: 'Abdoun', address: '13 Abdoun St' });
    expect(last.trip.destination).toMatchObject({
      city: 'Irbid', area: 'Downtown', address: '1 University St',
    });
    expect(last.trip.fare_per_seat).toBe(15);
    expect(last.trip.total_seats).toBe(4);
    expect(last.trip.available_seats).toBe(1);
    expect(last.trip.status).toBe('completed');
    expect(last.trip.attributes).toEqual([{ key: 'wifi', value: true }]);
    expect(last.trip.stops).toHaveLength(1);
    expect(last.trip.waypoints[0]).toEqual({
      stop_name: 'Sweileh', stop_lat: 31.96, stop_lng: 35.88,
    });
    expect(last.trip.instructions).toEqual(['no smoking']);
    expect(last.trip.additional_instructions).toBe('Be on time');
    expect(last.trip.route).toMatchObject({
      status: 'ready', version: 3, polyline: 'encoded-polyline',
      distance_m: 80000, duration_s: 5400,
    });
    expect(last.driver).toMatchObject({ id: DRIVER_ID, full_name: 'Home Driver' });
    expect(last.vehicle).toMatchObject({
      vehicle_id: VEHICLE_ID, type: 'sedan', make_model: 'Toyota Camry', plate: 'HOM-101',
    });
  });
});
