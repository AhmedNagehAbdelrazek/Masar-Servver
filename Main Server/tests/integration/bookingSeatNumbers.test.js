const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, TripStop, Trip, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'f5000000-0000-4000-8000-000000000001';
const PASSENGER_A_ID = 'f5000000-0000-4000-8000-000000000002';
const PASSENGER_B_ID = 'f5000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'f5000000-0000-4000-8000-000000000010';

let driverToken;
let passengerAToken;
let passengerBToken;
let tripId;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_A_ID, PASSENGER_B_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'SeatNumbers Driver', phone: '+962795559030',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_A_ID, fullName: 'Passenger A', phone: '+962795559031',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_B_ID, fullName: 'Passenger B', phone: '+962795559032',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'MS-102', color: 'White', seats: 4, isVerified: true,
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
  passengerAToken = generateAccessToken({ id: PASSENGER_A_ID, role: 'passenger' });
  passengerBToken = generateAccessToken({ id: PASSENGER_B_ID, role: 'passenger' });

  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_date: getFutureDate(1),
      departure_time: '14:00',
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

async function seatType(n) {
  const row = await TripSeat.findOne({ where: { tripId, seatNumber: n } });
  return row.seatType;
}

describe('multi-seat lock + booking with seat_numbers', () => {
  it('locks, books and flips multiple seat rows; trip info reflects it', async () => {
    const lock = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ seat_numbers: [2, 3] });
    expect(lock.status).toBe(200);
    expect(lock.body.seat_numbers).toEqual([2, 3]);

    const booked = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ trip_id: tripId, seat_numbers: [2, 3], agreed_fare: '15.00' });
    expect(booked.status).toBe(201);
    expect(booked.body.booking.seat_numbers).toEqual([2, 3]);
    expect(booked.body.booking.seats_booked).toBe(2);
    // legacy single-seat field keeps the first seat for backward compat
    expect(booked.body.booking.seat_number).toBe(2);

    expect(await seatType(2)).toBe('unavailable');
    expect(await seatType(3)).toBe('unavailable');

    const trip = await Trip.findByPk(tripId);
    expect(trip.availableSeats).toBe(0);
    expect(trip.status).toBe('full');

    const seats = await getAgent()
      .get(`/api/trips/${tripId}/seats`)
      .set('Authorization', `Bearer ${passengerAToken}`);
    expect(seats.status).toBe(200);
    const byNumber = Object.fromEntries(seats.body.seats.map((s) => [s.seat_number, s]));
    expect(byNumber[2].is_available).toBe(false);
    expect(byNumber[3].is_available).toBe(false);
  });

  it('booking without seat_numbers does not touch seat rows (locks must be consumed explicitly)', async () => {
    const lock = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ seat_numbers: [2, 3] });
    expect(lock.status).toBe(200);

    const booked = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ trip_id: tripId, seats: 2, agreed_fare: '15.00' });
    expect(booked.status).toBe(201);
    expect(booked.body.booking.seat_numbers).toEqual([]);

    expect(await seatType(2)).toBe('available');
    expect(await seatType(3)).toBe('available');
  });

  it('rejects a bulk lock when any seat is held by someone else (all-or-nothing)', async () => {
    const first = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ seat_number: 2 });
    expect(first.status).toBe(200);

    const clash = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerBToken}`)
      .send({ seat_numbers: [2, 3] });
    expect(clash.status).toBe(409);

    // seat 3 must NOT be left half-locked for B — B can lock it alone
    const solo = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerBToken}`)
      .send({ seat_number: 3 });
    expect(solo.status).toBe(200);
  });

  it('rejects booking seats locked by nobody / held by someone else', async () => {
    const noLock = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ trip_id: tripId, seat_numbers: [2, 3], agreed_fare: '15.00' });
    expect(noLock.status).toBe(404);

    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ seat_number: 2 });

    const stolen = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerBToken}`)
      .send({ trip_id: tripId, seat_numbers: [2, 3], agreed_fare: '15.00' });
    expect(stolen.status).toBe(404);
  });

  it('rejects seats count mismatching seat_numbers and combining both seat fields', async () => {
    const mismatch = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ trip_id: tripId, seat_numbers: [2, 3], seats: 1, agreed_fare: '15.00' });
    expect(mismatch.status).toBe(422);

    const both = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ trip_id: tripId, seat_number: 2, seat_numbers: [2, 3], agreed_fare: '15.00' });
    expect(both.status).toBe(422);

    const lockBoth = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ seat_number: 2, seat_numbers: [2, 3] });
    expect(lockBoth.status).toBe(422);
  });

  it('cancel restores all seat rows, capacity and releases locks', async () => {
    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ seat_numbers: [2, 3] });
    const booked = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerAToken}`)
      .send({ trip_id: tripId, seat_numbers: [2, 3], agreed_fare: '15.00' });
    expect(booked.status).toBe(201);
    const bookingId = booked.body.booking.id;

    const cancelled = await getAgent()
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passengerAToken}`);
    expect(cancelled.status).toBe(200);

    expect(await seatType(2)).toBe('available');
    expect(await seatType(3)).toBe('available');
    const trip = await Trip.findByPk(tripId);
    expect(trip.availableSeats).toBe(2);

    // locks were consumed on booking and released on cancel — B can lock again
    const relock = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerBToken}`)
      .send({ seat_number: 2 });
    expect(relock.status).toBe(200);
  });
});
