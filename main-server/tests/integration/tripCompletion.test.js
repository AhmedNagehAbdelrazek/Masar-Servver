const { getAgent } = require('../setup/setup');
const {
  User,
  Vehicle,
  Trip,
  TripSeat,
  Booking,
  SubscriptionPlan,
  DriverSubscription,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const {
  TRIP_STATUS,
  SUBSCRIPTION_STATUS,
  BOOKING_STATUS,
} = require('../../config/constants');

const DRIVER_ID = 'f4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'f4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'f4000000-0000-4000-8000-000000000010';

let driverToken;

function future(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

async function makeRef() {
  return 'MSR-T' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true });
  await SubscriptionPlan.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Completion Driver',
    phone: '+962794001101',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID,
    fullName: 'Completion Passenger',
    phone: '+962794001102',
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'CMPL-1',
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
});

async function seedInProgressTrip() {
  const trip = await Trip.create({
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: future(-10),
    totalSeats: 3,
    availableSeats: 2,
    farePerSeat: 5,
    isRecurring: false,
    genderPreference: 'all',
    status: TRIP_STATUS.IN_PROGRESS,
  });
  await TripSeat.bulkCreate([
    { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
    { tripId: trip.id, seatNumber: 2, seatType: 'unavailable' },
    { tripId: trip.id, seatNumber: 3, seatType: 'available' },
  ]);
  return trip;
}

describe('US3 - trip completion finalizes bookings', () => {
  it('should mark confirmed bookings completed, paid_cash, with completed_at', async () => {
    const trip = await seedInProgressTrip();
    const booking = await Booking.create({
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: 2,
      seatsBooked: 1,
      agreedFare: 5,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: 'pending',
      referenceCode: await makeRef(),
    });

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);

    const updated = await Booking.findByPk(booking.id);
    expect(updated.status).toBe('completed');
    expect(updated.paymentStatus).toBe('paid_cash');
    expect(updated.completedAt).toBeTruthy();
  });

  it('should leave already-cancelled bookings untouched', async () => {
    const trip = await seedInProgressTrip();
    const cancelled = await Booking.create({
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: 3,
      seatsBooked: 1,
      agreedFare: 5,
      status: BOOKING_STATUS.CANCELLED,
      paymentStatus: null,
      cancellationReason: 'cancelled_by_passenger',
      cancelledAt: new Date(),
      referenceCode: await makeRef(),
    });

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);

    const updated = await Booking.findByPk(cancelled.id);
    expect(updated.status).toBe('cancelled');
    expect(updated.completedAt).toBeFalsy();
  });

  it('should finalize offer-based bookings without a seat number too', async () => {
    const trip = await seedInProgressTrip();
    await Booking.create({
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: null,
      seatsBooked: 2,
      agreedFare: 22,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: 'pending',
      referenceCode: await makeRef(),
    });

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    const booking = await Booking.findOne({ where: { tripId: trip.id } });
    expect(booking.status).toBe('completed');
    expect(booking.paymentStatus).toBe('paid_cash');
  });

  it('should reject completing an already completed trip', async () => {
    const trip = await seedInProgressTrip();
    await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INVALID_TRIP_STATUS');
  });
});
