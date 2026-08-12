const { getAgent } = require('../setup/setup');
const {
  User,
  Vehicle,
  Trip,
  TripSeat,
  TripStop,
  Booking,
  SubscriptionPlan,
  DriverSubscription,
  PaymentMethod,
  UploadedImage,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const {
  TRIP_STATUS,
  SUBSCRIPTION_STATUS,
  BOOKING_STATUS,
} = require('../../config/constants');

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440e01';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440e02';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440e03';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440e10';

let adminToken;
let driverToken;
let method;
let screenshot;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function getStartableDeparture() {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

const VALID_BODY = {
  origin_city: 'Amman',
  destination_city: 'Irbid',
  departure_date: getStartableDeparture().date,
  departure_time: getStartableDeparture().time,
  type_of_trip: 'once',
  fare_per_seat: '15.00',
  seats: [
    { seat_number: 1, type: 'driver' },
    { seat_number: 2, type: 'available' },
    { seat_number: 3, type: 'available' },
    { seat_number: 4, type: 'unavailable' },
  ],
};

async function createPlan(name, percentageCut, cost) {
  return SubscriptionPlan.create({
    name,
    periodDays: 30,
    percentageCut,
    cost,
    features: [],
    isFree: false,
    isActive: true,
  });
}

async function activatePlan(driverId, plan, balance) {
  const sub = await DriverSubscription.create({
    driverId,
    planId: plan.id,
    planName: plan.name,
    planPeriodDays: plan.periodDays,
    planPercentageCut: plan.percentageCut,
    planCost: plan.cost,
    balance,
    paymentMethod: { name: method.name, account_number: method.accountNumber, type: method.type },
    status: SUBSCRIPTION_STATUS.ACTIVE,
    approvedAt: new Date(),
    activatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return sub;
}

async function syncTotal(driverId) {
  const subs = await DriverSubscription.findAll({ where: { driverId, status: SUBSCRIPTION_STATUS.ACTIVE } });
  const total = subs.reduce((s, x) => s + Number(x.balance), 0);
  await User.update(
    { totalBalance: total, isInDebt: total < 0 },
    { where: { id: driverId } }
  );
  return total;
}

async function createTrip() {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send(VALID_BODY);
  return res.body;
}

async function addBooking(tripId, passengerId, agreedFare, seatNumber) {
  return Booking.create({
    tripId,
    passengerId,
    seatNumber,
    seatsBooked: 1,
    agreedFare,
    referenceCode: `R${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    status: BOOKING_STATUS.CONFIRMED,
  });
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await UploadedImage.destroy({ where: {}, force: true });
  await PaymentMethod.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: {}, force: true });

  await User.create({ id: ADMIN_ID, fullName: 'Admin', phone: '+962710000301', countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: DRIVER_ID, fullName: 'Commission Driver', phone: '+962710000302', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: PASSENGER_ID, fullName: 'Passenger', phone: '+962710000303', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'INT-COM-1',
    color: 'White',
    seats: 4,
    isVerified: true,
  });
  method = await PaymentMethod.create({
    name: 'Bank of Jordan',
    accountNumber: 'JO94BOJX0000000000',
    type: 'bank_account',
    email: 'payments@boj.com',
    isActive: true,
  });
  screenshot = await UploadedImage.create({
    hash: 'commission-screenshot-hash',
    url: 'https://res.cloudinary.com/x/screenshot.jpg',
    filename: 'commission-screenshot.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

describe('US3 - Trip gating at publish', () => {
  it('rejects publishing with NO_ACTIVE_PLAN', async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_BODY);

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('NO_ACTIVE_PLAN');
  });

  it('rejects publishing with INSUFFICIENT_BALANCE and states required/current', async () => {
    await activatePlan(DRIVER_ID, await createPlan('Basic', 10, 100), 0.5);
    await syncTotal(DRIVER_ID);

    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_BODY);

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
    expect(res.body.message).toMatch(/1\.50/);
    expect(res.body.message).toMatch(/0\.50/);
  });

  it('allows publishing when balance covers one-seat commission', async () => {
    await activatePlan(DRIVER_ID, await createPlan('Basic', 8, 100), 100);
    await syncTotal(DRIVER_ID);

    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(TRIP_STATUS.PUBLISHED);
  });
});

describe('US3 - Trip gating at start', () => {
  it('blocks start when balance drops below minimum and sends INSUFFICIENT_BALANCE', async () => {
    const plan = await createPlan('Basic', 10, 100);
    const sub = await activatePlan(DRIVER_ID, plan, 100);
    await syncTotal(DRIVER_ID);
    const trip = await createTrip();

    await DriverSubscription.update({ balance: 0.1 }, { where: { id: sub.id } });
    await User.update({ totalBalance: 0.1, isInDebt: false }, { where: { id: DRIVER_ID } });

    const res = await getAgent()
      .post(`/api/trips/${trip.trip_id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');

    const dbTrip = await Trip.findByPk(trip.trip_id);
    expect(dbTrip.status).toBe(TRIP_STATUS.PUBLISHED);
  });

  it('starts a trip with sufficient balance', async () => {
    await activatePlan(DRIVER_ID, await createPlan('Basic', 8, 100), 100);
    await syncTotal(DRIVER_ID);
    const trip = await createTrip();

    const res = await getAgent()
      .post(`/api/trips/${trip.trip_id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(TRIP_STATUS.IN_PROGRESS);
  });
});

describe('US3 - Commission deduction at completion', () => {
  it('deducts FIFO across active plans at the current plan rate', async () => {
    const planA = await createPlan('Plan A', 10, 100);
    const planB = await createPlan('Plan B', 20, 100);
    const subA = await activatePlan(DRIVER_ID, planA, 30);
    const subB = await activatePlan(DRIVER_ID, planB, 100);
    await syncTotal(DRIVER_ID);

    const trip = await createTrip();
    await getAgent()
      .post(`/api/trips/${trip.trip_id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    await addBooking(trip.trip_id, PASSENGER_ID, 250, 2);
    await addBooking(trip.trip_id, PASSENGER_ID, 250, 3);

    const res = await getAgent()
      .post(`/api/trips/${trip.trip_id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    // current plan = Plan A (FIFO) → rate 10% → commission 500 × 10% = 50
    expect(res.status).toBe(200);
    expect(res.body.commission).toBe(50);
    expect(res.body.plan_name).toBe('Plan A');
    expect(res.body.balance_after).toBe(80);
    expect(res.body.is_in_debt).toBe(false);

    const a = await DriverSubscription.findByPk(subA.id);
    const b = await DriverSubscription.findByPk(subB.id);
    expect(Number(a.balance)).toBe(0);
    expect(Number(b.balance)).toBe(80);

    const user = await User.findByPk(DRIVER_ID);
    expect(Number(user.totalBalance)).toBe(80);

    const dbTrip = await Trip.findByPk(trip.trip_id);
    expect(dbTrip.status).toBe(TRIP_STATUS.COMPLETED);
  });

  it('creates debt when commission exceeds balance and blocks all trips', async () => {
    const plan = await createPlan('Basic', 10, 100);
    await activatePlan(DRIVER_ID, plan, 10);
    await syncTotal(DRIVER_ID);

    const trip1 = await createTrip();
    const trip2 = await createTrip();
    await getAgent()
      .post(`/api/trips/${trip1.trip_id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    await addBooking(trip1.trip_id, PASSENGER_ID, 300, 2);

    const res = await getAgent()
      .post(`/api/trips/${trip1.trip_id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.commission).toBe(30);
    expect(res.body.is_in_debt).toBe(true);

    const user = await User.findByPk(DRIVER_ID);
    expect(Number(user.totalBalance)).toBe(-20);
    expect(user.isInDebt).toBe(true);

    const t1 = await Trip.findByPk(trip1.trip_id);
    const t2 = await Trip.findByPk(trip2.trip_id);
    expect(t1.isBlockedByBalance).toBe(true);
    expect(t2.isBlockedByBalance).toBe(true);

    const blockedRes = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(VALID_BODY);
    expect(blockedRes.status).toBe(422);
    expect(blockedRes.body.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('unblocks trips when a new approval clears the debt', async () => {
    const plan = await createPlan('Basic', 10, 100);
    await activatePlan(DRIVER_ID, plan, 10);
    await syncTotal(DRIVER_ID);

    const completed = await createTrip();
    const stillPublished = await createTrip();
    await getAgent()
      .post(`/api/trips/${completed.trip_id}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    await addBooking(completed.trip_id, PASSENGER_ID, 300, 2);
    await getAgent()
      .post(`/api/trips/${completed.trip_id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    const user = await User.findByPk(DRIVER_ID);
    expect(user.isInDebt).toBe(true);
    expect((await Trip.findByPk(stillPublished.trip_id)).isBlockedByBalance).toBe(true);

    const newPlan = await createPlan('Renewal', 8, 200);
    const submit = await getAgent()
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plan_id: newPlan.id, payment_method_id: method.id, screenshot_id: screenshot.id });
    expect(submit.status).toBe(201);

    const approve = await getAgent()
      .post(`/api/admin/subscriptions/${submit.body.subscription_id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);

    const after = await User.findByPk(DRIVER_ID);
    expect(Number(after.totalBalance)).toBe(180);
    expect(after.isInDebt).toBe(false);

    const dbTrip = await Trip.findByPk(stillPublished.trip_id);
    expect(dbTrip.isBlockedByBalance).toBe(false);
  });
});
