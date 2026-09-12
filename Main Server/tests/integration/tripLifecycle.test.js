const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, Booking, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { BOOKING_STATUS, SUBSCRIPTION_STATUS, TRIP_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const { runTripLifecycle } = require('../../jobs/tripLifecycleJob');

const DRIVER_ID = 'e4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'e4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'e4000000-0000-4000-8000-000000000010';

let driverToken;
let refCounter = 0;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

async function createTripViaApi(extra = {}) {
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_time: `${getFutureDate(1)}T10:00:00+03:00`,
      type_of_trip: 'once',
      fare_per_seat: '15.00',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
      ...extra,
    });
  expect(res.status).toBe(201);
  return res.body.trip_id;
}

async function addConfirmedBooking(tripId) {
  refCounter += 1;
  const suffix = `${Date.now().toString(36)}${refCounter}`.slice(-8);
  return Booking.create({
    tripId,
    passengerId: PASSENGER_ID,
    seatNumber: null,
    seatsBooked: 1,
    agreedFare: '15.00',
    status: BOOKING_STATUS.CONFIRMED,
    referenceCode: `MSR-${suffix}`,
  });
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: PASSENGER_ID, fullName: 'Lifecycle Passenger', phone: '+962795559020',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: DRIVER_ID, fullName: 'Lifecycle Driver', phone: '+962795559021',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'LIFECYCLE1', color: 'White', seats: 4, isVerified: true,
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
});

describe('tripLifecycleJob - stale trip close-out', () => {
  it('auto-completes started trips past their end (with bookings)', async () => {
    const tripId = await createTripViaApi();
    const booking = await addConfirmedBooking(tripId);
    await Trip.update(
      { departureTime: hoursAgo(5), status: TRIP_STATUS.IN_PROGRESS },
      { where: { id: tripId } }
    );

    const result = await runTripLifecycle();

    expect(result.autoCompleted).toContain(tripId);
    expect(result.errors).toEqual([]);

    const trip = await Trip.findByPk(tripId);
    expect(trip.status).toBe(TRIP_STATUS.COMPLETED);

    const updated = await Booking.findByPk(booking.id);
    expect(updated.status).toBe(BOOKING_STATUS.COMPLETED);
    expect(updated.completedAt).not.toBeNull();
  });

  it('expires never-operated trips as cancelled with NO_SHOW bookings', async () => {
    const tripId = await createTripViaApi();
    const booking = await addConfirmedBooking(tripId);
    await Trip.update({ departureTime: hoursAgo(5) }, { where: { id: tripId } });

    const result = await runTripLifecycle();

    expect(result.expiredUnoperated).toContain(tripId);
    expect(result.noShowBookings).toBe(1);
    expect(result.errors).toEqual([]);

    const trip = await Trip.findByPk(tripId);
    expect(trip.status).toBe(TRIP_STATUS.CANCELLED);

    const updated = await Booking.findByPk(booking.id);
    expect(updated.status).toBe(BOOKING_STATUS.NO_SHOW);
  });

  it('leaves future trips and just-departed trips untouched', async () => {
    const futureId = await createTripViaApi();
    const futureBooking = await addConfirmedBooking(futureId);

    const recentId = await createTripViaApi({ departure_time: `${getFutureDate(1)}T13:00:00+03:00` });
    const recentBooking = await addConfirmedBooking(recentId);
    await Trip.update({ departureTime: hoursAgo(1) }, { where: { id: recentId } });

    const result = await runTripLifecycle();

    expect(result.autoCompleted).toEqual([]);
    expect(result.expiredUnoperated).toEqual([]);

    expect((await Trip.findByPk(futureId)).status).toBe(TRIP_STATUS.PUBLISHED);
    expect((await Trip.findByPk(recentId)).status).toBe(TRIP_STATUS.PUBLISHED);
    expect((await Booking.findByPk(futureBooking.id)).status).toBe(BOOKING_STATUS.CONFIRMED);
    expect((await Booking.findByPk(recentBooking.id)).status).toBe(BOOKING_STATUS.CONFIRMED);
  });

  it('tolerates being invoked with a scheduler context argument', async () => {
    // node-cron invokes tasks as taskFn(context) — the job must not mistake
    // that context object for a Date (regression: now.getTime is not a function).
    await expect(runTripLifecycle({ date: new Date() })).resolves.toMatchObject({ errors: [] });
    await expect(runTripLifecycle(new Date())).resolves.toMatchObject({ errors: [] });
    await expect(runTripLifecycle()).resolves.toMatchObject({ errors: [] });
  });
});
