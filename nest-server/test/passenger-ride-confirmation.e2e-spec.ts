import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f01';
const PASSENGER_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f02';
const OTHER_PASSENGER_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f03';
const VEHICLE_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f04';
const TRIP_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f05';
const BOOKING_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f06';
const NO_SHOW_BOOKING_ID = '8b1d6f45-0f5e-4f3f-9a0e-0f1f2f3f4f07';

describe('Passenger ride confirmation', () => {
  let ctx: TestContext;
  let driverToken: string;
  let passengerToken: string;
  let otherPassengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const passwordHash = 'hashed';
    await ctx.prisma.user.createMany({
      data: [
        {
          id: DRIVER_ID,
          fullName: 'Driver',
          phone: '+962799980001',
          countryCode: 'JO',
          role: 'driver',
          passwordHash,
          isVerified: true,
        },
        {
          id: PASSENGER_ID,
          fullName: 'Passenger',
          phone: '+962799980002',
          countryCode: 'JO',
          role: 'passenger',
          passwordHash,
          isVerified: true,
        },
        {
          id: OTHER_PASSENGER_ID,
          fullName: 'Other Passenger',
          phone: '+962799980003',
          countryCode: 'JO',
          role: 'passenger',
          passwordHash,
          isVerified: true,
        },
      ],
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2024,
        plateNumber: 'RIDE-0001',
        seats: 4,
        isVerified: true,
      },
    });
    await ctx.prisma.trip.create({
      data: {
        id: TRIP_ID,
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 30 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 10,
        status: 'in_progress',
        startedAt: new Date(),
      },
    });
    await ctx.prisma.booking.createMany({
      data: [
        {
          id: BOOKING_ID,
          tripId: TRIP_ID,
          passengerId: PASSENGER_ID,
          seatsBooked: 1,
          agreedFare: 10,
          referenceCode: 'RIDE-A-001',
          status: 'confirmed',
          paymentStatus: 'pending',
        },
        {
          id: NO_SHOW_BOOKING_ID,
          tripId: TRIP_ID,
          passengerId: OTHER_PASSENGER_ID,
          seatsBooked: 1,
          agreedFare: 10,
          referenceCode: 'RIDE-A-002',
          status: 'no_show',
          paymentStatus: 'pending',
        },
      ],
    });

    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    otherPassengerToken = generateAccessToken({ id: OTHER_PASSENGER_ID, role: 'passenger' });
  });

  it('starts and ends the ride from the passenger app', async () => {
    const started = await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(started.status).toBe(200);
    expect(started.body.booking_id).toBe(BOOKING_ID);
    expect(started.body.ride_status).toBe('in_progress');
    expect(started.body.passenger_started_at).toBeTruthy();

    const afterStart = await ctx.prisma.booking.findUnique({ where: { id: BOOKING_ID } });
    expect(afterStart?.pickupStatus).toBe('picked_up');

    const ended = await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(ended.status).toBe(200);
    expect(ended.body.ride_status).toBe('completed');
    expect(ended.body.passenger_ended_at).toBeTruthy();

    const afterEnd = await ctx.prisma.booking.findUnique({ where: { id: BOOKING_ID } });
    expect(afterEnd?.status).toBe('completed');
    expect(afterEnd?.pickupStatus).toBe('dropped_off');
    expect(afterEnd?.droppedOffAt).toBeTruthy();
  });

  it('requires start before end', async () => {
    const res = await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PASSENGER_RIDE_NOT_STARTED');
  });

  it('rejects another passenger confirming the ride', async () => {
    const res = await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${otherPassengerToken}`);

    expect(res.status).toBe(403);
  });

  it('unlocks rating after the passenger ends the ride', async () => {
    const blocked = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: BOOKING_ID, stars: 5 });
    expect(blocked.status).toBe(409);
    expect(blocked.body.code).toBe('RIDE_NOT_COMPLETED');

    await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);

    const allowed = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ booking_id: BOOKING_ID, stars: 5 });
    expect(allowed.status).toBe(200);
  });

  it('lets the driver confirm passengers after completing the trip', async () => {
    await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await ctx.prisma.trip.update({
      where: { id: TRIP_ID },
      data: { status: 'completed', completedAt: new Date() },
    });

    const res = await ctx.agent
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
    expect(res.body.passengers[1]).toMatchObject({
      booking_id: NO_SHOW_BOOKING_ID,
      was_on_trip: false,
      booking_status: 'no_show',
    });

    const noShow = await ctx.prisma.booking.findUnique({ where: { id: NO_SHOW_BOOKING_ID } });
    expect(noShow?.driverConfirmedOnTrip).toBe(false);
    expect(noShow?.driverConfirmedAt).toBeTruthy();
  });

  it('restores a no-show booking when the driver confirms the passenger rode', async () => {
    await ctx.prisma.trip.update({
      where: { id: TRIP_ID },
      data: { status: 'completed', completedAt: new Date() },
    });

    const res = await ctx.agent
      .post(`/api/trips/${TRIP_ID}/confirm-passengers`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ passengers: [{ booking_id: NO_SHOW_BOOKING_ID, was_on_trip: true }] });

    expect(res.status).toBe(200);
    const booking = await ctx.prisma.booking.findUnique({ where: { id: NO_SHOW_BOOKING_ID } });
    expect(booking?.status).toBe('completed');
    expect(booking?.driverConfirmedOnTrip).toBe(true);
    expect(booking?.paymentStatus).toBe('paid_cash');
  });

  it('does not allow downgrading an already completed passenger to no-show', async () => {
    await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/start`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await ctx.agent
      .post(`/api/bookings/${BOOKING_ID}/ride/end`)
      .set('Authorization', `Bearer ${passengerToken}`);
    await ctx.prisma.trip.update({
      where: { id: TRIP_ID },
      data: { status: 'completed', completedAt: new Date() },
    });

    const res = await ctx.agent
      .post(`/api/trips/${TRIP_ID}/confirm-passengers`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ passengers: [{ booking_id: BOOKING_ID, was_on_trip: false }] });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PASSENGER_ALREADY_MARKED_AS_COMPLETED');
  });

  it('allows a driver no-show complaint only for a no-show booking', async () => {
    await ctx.prisma.trip.update({
      where: { id: TRIP_ID },
      data: { status: 'completed', completedAt: new Date() },
    });

    const blocked = await ctx.agent
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

    const allowed = await ctx.agent
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
