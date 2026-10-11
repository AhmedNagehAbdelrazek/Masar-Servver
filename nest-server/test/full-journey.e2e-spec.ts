// 1:1 port of Main Server/tests/integration/fullUserJourney.e2e.test.js.
// A brand new driver registers, gets verified, publishes a trip, a new
// passenger registers, finds it, books a seat, the ride is started and
// completed, both parties rate each other, and every change is reflected
// everywhere it should be.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const COUNTRY_CODE = 'JO';
const ADMIN_PHONE = '+962798888003';
const PASSWORD = 'Test@1234';

const ADMIN_ID = 'a600e840-e29b-41d4-a716-446655440aaa';

const TRIP_PUBLISHED = 'published';
const TRIP_IN_PROGRESS = 'in_progress';
const BOOKING_CONFIRMED = 'confirmed';
const BOOKING_COMPLETED = 'completed';

let ctx: TestContext;
let adminToken: string;

function future(minutesFromNow: number): Date {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

function localDateYYYYMMDD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function departureTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function registerViaOTP(
  localPhone: string,
  role: string,
): Promise<{ token: string; phone: string; userId: string }> {
  const res = await ctx.agent
    .post('/api/auth/register/phone')
    .send({ country_code: COUNTRY_CODE, phone: localPhone, role });
  expect(res.status).toBe(201);

  const phone = `+962${localPhone}`;
  const storedOTP = await ctx.redis.get(`otp:${phone}`);

  const verify = await ctx.agent
    .post('/api/auth/register/verify-otp')
    .send({ phone, otp: storedOTP });
  expect(verify.status).toBe(201);
  expect(verify.body.phone).toBe(phone);

  const pass = await ctx.agent
    .post('/api/auth/register/password')
    .set('Authorization', `Bearer ${verify.body.registration_token as string}`)
    .send({ password: PASSWORD, confirmPassword: PASSWORD });
  expect(pass.status).toBe(201);

  return {
    token: pass.body.access_token as string,
    phone,
    userId: (pass.body.user as { id: string }).id,
  };
}

async function seedActiveSubscription(userId: string): Promise<void> {
  const plan = await ctx.prisma.subscriptionPlan.create({
    data: {
      name: 'Basic',
      periodDays: 30,
      percentageCut: 8,
      cost: 100,
      features: [],
      isFree: false,
      isActive: true,
    },
  });
  await ctx.prisma.driverSubscription.create({
    data: {
      driverId: userId,
      planId: plan.id,
      planName: plan.name,
      planPeriodDays: plan.periodDays,
      planPercentageCut: plan.percentageCut,
      planCost: plan.cost,
      balance: 100,
      paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
      status: 'active',
      approvedAt: new Date(),
      activatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  await ctx.prisma.user.update({ where: { id: userId }, data: { totalBalance: 100, isInDebt: false } });
}

beforeAll(async () => {
  ctx = await createTestApp();
});
afterAll(async () => {
  await ctx.app.close();
});

beforeEach(async () => {
  await resetTestState(ctx.prisma, ctx.redis);

  await ctx.prisma.user.create({
    data: {
      id: ADMIN_ID,
      fullName: 'Admin User',
      phone: ADMIN_PHONE,
      countryCode: COUNTRY_CODE,
      role: 'admin',
      passwordHash: 'hashed',
      isVerified: true,
    },
  });
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

describe('End-to-end user journey (driver + passenger full flow)', () => {
  it('runs the complete driver -> trip -> passenger -> ride -> rating journey', async () => {
    let driverToken: string;
    let passengerToken: string;
    let driverId: string;
    let passengerId: string;
    let tripId: string;
    let bookingId: string;

    // ------------------------------------------------------------------
    // 1. DRIVER REGISTERS through the real OTP flow
    // ------------------------------------------------------------------
    const driver = await registerViaOTP('798888001', 'driver');
    driverToken = driver.token;
    driverId = driver.userId;

    let user = await ctx.prisma.user.findUnique({ where: { id: driverId } });
    expect(user?.isVerified).toBe(false);
    expect(user?.verificationStatus).toBe('unverified');

    // ------------------------------------------------------------------
    // 2. DRIVER IS VALIDATED (verification submission + admin approval)
    // ------------------------------------------------------------------
    const submission = await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        full_name: 'Khalid Verified',
        national_id: '9988776655',
        license_number: 'L-88888',
        vehicle: {
          manufacturer: 'Toyota',
          model: 'Corolla',
          vehicle_type: 'sedan',
          model_year: 2022,
          plate_number: 'FLW-001',
          color: 'white',
          seats: 4,
        },
      });
    expect(submission.status).toBe(200);
    expect((submission.body.data as { status: string }).status).toBe('pending');

    user = await ctx.prisma.user.findUnique({ where: { id: driverId } });
    expect(user?.verificationStatus).toBe('pending');
    expect(user?.isVerified).toBe(false);

    // Driver cannot publish a trip while unverified.
    const deniedBeforeApproval = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({});
    expect(deniedBeforeApproval.status).toBe(422); // validation fails before verification check

    // Admin approves the driver.
    const approve = await ctx.agent
      .post(`/api/admin/verification/drivers/${driverId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);

    user = await ctx.prisma.user.findUnique({ where: { id: driverId } });
    expect(user?.isVerified).toBe(true);
    expect(user?.verificationStatus).toBe('approved');

    // ------------------------------------------------------------------
    // 3. DRIVER GAINS SUBSCRIPTION + BALANCE (external payment/admin flow)
    // ------------------------------------------------------------------
    await seedActiveSubscription(driverId);

    // ------------------------------------------------------------------
    // 4. DRIVER CREATES A TRIP (departs within the startable window)
    // ------------------------------------------------------------------
    const dep = future(30);
    const createRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        origin_area: 'Abdoun',
        destination_city: 'Irbid',
        destination_area: 'Downtown',
        departure_time: `${localDateYYYYMMDD(dep)}T${departureTimeHHMM(dep)}:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '20.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'available' },
        ],
        waypoints: [{ stop_name: 'Salt' }],
      });

    // THE CLIENT COMPLAINT: the trip id must show in the system.
    expect(createRes.status).toBe(201);
    expect(createRes.body.trip_id).toBeDefined();
    expect(createRes.body.status).toBe(TRIP_PUBLISHED);
    tripId = createRes.body.trip_id as string;

    // The trip is persisted.
    const tripRow = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(tripRow).not.toBeNull();
    expect(tripRow?.originCity).toBe('Amman');
    expect(tripRow?.destinationCity).toBe('Irbid');

    // ------------------------------------------------------------------
    // 5. THE TRIP SHOWS EVERYWHERE ON THE DRIVER SIDE
    // ------------------------------------------------------------------
    // a) In the driver's "my trips" list
    const myTrips = await ctx.agent
      .get('/api/trips/driver/my-trips')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(myTrips.status).toBe(200);
    expect(
      (myTrips.body.trips as { id: string; trip_id?: string }[]).some((t) => t.id === tripId || t.trip_id === tripId),
    ).toBe(true);

    // b) In the driver home screen as the next trip
    const driverHome = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverHome.status).toBe(200);
    expect((driverHome.body.next_trip as { trip_id: string }).trip_id).toBe(tripId);

    // ------------------------------------------------------------------
    // 6. PASSENGER REGISTERS through the real OTP flow
    // ------------------------------------------------------------------
    const passenger = await registerViaOTP('798888002', 'passenger');
    passengerToken = passenger.token;
    passengerId = passenger.userId;

    await ctx.agent
      .post('/api/auth/onboarding/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        fullname: 'Lina Passenger',
        national_id: '1122334455',
        age: 26,
        home_address: 'Amman, Jabal Amman',
        gender: 'female',
      });
    const passengerProfile = await ctx.prisma.passengerProfile.findFirst({ where: { passengerId } });
    expect(passengerProfile?.nationalID).toBe('1122334455');

    // ------------------------------------------------------------------
    // 7. PASSENGER SEARCHES AND FINDS THE TRIP
    // ------------------------------------------------------------------
    const search = await ctx.agent
      .get('/api/trips/search/available')
      .query({ origin_city: 'Amman', destination_city: 'Irbid', date: localDateYYYYMMDD(dep) })
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(search.status).toBe(200);
    expect((search.body.trips as unknown[]).length).toBeGreaterThanOrEqual(1);
    expect((search.body.trips as { id: string }[]).some((t) => t.id === tripId)).toBe(true);

    // The search is reflected in the passenger's "last searched trips".
    const recentSearch = await ctx.prisma.recentSearch.findFirst({
      where: { passengerId, originCity: 'Amman', destinationCity: 'Irbid' },
    });
    expect(recentSearch).not.toBeNull();

    // ------------------------------------------------------------------
    // 8. PASSENGER BOOKS A SEAT
    // ------------------------------------------------------------------
    const lock = await ctx.agent
      .post(`/api/trips/${tripId}/seats/lock`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seat_number: 2 });
    expect(lock.status).toBe(200);

    const book = await ctx.agent
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ trip_id: tripId, seat_numbers: [2], agreed_fare: '20.00' });
    expect(book.status).toBe(201);
    expect((book.body.booking as { reference_code: string }).reference_code).toMatch(/^MSR-/);
    expect((book.body.booking as { status: string }).status).toBe(BOOKING_CONFIRMED);
    bookingId = (book.body.booking as { id: string }).id;

    // Seat became unavailable + capacity dropped.
    const seat = await ctx.prisma.tripSeat.findFirst({ where: { tripId, seatNumber: 2 } });
    expect(seat?.seatType).toBe('unavailable');
    const updatedTrip = await ctx.prisma.trip.findUnique({ where: { id: tripId } });
    expect(updatedTrip?.availableSeats).toBe(2);

    // ------------------------------------------------------------------
    // 9. THE BOOKING SHOWS EVERYWHERE
    // ------------------------------------------------------------------
    // a) In the passenger's bookings list
    const passengerBookings = await ctx.agent
      .get('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(passengerBookings.status).toBe(200);
    expect((passengerBookings.body.data as { id: string }[]).some((b) => b.id === bookingId)).toBe(true);

    // b) In the passenger home screen as the next booking
    const passengerHomeBefore = await ctx.agent
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(passengerHomeBefore.status).toBe(200);
    expect((passengerHomeBefore.body.next_booking as { booking_id: string }).booking_id).toBe(bookingId);
    expect(
      ((passengerHomeBefore.body.next_booking as { driver: { full_name: string } }).driver.full_name),
    ).toBe('Khalid Verified');

    // c) In the driver's bookings list
    const driverBookings = await ctx.agent
      .get('/api/driver/bookings')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverBookings.status).toBe(200);
    expect(
      (driverBookings.body.data as { id: string; booking_id?: string }[]).some(
        (b) => b.id === bookingId || b.booking_id === bookingId,
      ),
    ).toBe(true);

    // d) The confirmed passenger shows on the driver's trip detail / passengers
    const passengers = await ctx.agent
      .get(`/api/trips/${tripId}/passengers`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(passengers.status).toBe(200);
    expect(
      (passengers.body.passengers as { passenger: { full_name: string } }[]).some(
        (p) => p.passenger.full_name === 'Lina Passenger',
      ),
    ).toBe(true);

    // ------------------------------------------------------------------
    // 10. RIDE IS STARTED
    // ------------------------------------------------------------------
    const start = await ctx.agent
      .post(`/api/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(start.status).toBe(200);
    expect(start.body.status).toBe(TRIP_IN_PROGRESS);

    // ------------------------------------------------------------------
    // 11. RIDE IS COMPLETED
    // ------------------------------------------------------------------
    const complete = await ctx.agent
      .post(`/api/trips/${tripId}/complete`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(complete.status).toBe(200);
    expect(complete.body.trip_id).toBe(tripId);
    expect(complete.body.is_in_debt).toBe(false);

    // The booking is finalized (completed + paid).
    const doneBooking = await ctx.prisma.booking.findUnique({ where: { id: bookingId } });
    expect(doneBooking?.status).toBe(BOOKING_COMPLETED);
    expect(doneBooking?.paymentStatus).toBe('paid_cash');

    // ------------------------------------------------------------------
    // 12. BOTH PARTIES RATE EACH OTHER — the change must propagate
    // ------------------------------------------------------------------
    const passengerRatesDriver = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        booking_id: bookingId,
        stars: 5,
        was_late: false,
        review: 'Smooth and on time',
        tags: ['punctual', 'clean_car'],
      });
    expect(passengerRatesDriver.status).toBe(200);
    expect((passengerRatesDriver.body.rating as { stars: number }).stars).toBe(5);

    const driverRatesPassenger = await ctx.agent
      .post('/api/ratings')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ booking_id: bookingId, stars: 5 });
    expect(driverRatesPassenger.status).toBe(200);

    // The driver's average rating is recomputed and persisted.
    const driverAfter = await ctx.prisma.user.findUnique({ where: { id: driverId } });
    expect(parseFloat(String(driverAfter?.avgRating))).toBe(5);

    // The passenger's average rating is recomputed and persisted.
    const passengerAfter = await ctx.prisma.user.findUnique({ where: { id: passengerId } });
    expect(parseFloat(String(passengerAfter?.avgRating))).toBe(5);

    // ------------------------------------------------------------------
    // 13. EVERY CHANGE IS REFLECTED WHERE IT SHOULD BE
    // ------------------------------------------------------------------
    // a) Passenger home now shows the trip in last_trips with the rating.
    // completeTrip invalidates the cached passenger home, so this read is a
    // fresh build — no manual cache eviction needed here. If the invalidation
    // regresses, this reader still returns the stale pre-ride snapshot.
    const passengerHomeAfter = await ctx.agent
      .get('/api/profile/passenger/home')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(passengerHomeAfter.status).toBe(200);
    expect(passengerHomeAfter.body.next_booking).toBeNull();
    expect((passengerHomeAfter.body.last_trips as unknown[]).length).toBeGreaterThanOrEqual(1);
    const lastTrip = (passengerHomeAfter.body.last_trips as { booking_id: string; status: string; satisfaction_rating: number }[]).find(
      (t) => t.booking_id === bookingId,
    );
    expect(lastTrip).toBeDefined();
    expect(lastTrip?.status).toBe(BOOKING_COMPLETED);
    expect(lastTrip?.satisfaction_rating).toBe(5);

    // b) The passenger booking detail shows completed + driver reveal works.
    const bookingDetail = await ctx.agent
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(bookingDetail.status).toBe(200);
    expect((bookingDetail.body.booking as { status: string }).status).toBe(BOOKING_COMPLETED);

    // c) The driver sees the rating they received.
    const driverReceived = await ctx.agent
      .get('/api/driver/ratings')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverReceived.status).toBe(200);
    expect(
      (driverReceived.body.data as { booking_id: string; stars: number }[]).some(
        (r) => r.booking_id === bookingId && r.stars === 5,
      ),
    ).toBe(true);

    // d) The passenger profile reflects their rating points as a ratee.
    const driverSidePassengers = await ctx.agent
      .get(`/api/trips/${tripId}/passengers`)
      .set('Authorization', `Bearer ${driverToken}`);
    const ratedPassenger = (
      driverSidePassengers.body.passengers as { passenger: { full_name: string; rating: number } }[]
    ).find((p) => p.passenger.full_name === 'Lina Passenger');
    expect(ratedPassenger?.passenger.rating).toBe(5);

    // e) The driver home reflects completed activity (no more pending next_trip
    // and the booking shows as completed) — also served from a fresh cache
    // because completeTrip invalidates it too.
    const driverHomeAfter = await ctx.agent
      .get('/api/driver/home')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverHomeAfter.status).toBe(200);
    expect(driverHomeAfter.body.next_trip).toBeNull();
    const completedInRecents = (
      driverHomeAfter.body.recent_bookings as { booking_id: string; status: string }[]
    ).some((b) => b.booking_id === bookingId && b.status === BOOKING_COMPLETED);
    expect(completedInRecents).toBe(true);
  });

  it('persists the created trip across the returned lists (regression for the missing trip id)', async () => {
    // A focused regression: after a driver creates a trip, the id must be
    // returned and the trip must be retrievable by id and appear in search.
    const driver = await registerViaOTP('798888004', 'driver');
    const dToken = driver.token;
    const dId = driver.userId;

    await ctx.agent
      .put('/api/driver/verification')
      .set('Authorization', `Bearer ${dToken}`)
      .send({
        full_name: 'Regression Driver',
        national_id: '7777666655',
        vehicle: {
          manufacturer: 'Kia',
          model: 'Sportage',
          vehicle_type: 'suv',
          model_year: 2021,
          plate_number: 'FLW-002',
          color: 'black',
          seats: 4,
        },
      });
    await ctx.agent
      .post(`/api/admin/verification/drivers/${dId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    await seedActiveSubscription(dId);

    const dep = future(60);
    const create = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${dToken}`)
      .send({
        origin_city: 'Zarqa',
        destination_city: 'Aqaba',
        departure_time: `${localDateYYYYMMDD(dep)}T${departureTimeHHMM(dep)}:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '30.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'available' },
        ],
      });
    expect(create.status).toBe(201);
    const id = create.body.trip_id as string;
    expect(id).toBeDefined();

    const byId = await ctx.agent
      .get(`/api/trips/${id}`)
      .set('Authorization', `Bearer ${dToken}`);
    expect(byId.status).toBe(200);
    expect(byId.body.id).toBe(id);

    const passenger = await registerViaOTP('798888005', 'passenger');
    const pToken = passenger.token;
    const search = await ctx.agent
      .get('/api/trips/search/available')
      .query({ origin_city: 'Zarqa', destination_city: 'Aqaba', date: localDateYYYYMMDD(dep) })
      .set('Authorization', `Bearer ${pToken}`);
    expect(search.status).toBe(200);
    expect((search.body.trips as { id: string }[]).some((t) => t.id === id)).toBe(true);
  });
});
