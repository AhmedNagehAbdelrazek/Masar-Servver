const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, TripStop, Trip, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'e8000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e8000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e8000000-0000-4000-8000-000000000010';

let driverToken;
let passengerToken;
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
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Profit Driver', phone: '+962795559050',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Profit Passenger', phone: '+962795559051',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'PRF-101', color: 'White', seats: 4, isVerified: true,
  });
  const plan = await SubscriptionPlan.create({
    name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
    features: [], isFree: false, isActive: true,
  });
  await DriverSubscription.create({
    driverId: DRIVER_ID, planId: plan.id, planName: plan.name, planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut, planCost: plan.cost, balance: 100,
    paymentMethod: { name: 'Bank', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
    status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });

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

describe('trip total profit + seat availability history', () => {
  it('returns total_profit on trip creation (fare x sellable seats)', async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Zarqa',
        departure_time: `${getFutureDate(2)}T10:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '10.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(res.status).toBe(201);
    // 2 sellable seats x 10.00
    expect(res.body.total_profit).toBe(20);
  });

  it('exposes total_profit on trip detail and driver list', async () => {
    const detail = await getAgent()
      .get(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(detail.status).toBe(200);
    // 2 sellable seats x 15.00
    expect(detail.body.trip.total_profit).toBe(30);

    const list = await getAgent()
      .get('/api/trips/driver/my-trips')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(list.status).toBe(200);
    const row = list.body.trips.find((t) => t.trip_id === tripId);
    expect(row.total_profit).toBe(30);
  });

  it('marks driver-designated seats with was_available, kept after booking', async () => {
    const before = await getAgent()
      .get(`/api/trips/${tripId}/seats`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(before.status).toBe(200);
    const byNumber = Object.fromEntries(before.body.seats.map((s) => [s.seat_number, s]));
    expect(byNumber[2].was_available).toBe(true);
    expect(byNumber[3].was_available).toBe(true);
    expect(byNumber[1].was_available).toBe(false);
    expect(byNumber[4].was_available).toBe(false);

    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_numbers: [2] });
    const booked = await getAgent()
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '15.00' });
    expect(booked.status).toBe(201);

    const after = await getAgent()
      .get(`/api/trips/${tripId}/seats`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(after.status).toBe(200);
    const taken = after.body.seats.find((s) => s.seat_number === 2);
    expect(taken.seat_type).toBe('unavailable');
    expect(taken.was_available).toBe(true);
    expect(taken.is_available).toBe(false);
  });

  it('recomputes total_profit when the fare is updated', async () => {
    const res = await getAgent()
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ fare_per_seat: '20.00' });
    expect(res.status).toBe(200);
    // 2 sellable seats x 20.00
    expect(res.body.trip.total_profit).toBe(40);
  });
});
