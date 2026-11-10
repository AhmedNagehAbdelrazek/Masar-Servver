const bcrypt = require('bcrypt');
const { getAgent, getRedisStore } = require('../setup/setup');
const { User, Vehicle, Trip, Booking, Rating, Message, Notification } = require('../../Models');
const {
  DEV_DRIVER_PHONE,
  DEV_PASSENGER_PHONE,
  DEV_ACCOUNT_PASSWORD,
} = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const { seedDevAccounts } = require('../../seed');

const ADMIN_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const DRIVER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae8';
const PASSENGER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae9';
const OTHER_ID = '7c9e6679-7425-40de-944b-e07fc1f90aea';
const VEHICLE_ID = '7c9e6679-7425-40de-944b-e07fc1f90aeb';
const TRIP_ID = '7c9e6679-7425-40de-944b-e07fc1f90aec';
const BOOKING_ID = '7c9e6679-7425-40de-944b-e07fc1f90aed';
const RATING_ID = '7c9e6679-7425-40de-944b-e07fc1f90aee';
const MESSAGE_ID = '7c9e6679-7425-40de-944b-e07fc1f90aef';
const NOTIFICATION_ID = '7c9e6679-7425-40de-944b-e07fc1f90af0';

let adminToken;
let otherToken;

async function cleanup() {
  await Rating.destroy({ where: { id: RATING_ID }, force: true });
  await Message.destroy({ where: { id: MESSAGE_ID }, force: true });
  await Notification.destroy({ where: { id: NOTIFICATION_ID }, force: true });
  await Booking.destroy({ where: { id: BOOKING_ID }, force: true });
  await Trip.destroy({ where: { id: TRIP_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({
    where: { id: [ADMIN_ID, DRIVER_ID, PASSENGER_ID, OTHER_ID] },
    force: true,
  });
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEV_ACCOUNT_PASSWORD, 4);

  await User.create({
    id: ADMIN_ID,
    fullName: 'Admin',
    phone: '+962799900001',
    countryCode: 'JO',
    role: 'admin',
    passwordHash,
    isVerified: true,
  });
  await User.create({
    id: DRIVER_ID,
    fullName: 'Developer Driver',
    phone: DEV_DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash,
    isVerified: true,
    verificationStatus: 'approved',
    status: 'active',
  });
  await User.create({
    id: PASSENGER_ID,
    fullName: 'Developer Passenger',
    phone: DEV_PASSENGER_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash,
    isVerified: true,
    status: 'active',
  });
  await User.create({
    id: OTHER_ID,
    fullName: 'Regular Passenger',
    phone: '+962799900002',
    countryCode: 'JO',
    role: 'passenger',
    passwordHash,
    isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Corolla',
    vehicleType: 'sedan',
    modelYear: 2024,
    plateNumber: 'DEV-0001',
    seats: 4,
    isVerified: true,
  });
  await Trip.create({
    id: TRIP_ID,
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    totalSeats: 4,
    availableSeats: 3,
    farePerSeat: 10,
    status: 'published',
  });
  await Booking.create({
    id: BOOKING_ID,
    tripId: TRIP_ID,
    passengerId: OTHER_ID,
    seatsBooked: 1,
    agreedFare: 10,
    referenceCode: 'DEVBOOK001',
    status: 'confirmed',
    paymentStatus: 'pending',
  });
  await Rating.create({
    id: RATING_ID,
    bookingId: BOOKING_ID,
    raterId: OTHER_ID,
    rateeId: DRIVER_ID,
    stars: 5,
  });
  await Message.create({
    id: MESSAGE_ID,
    senderId: DRIVER_ID,
    receiverId: OTHER_ID,
    bookingId: BOOKING_ID,
    message: 'See you at the pickup point.',
    messageType: 'text',
    isRead: false,
  });
  await Notification.create({
    id: NOTIFICATION_ID,
    userId: DRIVER_ID,
    type: 'TRIP_REMINDER',
    title: 'Trip reminder',
    body: 'Your trip departs soon.',
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });
}

beforeEach(async () => {
  await cleanup();
  await seed();
});

describe('Developer accounts', () => {
  it('seeds one driver and one passenger with a verified vehicle', async () => {
    await seedDevAccounts();

    const driver = await User.findOne({ where: { phone: DEV_DRIVER_PHONE } });
    const passenger = await User.findOne({ where: { phone: DEV_PASSENGER_PHONE } });
    expect(driver).not.toBeNull();
    expect(driver.role).toBe('driver');
    expect(passenger).not.toBeNull();
    expect(passenger.role).toBe('passenger');

    const vehicle = await Vehicle.findOne({ where: { driverId: driver.id } });
    expect(vehicle).not.toBeNull();
    expect(vehicle.isVerified).toBe(true);
  });

  it('uses the fixed OTP for both developer phones', async () => {
    for (const phone of [DEV_DRIVER_PHONE, DEV_PASSENGER_PHONE]) {
      const sent = await getAgent()
        .post('/api/auth/forgot-password')
        .send({ phone });
      expect(sent.status).toBe(200);

      expect(getRedisStore().get(`otp_reset:${phone}`)).toBe('000000');

      const verified = await getAgent()
        .post('/api/auth/forgot-password/verify-otp')
        .send({ phone, otp: '000000' });
      expect(verified.status).toBe(200);
      expect(verified.body.reset_token).toBeDefined();
    }
  });

  it('logs in with the known password for both roles', async () => {
    const driverLogin = await getAgent()
      .post('/api/auth/login')
      .send({ phone: DEV_DRIVER_PHONE, password: DEV_ACCOUNT_PASSWORD, role: 'driver' });
    expect(driverLogin.status).toBe(200);
    expect(driverLogin.body.user.role).toBe('driver');

    const passengerLogin = await getAgent()
      .post('/api/auth/login')
      .send({
        phone: DEV_PASSENGER_PHONE,
        password: DEV_ACCOUNT_PASSWORD,
        role: 'passenger',
      });
    expect(passengerLogin.status).toBe(200);
    expect(passengerLogin.body.user.role).toBe('passenger');
  });

  it('lets an admin permanently delete a developer driver and all history', async () => {
    const res = await getAgent()
      .delete(`/api/admin/users/${DRIVER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
    expect(res.body.user).toMatchObject({ id: DRIVER_ID, phone: DEV_DRIVER_PHONE });
    expect(res.body.deleted_records.users).toBe(1);
    expect(res.body.deleted_records.trips).toBe(1);
    expect(res.body.deleted_records.bookings).toBe(1);
    expect(res.body.deleted_records.vehicles).toBe(1);

    expect(await User.findByPk(DRIVER_ID)).toBeNull();
    expect(await Vehicle.findByPk(VEHICLE_ID)).toBeNull();
    expect(await Trip.findByPk(TRIP_ID)).toBeNull();
    expect(await Booking.findByPk(BOOKING_ID)).toBeNull();
    expect(await Rating.findByPk(RATING_ID)).toBeNull();
    expect(await Message.findByPk(MESSAGE_ID)).toBeNull();
    expect(await Notification.findByPk(NOTIFICATION_ID)).toBeNull();

    // The regular passenger is not part of the developer account and remains.
    expect(await User.findByPk(OTHER_ID)).not.toBeNull();
  });

  it('rejects deletion of a non-developer account', async () => {
    const res = await getAgent()
      .delete(`/api/admin/users/${OTHER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('NOT_A_DEVELOPER_ACCOUNT');
    expect(await User.findByPk(OTHER_ID)).not.toBeNull();
  });

  it('rejects deletion by a non-admin caller', async () => {
    const res = await getAgent()
      .delete(`/api/admin/users/${PASSENGER_ID}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    expect(await User.findByPk(PASSENGER_ID)).not.toBeNull();
  });

  it('rejects deletion of a missing user', async () => {
    const res = await getAgent()
      .delete('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
