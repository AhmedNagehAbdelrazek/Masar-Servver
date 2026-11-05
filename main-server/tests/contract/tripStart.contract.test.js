const { getAgent } = require('../setup/setup');
const {
  User,
  DriverProfile,
  Vehicle,
  Trip,
  TripSeat,
  Booking,
  Notification,
  SubscriptionPlan,
  DriverSubscription,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const {
  TRIP_STATUS,
  SUBSCRIPTION_STATUS,
} = require('../../config/constants');

const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440f11';
const DRIVER2_ID = '550e8400-e29b-41d4-a716-446655440f15';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440f12';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440f13';

let driverToken;
let driver2Token;

function future(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

async function seedTrip(departureTime, { status = TRIP_STATUS.PUBLISHED } = {}) {
  const trip = await Trip.create({
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime,
    totalSeats: 4,
    availableSeats: 2,
    farePerSeat: 5,
    isRecurring: false,
    genderPreference: 'all',
    status,
  });
  await TripSeat.bulkCreate([
    { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
    { tripId: trip.id, seatNumber: 2, seatType: 'available' },
  ]);
  return trip;
}

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await DriverProfile.destroy({ where: { driverId: [DRIVER_ID, DRIVER2_ID] }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, DRIVER2_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Start Driver',
    phone: '+962710000311',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID,
    fullName: 'Start Passenger',
    phone: '+962710000312',
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: DRIVER2_ID,
    fullName: 'Other Driver',
    phone: '+962710000313',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await DriverProfile.create({ driverId: DRIVER_ID });
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'STRT-CON-1',
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

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  driver2Token = generateAccessToken({ id: DRIVER2_ID, role: 'driver' });
});

describe('Contract: POST /api/trips/:trip_id/start', () => {
  it('returns 200 with trip_id/status/message/tracking_link shape', async () => {
    const trip = await seedTrip(future(30));

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(trip.id);
    expect(res.body.status).toBe('in_progress');
    expect(typeof res.body.message).toBe('string');
    expect(typeof res.body.tracking_link).toBe('string');
    expect(res.body.tracking_link).toBe(`wss://api.masar.app/socket.io?trip=${trip.id}`);
  });

  it('returns 400 TOO_EARLY_TO_START when departure is more than one hour away', async () => {
    const trip = await seedTrip(future(120));

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOO_EARLY_TO_START');
  });

  it('returns 422 INVALID_TRIP_STATUS when the trip has already started', async () => {
    const trip = await seedTrip(future(30), { status: TRIP_STATUS.IN_PROGRESS });

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRIP_STATUS');
  });

  it('returns 401 without auth token', async () => {
    const trip = await seedTrip(future(30));

    const res = await getAgent().post(`/api/trips/${trip.id}/start`);
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-owner driver', async () => {
    const trip = await seedTrip(future(30));

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/start`)
      .set('Authorization', `Bearer ${driver2Token}`);

    expect(res.status).toBe(403);
  });
});
