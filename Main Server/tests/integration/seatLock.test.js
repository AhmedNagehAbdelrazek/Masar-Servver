const { getAgent, getRedisStore } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_PHONE = '+962795555555';
const PASSENGER1_PHONE = '+962796666666';
const PASSENGER2_PHONE = '+962797777777';
const DRIVER_ID = '9906e4a0-e29b-41d4-80b4-00c04fd43001';
const PASSENGER1_ID = '9906e4a0-e29b-41d4-80b4-00c04fd43002';
const PASSENGER2_ID = '9906e4a0-e29b-41d4-80b4-00c04fd43003';
const VEHICLE_ID = '9906e4a0-e29b-41d4-80b4-00c04fd43010';

let driverToken;
let passenger1Token;
let passenger2Token;
let tripId;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

beforeEach(async () => {
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER1_PHONE, PASSENGER2_PHONE] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Lock Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER1_ID,
    fullName: 'Lock Passenger 1',
    phone: PASSENGER1_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER2_ID,
    fullName: 'Lock Passenger 2',
    phone: PASSENGER2_PHONE,
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
    plateNumber: 'LK-123',
    color: 'White',
    seats: 4,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
  passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });

  const futureDate = getFutureDate(1);
  const res = await getAgent()
    .post('/api/trips')
    .set('Authorization', `Bearer ${driverToken}`)
    .send({
      vehicle_id: VEHICLE_ID,
      origin_city: 'Amman',
      destination_city: 'Irbid',
      departure_date: futureDate,
      departure_time: '15:00',
      type_of_trip: 'once',
      fare_per_seat: '20.00',
      seats: [
        { seat_number: 1, type: 'driver' },
        { seat_number: 2, type: 'available' },
        { seat_number: 3, type: 'available' },
        { seat_number: 4, type: 'unavailable' },
      ],
    });

  tripId = res.body.trip_id;
});

describe('Seat Lock - Lock Seat', () => {
  describe('POST /api/trips/:trip_id/seats/lock', () => {
    it('should lock an available seat', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      expect(res.status).toBe(200);
      expect(res.body.lock_id).toBeDefined();
      expect(res.body.seat_number).toBe(2);
      expect(res.body.expires_in).toBe(300);
      expect(res.body.message).toMatch(/locked/i);
    });

    it('should prevent second passenger from locking same seat', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ seat_number: 2 });

      expect(res.status).toBe(409);
    });

    it('should allow same passenger to re-lock their seat', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      expect(res.status).toBe(200);
    });

    it('should allow locking different seats by different passengers', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send({ seat_number: 3 });

      expect(res.status).toBe(200);
      expect(res.body.seat_number).toBe(3);
    });

    it('should reject locking unavailable seat', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 4 });

      expect(res.status).toBe(422);
    });

    it('should reject locking driver seat', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 1 });

      expect(res.status).toBe(422);
    });

    it('should reject non-existent seat', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 99 });

      expect(res.status).toBe(404);
    });

    it('should reject without auth token', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .send({ seat_number: 2 });

      expect(res.status).toBe(401);
    });

    it('should reject with invalid trip_id', async () => {
      const fakeId = '9906e4a0-e29b-41d4-80b4-00c04fd43099';
      const res = await getAgent()
        .post(`/api/trips/${fakeId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      expect(res.status).toBe(404);
    });

    it('should reject with missing seat_number', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('should reject with invalid seat_number (0)', async () => {
      const res = await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 0 });

      expect(res.status).toBe(422);
    });

    it('should reject with invalid trip_id format', async () => {
      const res = await getAgent()
        .post('/api/trips/not-a-uuid/seats/lock')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      expect(res.status).toBe(422);
    });
  });
});

describe('Seat Lock - Release Seat', () => {
  describe('DELETE /api/trips/:trip_id/seats/lock/:seat_number', () => {
    it('should release a locked seat', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      const res = await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/2`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/released/i);
    });

    it('should prevent releasing lock held by another passenger', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      const res = await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/2`)
        .set('Authorization', `Bearer ${passenger2Token}`);

      expect(res.status).toBe(403);
    });

    it('should reject releasing an already released seat', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/2`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      const res = await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/2`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(404);
    });

    it('should reject releasing a seat that was never locked', async () => {
      const res = await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/2`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(404);
    });

    it('should reject without auth token', async () => {
      await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });

      const res = await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/2`);

      expect(res.status).toBe(401);
    });

    it('should reject with invalid trip_id', async () => {
      const fakeId = '9906e4a0-e29b-41d4-80b4-00c04fd43099';
      const res = await getAgent()
        .delete(`/api/trips/${fakeId}/seats/lock/2`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(404);
    });

    it('should reject with invalid seat_number', async () => {
      const res = await getAgent()
        .delete(`/api/trips/${tripId}/seats/lock/abc`)
        .set('Authorization', `Bearer ${passenger1Token}`);

      expect(res.status).toBe(422);
    });
  });
});
