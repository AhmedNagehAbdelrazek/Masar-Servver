const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, Booking, RideRequest, Penalty, Notification } = require('../../Models');
const { TRIP_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
const TRIP_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';

let adminToken;
let driverToken;
let passengerToken;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

beforeEach(async () => {
  await Notification.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await RideRequest.destroy({ where: {}, force: true });
  await Penalty.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: { id: [ADMIN_ID, DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: ADMIN_ID, fullName: 'Admin', phone: '+962790000001',
    countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: DRIVER_ID, fullName: 'Omar Khaled', phone: '+962798800001',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    verificationStatus: 'approved', avgRating: 4.8,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Sara Ali', phone: '+962798800002',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
    vehicleType: 'sedan', modelYear: 2022, plateNumber: '12-34567', color: 'White', seats: 4, isVerified: true,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

async function seedTrip(status = TRIP_STATUS.PUBLISHED) {
  return Trip.create({
    id: TRIP_ID,
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: new Date(`${todayStr()}T12:00:00Z`),
    totalSeats: 4,
    availableSeats: 3,
    farePerSeat: 10,
    status,
  });
}

let bookingSequence = 0;

async function seedBooking(status = 'confirmed') {
  bookingSequence += 1;
  return Booking.create({
    tripId: TRIP_ID,
    passengerId: PASSENGER_ID,
    seatNumber: 2,
    seatNumbers: [2],
    seatsBooked: 1,
    agreedFare: 10,
    referenceCode: `MODBK${String(bookingSequence).padStart(4, '0')}`,
    status,
  });
}

describe('GET /api/admin/users', () => {
  it('should filter users by role and status with pagination', async () => {
    await User.update({ status: 'suspended' }, { where: { id: DRIVER_ID } });

    const res = await getAgent()
      .get('/api/admin/users?role=driver&status=suspended')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      id: DRIVER_ID,
      full_name: 'Omar Khaled',
      phone: '+96279***0001',
      role: 'driver',
      status: 'suspended',
      avg_rating: 4.8,
    });
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.pagination.total_pages).toBe(1);
  });

  it('should reject non-admin access', async () => {
    const res = await getAgent()
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/admin/users/:user_id', () => {
  it('should update user status and record actor', async () => {
    const res = await getAgent()
      .put(`/api/admin/users/${DRIVER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'suspended', reason: 'No-show rate above threshold' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: DRIVER_ID,
      status: 'suspended',
      updated_by: ADMIN_ID,
    });

    const persisted = await User.findByPk(DRIVER_ID);
    expect(persisted.status).toBe('suspended');
  });

  it('should return 422 for an invalid status', async () => {
    const res = await getAgent()
      .put(`/api/admin/users/${DRIVER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ghost' });

    expect(res.status).toBe(422);
  });

  it('should return 404 for a nonexistent user', async () => {
    const res = await getAgent()
      .put('/api/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/admin/trips/:trip_id', () => {
  it('should block a trip and hide it from passenger search', async () => {
    await seedTrip();

    const res = await getAgent()
      .put(`/api/admin/trips/${TRIP_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'block', reason: 'Duplicate listing' });

    expect(res.status).toBe(200);
    expect(res.body.trip).toMatchObject({
      id: TRIP_ID,
      status: 'cancelled',
      moderated: true,
    });

    const searchRes = await getAgent()
      .get(`/api/trips/search/available?origin_city=Amman&destination_city=Irbid&date=${todayStr()}`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.trips).toHaveLength(0);
  });

  it('should restore a blocked trip', async () => {
    await seedTrip(TRIP_STATUS.CANCELLED);
    await Trip.update({ isModerated: true }, { where: { id: TRIP_ID } });

    const res = await getAgent()
      .put(`/api/admin/trips/${TRIP_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'restore' });

    expect(res.status).toBe(200);
    expect(res.body.trip).toMatchObject({
      id: TRIP_ID,
      status: 'published',
      moderated: false,
    });
  });

  it('should return 422 for an invalid action', async () => {
    await seedTrip();

    const res = await getAgent()
      .put(`/api/admin/trips/${TRIP_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'explode' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/admin/penalties', () => {
  it('should issue a suspension and sync user status', async () => {
    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'suspension',
        reason: 'Two no-show incidents',
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.penalty).toMatchObject({
      user_id: DRIVER_ID,
      type: 'suspension',
      reason: 'Two no-show incidents',
      issued_by: ADMIN_ID,
    });
    expect(res.body.penalty.ends_at).toBeDefined();

    const user = await User.findByPk(DRIVER_ID);
    expect(user.status).toBe('suspended');
  });

  it('should cancel the driver trips and bookings when suspended', async () => {
    await seedTrip();
    await seedBooking();

    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'suspension',
        reason: 'Repeated no-shows',
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.inventory).toMatchObject({ trips_cancelled: 1, bookings_cancelled: 1 });

    const trip = await Trip.findByPk(TRIP_ID);
    expect(trip.status).toBe(TRIP_STATUS.CANCELLED);
    const booking = await Booking.findOne({ where: { passengerId: PASSENGER_ID } });
    expect(booking.status).toBe('cancelled');

    const driverNotice = await Notification.findOne({
      where: { userId: DRIVER_ID, type: 'ACCOUNT_SUSPENDED' },
    });
    expect(driverNotice).not.toBeNull();
    const passengerNotice = await Notification.findOne({
      where: { userId: PASSENGER_ID, type: 'TRIP_CANCELLED' },
    });
    expect(passengerNotice).not.toBeNull();
  });

  it('should cancel the passenger bookings when banned', async () => {
    await seedTrip();
    await seedBooking();

    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: PASSENGER_ID,
        type: 'ban',
        reason: 'Fraud',
        confirm_reviewed_log: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.inventory).toMatchObject({ bookings_cancelled: 1 });

    const booking = await Booking.findOne({ where: { passengerId: PASSENGER_ID } });
    expect(booking.status).toBe('cancelled');
    const trip = await Trip.findByPk(TRIP_ID);
    expect(trip.status).toBe(TRIP_STATUS.PUBLISHED);
    expect(trip.availableSeats).toBe(4);

    const passengerNotice = await Notification.findOne({
      where: { userId: PASSENGER_ID, type: 'ACCOUNT_BANNED' },
    });
    expect(passengerNotice).not.toBeNull();
    const driverNotice = await Notification.findOne({
      where: { userId: DRIVER_ID, type: 'BOOKING_CANCELLED_DRIVER' },
    });
    expect(driverNotice).not.toBeNull();
  });

  it.each(['suspended', 'banned'])('a warning never downgrades a %s account', async (status) => {
    await User.update({ status }, { where: { id: DRIVER_ID } });

    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'warning',
        reason: 'Late responses',
      });

    expect(res.status).toBe(200);
    const user = await User.findByPk(DRIVER_ID);
    expect(user.status).toBe(status);
    expect(await Penalty.count({ where: { userId: DRIVER_ID, type: 'warning' } })).toBe(1);
  });

  it('should require the reviewed-log confirmation for a ban', async () => {
    const denied = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: DRIVER_ID, type: 'ban', reason: 'Repeated fraud' });
    expect(denied.status).toBe(422);

    const ok = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'ban',
        reason: 'Repeated fraud',
        confirm_reviewed_log: true,
      });
    expect(ok.status).toBe(200);
    expect(ok.body.penalty).toMatchObject({ type: 'ban' });
    const user = await User.findByPk(DRIVER_ID);
    expect(user.status).toBe('banned');
  });

  it('reactivation closes the open ban record', async () => {
    await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'ban',
        reason: 'Repeated fraud',
        confirm_reviewed_log: true,
      });

    const lift = await getAgent()
      .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'unblock' });

    expect(lift.status).toBe(200);
    expect(lift.body.driver.account_status).toBe('active');
    const openBan = await Penalty.findOne({
      where: { userId: DRIVER_ID, type: 'ban', endsAt: null },
    });
    expect(openBan).toBeNull();
  });

  it('should issue a ban and forbid ends_at', async () => {
    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'ban',
        reason: 'Repeated fraud',
        ends_at: '2026-08-08T00:00:00Z',
      });

    expect(res.status).toBe(422);
  });

  it('should require ends_at for a suspension', async () => {
    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'suspension',
        reason: 'Two no-show incidents',
      });

    expect(res.status).toBe(422);
  });

  it('should return 422 for an invalid penalty type', async () => {
    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: DRIVER_ID,
        type: 'exile',
        reason: 'Whatever',
      });

    expect(res.status).toBe(422);
  });

  it('should return 404 when the target user does not exist', async () => {
    const res = await getAgent()
      .post('/api/admin/penalties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'warning',
        reason: 'Late responses',
      });

    expect(res.status).toBe(404);
  });
});
