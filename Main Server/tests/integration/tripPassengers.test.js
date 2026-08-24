const { getAgent } = require('../setup/setup');
const {
  User,
  Vehicle,
  Trip,
  TripSeat,
  Booking,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { TRIP_STATUS, BOOKING_STATUS } = require('../../config/constants');

const DRIVER_ID = 'f4100000-0000-4000-8000-000000000001';
const OTHER_DRIVER_ID = 'f4100000-0000-4000-8000-000000000003';
const PASSENGER_ID = 'f4100000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'f4100000-0000-4000-8000-000000000010';

let driverToken;
let otherDriverToken;
let passengerToken;

function future(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

async function makeRef() {
  return 'MSR-P' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

async function seedUser(id, fullName, phone, role) {
  await User.create({
    id,
    fullName,
    phone,
    countryCode: 'JO',
    role,
    passwordHash: 'hashed',
    isVerified: true,
    avatarUrl: 'https://cdn.example.test/avatar.png',
    avgRating: 4.5,
  });
}

beforeEach(async () => {
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, OTHER_DRIVER_ID, PASSENGER_ID] }, force: true });

  await seedUser(DRIVER_ID, 'Passengers Driver', '+962795001101', 'driver');
  await seedUser(OTHER_DRIVER_ID, 'Other Driver', '+962795001103', 'driver');
  await seedUser(PASSENGER_ID, 'Dropdown Passenger', '+962795001102', 'passenger');
  await Vehicle.create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'PSGR-1',
    color: 'White',
    seats: 4,
    isVerified: true,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  otherDriverToken = generateAccessToken({ id: OTHER_DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

async function seedTrip(status) {
  const trip = await Trip.create({
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: future(-10),
    totalSeats: 3,
    availableSeats: 1,
    farePerSeat: 5,
    isRecurring: false,
    genderPreference: 'all',
    status,
  });
  await TripSeat.bulkCreate([
    { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
    { tripId: trip.id, seatNumber: 2, seatType: 'unavailable' },
    { tripId: trip.id, seatNumber: 3, seatType: 'available' },
  ]);
  return trip;
}

describe('GET /api/trips/:trip_id/passengers', () => {
  it('should list confirmed and completed passengers with dropdown fields', async () => {
    const trip = await seedTrip(TRIP_STATUS.IN_PROGRESS);
    await Booking.create({
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
      .get(`/api/trips/${trip.id}/passengers`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trip_id).toBe(trip.id);
    expect(res.body.route).toBe('Amman - Irbid');
    expect(res.body.passengers).toHaveLength(1);

    const row = res.body.passengers[0];
    expect(row.booking_id).toBeTruthy();
    expect(row.passenger.id).toBe(PASSENGER_ID);
    expect(row.passenger.full_name).toBe('Dropdown Passenger');
    expect(row.passenger.profile_picture_url).toBe('https://cdn.example.test/avatar.png');
    expect(row.passenger.rating).toBe(4.5);
    expect(row.seats_booked).toBe(1);
    expect(row.seat_numbers).toEqual([2]);
    expect(row.booking_status).toBe('confirmed');
  });

  it('should exclude cancelled bookings by default and honour ?status filter', async () => {
    const trip = await seedTrip(TRIP_STATUS.IN_PROGRESS);
    await Booking.create({
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: 2,
      seatsBooked: 1,
      agreedFare: 5,
      status: BOOKING_STATUS.CONFIRMED,
      paymentStatus: 'pending',
      referenceCode: await makeRef(),
    });
    await Booking.create({
      tripId: trip.id,
      passengerId: PASSENGER_ID,
      seatNumber: null,
      seatsBooked: 1,
      agreedFare: 5,
      status: BOOKING_STATUS.CANCELLED,
      paymentStatus: null,
      cancellationReason: 'cancelled_by_passenger',
      cancelledAt: new Date(),
      referenceCode: await makeRef(),
    });

    const all = await getAgent()
      .get(`/api/trips/${trip.id}/passengers`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(all.status).toBe(200);
    expect(all.body.passengers).toHaveLength(1);
    expect(all.body.passengers[0].booking_status).toBe('confirmed');

    const filtered = await getAgent()
      .get(`/api/trips/${trip.id}/passengers?status=cancelled`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.passengers).toHaveLength(1);
    expect(filtered.body.passengers[0].booking_status).toBe('cancelled');
  });

  it('should reject a non-owner driver with 403', async () => {
    const trip = await seedTrip(TRIP_STATUS.PUBLISHED);

    const res = await getAgent()
      .get(`/api/trips/${trip.id}/passengers`)
      .set('Authorization', `Bearer ${otherDriverToken}`);

    expect(res.status).toBe(403);
  });

  it('should reject non-driver roles with 403', async () => {
    const trip = await seedTrip(TRIP_STATUS.PUBLISHED);

    const res = await getAgent()
      .get(`/api/trips/${trip.id}/passengers`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for an unknown trip', async () => {
    const res = await getAgent()
      .get('/api/trips/550e8400-e29b-41d4-a716-446655440099/passengers')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 422 for an invalid trip id or status filter', async () => {
    const badId = await getAgent()
      .get('/api/trips/not-a-uuid/passengers')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(badId.status).toBe(422);

    const trip = await seedTrip(TRIP_STATUS.PUBLISHED);
    const badStatus = await getAgent()
      .get(`/api/trips/${trip.id}/passengers?status=bogus`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(badStatus.status).toBe(422);
  });
});
