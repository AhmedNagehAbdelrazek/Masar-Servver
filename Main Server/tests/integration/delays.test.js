const { getAgent } = require('../setup/setup');
const {
  User,
  Vehicle,
  Trip,
  Booking,
  DelayEvent,
  SubscriptionPlan,
  DriverSubscription,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const DRIVER_ID = 'f9000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'f9000000-0000-4000-8000-000000000002';
const OTHER_ID = 'f9000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'f9000000-0000-4000-8000-000000000010';

let driverToken;
let passengerToken;
let otherToken;
let bookingId;

beforeEach(async () => {
  await DelayEvent.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true }).catch(() => {});
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID, OTHER_ID] }, force: true });

  const users = [
    { id: DRIVER_ID, fullName: 'Delay Driver', phone: '+962795111101', role: 'driver' },
    { id: PASSENGER_ID, fullName: 'Delay Passenger', phone: '+962795111102', role: 'passenger' },
    { id: OTHER_ID, fullName: 'Delay Other', phone: '+962795111103', role: 'passenger' },
  ];
  for (const u of users) {
    await User.create({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      countryCode: 'JO',
      role: u.role,
      passwordHash: 'hashed',
      isVerified: true,
    });
  }

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });

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

  const vehicle = await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'DLY-1',
    color: 'White',
    seats: 4,
    isVerified: true,
  });
  const trip = await Trip.create({
    driverId: DRIVER_ID,
    vehicleId: vehicle.id,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    totalSeats: 3,
    availableSeats: 2,
    farePerSeat: 8,
    isRecurring: false,
    genderPreference: 'all',
    status: 'published',
  });
  const booking = await Booking.create({
    tripId: trip.id,
    passengerId: PASSENGER_ID,
    seatNumber: 2,
    seatsBooked: 1,
    agreedFare: 8,
    status: 'confirmed',
    paymentStatus: 'pending',
    referenceCode: 'MSR-DLY' + Math.random().toString(36).slice(2, 5).toUpperCase(),
  });
  bookingId = booking.id;
});

function reportDelay(token, overrides = {}) {
  return getAgent()
    .post(`/api/bookings/${bookingId}/delay`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      party: 'passenger',
      delay_minutes: 10,
      reason: 'Traffic',
      ...overrides,
    });
}

describe('US6 - reporting delays', () => {
  it('should let the passenger report their own delay', async () => {
    const res = await reportDelay(passengerToken);

    expect(res.status).toBe(201);
    expect(res.body.delay_event.party).toBe('passenger');
    expect(res.body.delay_event.delay_minutes).toBe(10);
    expect(res.body.delay_event.booking_id).toBe(bookingId);
  });

  it('should let the trip driver report a driver delay', async () => {
    const res = await reportDelay(driverToken, {
      party: 'driver',
      delay_minutes: 15,
      reason: 'Car issue',
    });

    expect(res.status).toBe(201);
    expect(res.body.delay_event.party).toBe('driver');
  });

  it('should forbid a passenger from reporting a driver delay', async () => {
    const res = await reportDelay(passengerToken, { party: 'driver' });
    expect(res.status).toBe(403);
  });

  it('should forbid the driver from reporting a passenger delay', async () => {
    const res = await reportDelay(driverToken, { party: 'passenger' });
    expect(res.status).toBe(403);
  });

  it('should reject users not part of the booking', async () => {
    const res = await reportDelay(otherToken);
    expect(res.status).toBe(403);
  });

  it('should validate delay_minutes bounds', async () => {
    const res = await reportDelay(passengerToken, { delay_minutes: 0 });
    expect(res.status).toBe(422);
  });

  it('should reject unknown parties', async () => {
    const res = await reportDelay(passengerToken, { party: 'alien' });
    expect(res.status).toBe(422);
  });
});

describe('US6 - listing delays', () => {
  beforeEach(async () => {
    await reportDelay(passengerToken, { delay_minutes: 10 });
    await reportDelay(driverToken, { party: 'driver', delay_minutes: 5 });
  });

  it('should list both events for involved parties', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/delays`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('should filter by party', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/delays?party=driver`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].party).toBe('driver');
  });

  it('should forbid outsiders from listing', async () => {
    const res = await getAgent()
      .get(`/api/bookings/${bookingId}/delays`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for unknown bookings', async () => {
    const fakeId = 'f9000000-0000-4000-8000-000000000099';
    const res = await getAgent()
      .get(`/api/bookings/${fakeId}/delays`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(404);
  });
});
