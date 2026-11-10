const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, Booking, Rating, Complaint } = require('../../Models');
const { BOOKING_STATUS, TRIP_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f01';
const PASSENGER_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f02';
const OTHER_PASSENGER_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f03';
const VEHICLE_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f04';
const TRIP_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f05';
const BOOKING_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f06';
const NO_SHOW_BOOKING_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f07';

let driverToken;
let passengerToken;
let otherPassengerToken;

async function cleanup() {
  await Complaint.destroy({ where: { bookingId: [BOOKING_ID, NO_SHOW_BOOKING_ID] }, force: true });
  await Rating.destroy({ where: { bookingId: [BOOKING_ID, NO_SHOW_BOOKING_ID] }, force: true });
  await Booking.destroy({ where: { id: [BOOKING_ID, NO_SHOW_BOOKING_ID] }, force: true });
  await Trip.destroy({ where: { id: TRIP_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID, OTHER_PASSENGER_ID] }, force: true });
}

async function seed() {
  const passwordHash = 'hashed';
  await User.create({
    id: DRIVER_ID, fullName: 'Driver', phone: '+962799980001',
    countryCode: 'JO', role: 'driver', passwordHash, isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Passenger', phone: '+962799980002',
    countryCode: 'JO', role: 'passenger', passwordHash, isVerified: true,
  });
  await User.create({
    id: OTHER_PASSENGER_ID, fullName: 'Other Passenger', phone: '+962799980003',
    countryCode: 'JO', role: 'passenger', passwordHash, isVerified: true,
  });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
    vehicleType: 'sedan', modelYear: 2024, plateNumber: 'RIDE-0001', seats: 4, isVerified: true,
  });
  await Trip.create({
    id: TRIP_ID, driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
    originCity: 'Amman', destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 30 * 60 * 1000),
    totalSeats: 4, availableSeats: 2, farePerSeat: 10,
    status: TRIP_STATUS.IN_PROGRESS, startedAt: new Date(),
  });
  await Booking.create({
    id: BOOKING_ID, tripId: TRIP_ID, passengerId: PASSENGER_ID,
    seatsBooked: 1, agreedFare: 10, referenceCode: 'RIDE-A-001',
    status: BOOKING_STATUS.CONFIRMED, paymentStatus: 'pending',
  });
  await Booking.create({
    id: NO_SHOW_BOOKING_ID, tripId: TRIP_ID, passengerId: OTHER_PASSENGER_ID,
    seatsBooked: 1, agreedFare: 10, referenceCode: 'RIDE-A-002',
    status: BOOKING_STATUS.NO_SHOW, paymentStatus: 'pending',
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  otherPassengerToken = generateAccessToken({ id: OTHER_PASSENGER_ID, role: 'passenger' });
}

beforeEach(async () => {
  await cleanup();
  await seed();
});

describe('Passenger ride confirmation', () => {
  it('starts and ends the ride from the passenger app', async () => {
    const started = await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(started.status).toBe(200);
    expect(started.body.booking_id).toBe(BOOKING_ID);
    expect(started.body.ride_status).toBe('in_progress');
    expect(started.body.passenger_started_at).toBeTruthy();
    expect(started.body.passenger_ended_at).toBeNull();

    const afterStart = await Booking.findByPk(BOOKING_ID);
    expect(afterStart.pickupStatus).toBe('picked_up');
    expect(afterStart.passengerStartedAt).toBeTruthy();

    const ended = await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(ended.status).toBe(200);
    expect(ended.body.ride_status).toBe('completed');
    expect(ended.body.passenger_ended_at).toBeTruthy();

    const afterEnd = await Booking.findByPk(BOOKING_ID);
    expect(afterEnd.status).toBe(BOOKING_STATUS.COMPLETED);
    expect(afterEnd.pickupStatus).toBe('dropped_off');
    expect(afterEnd.droppedOffAt).toBeTruthy();
  });

  it('requires start before end', async () => {
    const res = await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PASSENGER_RIDE_NOT_STARTED');
  });

  it('rejects another passenger confirming the ride', async () => {
    const res = await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${otherPassengerToken}`);

    expect(res.status).toBe(403);
  });

  it('unlocks rating after the passenger ends the ride', async () => {
    const blocked = await getAgent()
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: BOOKING_ID, stars: 5 });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('RIDE_NOT_COMPLETED');

    await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);

    const allowed = await getAgent()
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: BOOKING_ID, stars: 5 });
    expect(allowed.status).toBe(200);
  });

  it('lets the driver confirm passengers after completing the trip', async () => {
    await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await Trip.update({ status: TRIP_STATUS.COMPLETED, completedAt: new Date() }, { where: { id: TRIP_ID } });

    const res = await getAgent()
      .post(`/api/trips/${TRIP_ID}/confirm-passengers`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        passengers: [
          { booking_id: BOOKING_ID, was_on_trip: true },
          { booking_id: NO_SHOW_BOOKING_ID, was_on_trip: false },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.passengers).toHaveLength(2);
    expect(res.body.passengers[0]).toMatchObject({
      booking_id: BOOKING_ID,
      was_on_trip: true,
      booking_status: BOOKING_STATUS.COMPLETED,
    });
    expect(res.body.passengers[1]).toMatchObject({
      booking_id: NO_SHOW_BOOKING_ID,
      was_on_trip: false,
      booking_status: BOOKING_STATUS.NO_SHOW,
    });

    const noShow = await Booking.findByPk(NO_SHOW_BOOKING_ID);
    expect(noShow.driverConfirmedOnTrip).toBe(false);
    expect(noShow.driverConfirmedAt).toBeTruthy();
  });

  it('restores a no-show booking when the driver confirms the passenger rode', async () => {
    await Trip.update({ status: TRIP_STATUS.COMPLETED, completedAt: new Date() }, { where: { id: TRIP_ID } });

    const res = await getAgent()
      .post(`/api/trips/${TRIP_ID}/confirm-passengers`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ passengers: [{ booking_id: NO_SHOW_BOOKING_ID, was_on_trip: true }] });

    expect(res.status).toBe(200);
    const booking = await Booking.findByPk(NO_SHOW_BOOKING_ID);
    expect(booking.status).toBe(BOOKING_STATUS.COMPLETED);
    expect(booking.driverConfirmedOnTrip).toBe(true);
    expect(booking.paymentStatus).toBe('paid_cash');
  });

  it('does not allow downgrading an already completed passenger to no-show', async () => {
    await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await getAgent()
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await Trip.update({ status: TRIP_STATUS.COMPLETED, completedAt: new Date() }, { where: { id: TRIP_ID } });

    const res = await getAgent()
      .post(`/api/trips/${TRIP_ID}/confirm-passengers`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ passengers: [{ booking_id: BOOKING_ID, was_on_trip: false }] });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PASSENGER_ALREADY_MARKED_AS_COMPLETED');
  });

  it('allows a driver no-show complaint only for a no-show booking', async () => {
    await Trip.update({ status: TRIP_STATUS.COMPLETED, completedAt: new Date() }, { where: { id: TRIP_ID } });

    const blocked = await getAgent()
      .post('/api/complaints')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        accused_id: PASSENGER_ID,
        booking_id: BOOKING_ID,
        category: 'no_show',
        description: 'Passenger did not ride',
      });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('PASSENGER_IS_NOT_MARKED_AS_NO_SHOW');

    const allowed = await getAgent()
      .post('/api/complaints')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        accused_id: OTHER_PASSENGER_ID,
        booking_id: NO_SHOW_BOOKING_ID,
        category: 'no_show',
        description: 'Passenger did not ride',
      });
    expect(allowed.status).toBe(200);
    expect(allowed.body.complaint.category).toBe('no_show');
  });
});
