const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { TRIP_STATUS, BOOKING_STATUS, SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';

let driverToken;
let passengerToken;

async function seed() {
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
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID, fullName: 'Contract Driver', phone: '+962798888888',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Contract Passenger', phone: '+962798888889',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'CTR-1001', color: 'White', seats: 4, isVerified: true,
  });

  await seed();

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

const VALID_TRIP_BODY = {
  origin_city: 'Amman',
  origin_area: 'Abdoun',
  origin_lat: '31.9500',
  origin_lng: '35.9100',
  destination_city: 'Irbid',
  destination_area: 'Downtown',
  destination_lat: '32.5500',
  destination_lng: '35.8500',
  departure_date: (() => { const d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().split('T')[0]; })(),
  departure_time: '14:00',
  type_of_trip: 'once',
  fare_per_seat: '15.50',
  seats: [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ],
  instructions: ['No smoking please'],
  additional_instructions: 'Bring water',
  waypoints: [{ stop_name: 'Khalda', stop_lat: '31.9600', stop_lng: '35.9000' }],
};

async function createTrip() {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send(VALID_TRIP_BODY);
  return res.body.trip_id;
}

describe('US1 Contract - Trip Edit/Cancel/Attributes', () => {
  it('PUT /api/trips/:trip_id returns raw trip envelope', async () => {
    const tripId = await createTrip();
    const res = await getAgent()
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ fare_per_seat: 9.0 });

    expect(res.status).toBe(200);
    expect(res.body.trip).toBeDefined();
    expect(res.body.trip.id).toBe(tripId);
    expect(res.body.trip.status).toBe(TRIP_STATUS.PUBLISHED);
    expect(res.body.trip.origin_city).toBe('Amman');
    expect(res.body.trip.destination_city).toBe('Irbid');
    expect(typeof res.body.trip.fare_per_seat).toBe('number');
    expect(Array.isArray(res.body.trip.attributes)).toBe(true);
    expect(res.body.trip.notified_passengers).toBeDefined();
  });

  it('PUT non-owner returns flat 403 envelope', async () => {
    const tripId = await createTrip();
    const res = await getAgent()
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ fare_per_seat: 1 });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(typeof res.body.message).toBe('string');
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('DELETE /api/trips/:trip_id returns cancelled trip envelope', async () => {
    const tripId = await createTrip();
    await Booking.create({
      tripId,
      passengerId: PASSENGER_ID,
      seatNumber: 2,
      seatsBooked: 1,
      agreedFare: 15.5,
      status: BOOKING_STATUS.CONFIRMED,
      referenceCode: 'MSR-CTR123',
    });

    const res = await getAgent()
      .delete(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip.id).toBe(tripId);
    expect(res.body.trip.status).toBe(TRIP_STATUS.CANCELLED);
    expect(res.body.trip.notified_passengers).toBe(1);
  });

  it('GET /api/trips/:trip_id/attributes returns attribute list envelope', async () => {
    const tripId = await createTrip();
    const res = await getAgent()
      .get(`/api/trips/${tripId}/attributes`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(tripId);
    expect(Array.isArray(res.body.attributes)).toBe(true);
  });

  it('422 returns details array per field', async () => {
    const tripId = await createTrip();
    const res = await getAgent()
      .put(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ gender_preference: 'nope' });

    expect(res.status).toBe(422);
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0].field).toBeDefined();
    expect(res.body.details[0].message).toBeDefined();
  });
});
