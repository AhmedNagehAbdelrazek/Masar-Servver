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

const DRIVER_ID = 'f5000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'f5000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'f5000000-0000-4000-8000-000000000010';

let driverToken;

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
    fullName: 'Contract Complete Driver',
    phone: '+962794002201',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID,
    fullName: 'Contract Complete Passenger',
    phone: '+962794002202',
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
    plateNumber: 'CMPL-C-1',
    color: 'Black',
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

describe('US3 Contract - POST /api/trips/:trip_id/complete finalizes bookings', () => {
  it('returns the completion envelope and persists booking completion', async () => {
    const trip = await Trip.create({
      driverId: DRIVER_ID,
      vehicleId: VEHICLE_ID,
      originCity: 'Amman',
      destinationCity: 'Irbid',
      departureTime: new Date(Date.now() - 15 * 60 * 1000),
      totalSeats: 2,
      availableSeats: 1,
      farePerSeat: 6.5,
      isRecurring: false,
      genderPreference: 'all',
      status: TRIP_STATUS.IN_PROGRESS,
    });
    await TripSeat.bulkCreate([
      { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
      { tripId: trip.id, seatNumber: 2, seatType: 'unavailable' },
    ]);
    const booking = await Booking.create({
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: 2,
      seatsBooked: 1,
      agreedFare: 6.5,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: 'pending',
      referenceCode: 'MSR-CTEST1',
    });

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(trip.id);
    expect(res.body).toHaveProperty('commission');
    expect(res.body).toHaveProperty('balance_after');
    expect(typeof res.body.is_in_debt).toBe('boolean');

    const updated = await Booking.findByPk(booking.id);
    expect(updated.status).toBe('completed');
    expect(updated.paymentStatus).toBe('paid_cash');
    expect(updated.completedAt).toBeTruthy();
  });

  it('rejects completion from a non-started trip', async () => {
    const trip = await Trip.create({
      driverId: DRIVER_ID,
      vehicleId: VEHICLE_ID,
      originCity: 'Amman',
      destinationCity: 'Irbid',
      departureTime: new Date(Date.now() + 60 * 60 * 1000),
      totalSeats: 2,
      availableSeats: 1,
      farePerSeat: 6.5,
      isRecurring: false,
      genderPreference: 'all',
      status: TRIP_STATUS.PUBLISHED,
    });
    await TripSeat.bulkCreate([{ tripId: trip.id, seatNumber: 1, seatType: 'driver' }]);

    const res = await getAgent()
      .post(`/api/trips/${trip.id}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(422);
  });
});
