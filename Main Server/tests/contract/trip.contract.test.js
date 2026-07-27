const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, TripStop } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';

let driverToken;
let passengerToken;

function getFutureDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

beforeEach(async () => {
  await TripSeat.destroy({ where: {}, force: true });
  await TripStop.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Contract Driver',
    phone: '+962798888888',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Contract Passenger',
    phone: '+962798888889',
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
    plateNumber: 'CTR-123',
    color: 'White',
    seats: 4,
    isVerified: true,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

describe('Contract: POST /api/trips', () => {
  it('should return 201 with correct response shape', async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });

    expect(res.status).toBe(201);
    expect(typeof res.body.trip_id).toBe('string');
    expect(res.body.trip_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(res.body.status).toBe('published');
    expect(typeof res.body.total_seats).toBe('number');
    expect(typeof res.body.available_seats).toBe('number');
    expect(typeof res.body.estimated_earnings).toBe('number');
    expect(typeof res.body.message).toBe('string');
  });

  it('should return 422 with error shape on validation failure', async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});

    expect(res.status).toBe(422);
  });
});

describe('Contract: GET /api/trips/:trip_id', () => {
  let tripId;

  beforeEach(async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
        waypoints: [{ stop_name: 'Khalda' }],
      });
    tripId = res.body.trip_id;
  });

  it('should return 200 with trip details shape', async () => {
    const res = await getAgent()
      .get(`/api/trips/${tripId}`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.originCity).toBeDefined();
    expect(res.body.destinationCity).toBeDefined();
    expect(Array.isArray(res.body.seats)).toBe(true);
    expect(Array.isArray(res.body.stops)).toBe(true);

    if (res.body.seats.length > 0) {
      const seat = res.body.seats[0];
      expect(typeof seat.seatNumber).toBe('number');
      expect(typeof seat.seatType).toBe('string');
    }

    if (res.body.stops.length > 0) {
      const stop = res.body.stops[0];
      expect(typeof stop.stopOrder).toBe('number');
    }
  });

  it('should return 404 with error shape', async () => {
    const res = await getAgent()
      .get('/api/trips/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d99')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(404);
  });
});

describe('Contract: GET /api/trips/driver/my-trips', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
  });

  it('should return 200 with trips array shape', async () => {
    const res = await getAgent()
      .get('/api/trips/driver/my-trips')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toBeDefined();
    expect(Array.isArray(res.body.trips)).toBe(true);

    if (res.body.trips.length > 0) {
      const trip = res.body.trips[0];
      expect(typeof trip.id).toBe('string');
      expect(trip.originCity).toBeDefined();
      expect(trip.destinationCity).toBeDefined();
      expect(trip.status).toBeDefined();
    }
  });
});

describe('Contract: GET /api/trips/search/available', () => {
  beforeEach(async () => {
    await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
  });

  it('should return 200 with trips array shape', async () => {
    const res = await getAgent()
      .get('/api/trips/search/available')
      .query({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        date: getFutureDate(1),
      })
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toBeDefined();
    expect(Array.isArray(res.body.trips)).toBe(true);

    if (res.body.trips.length > 0) {
      const trip = res.body.trips[0];
      expect(typeof trip.id).toBe('string');
      expect(trip.originCity).toBeDefined();
      expect(trip.destinationCity).toBeDefined();
      expect(Array.isArray(trip.seats)).toBe(true);
      trip.seats.forEach(s => {
        expect(s.seatType).toBe('available');
      });
    }
  });
});

describe('Contract: GET /api/driver/dashboard', () => {
  it('should return 200 with dashboard shape', async () => {
    const res = await getAgent()
      .get('/api/driver/dashboard')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);

    expect(res.body.account).toBeDefined();
    expect(typeof res.body.account.driver_id).toBe('string');
    expect(typeof res.body.account.full_name).toBe('string');
    expect(typeof res.body.account.phone).toBe('string');
    expect(typeof res.body.account.rating).toBe('number');
    expect(typeof res.body.account.total_trips_completed).toBe('number');
    expect(typeof res.body.account.verified).toBe('boolean');

    expect(res.body.schedule).toBeDefined();
    expect(Array.isArray(res.body.schedule.today)).toBe(true);
    expect(Array.isArray(res.body.schedule.upcoming)).toBe(true);

    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary.today_trips_count).toBe('number');
    expect(typeof res.body.summary.total_completed_trips).toBe('number');
    expect(typeof res.body.summary.monthly_earnings).toBe('number');
    expect(typeof res.body.summary.avg_passenger_rating).toBe('number');

    expect(res.body.reservation_history).toBeDefined();
    expect(Array.isArray(res.body.reservation_history.recent)).toBe(true);
    expect(res.body.reservation_history.pagination).toBeDefined();
    expect(typeof res.body.reservation_history.pagination.total).toBe('number');
    expect(typeof res.body.reservation_history.pagination.page).toBe('number');
    expect(typeof res.body.reservation_history.pagination.limit).toBe('number');
  });
});

describe('Contract: POST /api/trips/:trip_id/seats/lock', () => {
  let tripId;

  beforeEach(async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    tripId = res.body.trip_id;
  });

  it('should return 200 with lock shape', async () => {
    const res = await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });

    expect(res.status).toBe(200);
    expect(typeof res.body.lock_id).toBe('string');
    expect(res.body.lock_id).toContain(':');
    expect(typeof res.body.seat_number).toBe('number');
    expect(res.body.seat_number).toBe(2);
    expect(typeof res.body.expires_in).toBe('number');
    expect(res.body.expires_in).toBe(300);
    expect(typeof res.body.message).toBe('string');
  });
});

describe('Contract: DELETE /api/trips/:trip_id/seats/lock/:seat_number', () => {
  let tripId;

  beforeEach(async () => {
    const res = await getAgent()
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    tripId = res.body.trip_id;

    await getAgent()
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
  });

  it('should return 200 with release shape', async () => {
    const res = await getAgent()
      .delete(`/api/trips/${tripId}/seats/lock/2`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message).toMatch(/released/i);
  });
});
