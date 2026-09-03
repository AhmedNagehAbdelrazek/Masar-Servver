"use strict";
const { getAgent, getRedisStore } = require('../setup/setup');
const { User, DriverProfile, Vehicle, PassengerProfile, Trip, TripSeat, TripStop, Booking, Rating, RecentSearch, SubscriptionPlan, DriverSubscription, VerificationStatusChange, Notification, } = require('../../Models');
const { TRIP_STATUS, BOOKING_STATUS, SUBSCRIPTION_STATUS, } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
// ---------------------------------------------------------------------------
// End-to-end journey: a brand new driver registers, gets verified, uploads a
// trip, a new passenger registers, finds it, books a seat, the ride is
// started and completed, both parties rate each other, and every change is
// reflected everywhere it should be.
//
// The driver + passenger are created through the REAL auth (OTP) flow and the
// driver is validated through the REAL verification + admin approval flow so
// we prove the whole pipeline works from the client's perspective.
// ---------------------------------------------------------------------------
const COUNTRY_CODE = 'JO';
const ADMIN_PHONE = '+962798888003';
const PASSWORD = 'Test@1234';
const ADMIN_ID = 'a600e840-e29b-41d4-a716-446655440aaa';
let driverToken;
let passengerToken;
let adminToken;
let driverId;
let passengerId;
let tripId;
let bookingId;
function future(minutesFromNow) {
    return new Date(Date.now() + minutesFromNow * 60 * 1000);
}
function localDateYYYYMMDD(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function departureTimeHHMM(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
async function registerViaOTP(localPhone, role) {
    const res = await getAgent()
        .post('/api/auth/register/phone')
        .send({ country_code: COUNTRY_CODE, phone: localPhone, role });
    expect(res.status).toBe(201);
    const phone = `+962${localPhone}`;
    const store = getRedisStore();
    const storedOTP = store.get(`otp:${phone}`);
    const verify = await getAgent()
        .post('/api/auth/register/verify-otp')
        .send({ phone, otp: storedOTP });
    expect(verify.status).toBe(201);
    expect(verify.body.phone).toBe(phone);
    const pass = await getAgent()
        .post('/api/auth/register/password')
        .set('Authorization', `Bearer ${verify.body.registration_token}`)
        .send({ password: PASSWORD, confirmPassword: PASSWORD });
    expect(pass.status).toBe(201);
    return { token: pass.body.access_token, phone, userId: pass.body.user.id };
}
async function seedActiveSubscription(userId) {
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
        driverId: userId,
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
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: userId } });
}
beforeEach(async () => {
    await Rating.destroy({ where: {}, force: true });
    await RecentSearch.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripStop.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await PassengerProfile.destroy({ where: {}, force: true });
    await VerificationStatusChange.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await User.create({
        id: ADMIN_ID,
        fullName: 'Admin User',
        phone: ADMIN_PHONE,
        countryCode: COUNTRY_CODE,
        role: 'admin',
        passwordHash: 'hashed',
        isVerified: true,
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});
describe('End-to-end user journey (driver + passenger full flow)', () => {
    it('runs the complete driver -> trip -> passenger -> ride -> rating journey', async () => {
        // ------------------------------------------------------------------
        // 1. DRIVER REGISTERS through the real OTP flow
        // ------------------------------------------------------------------
        const driver = await registerViaOTP('798888001', 'driver');
        driverToken = driver.token;
        driverId = driver.userId;
        let user = await User.findByPk(driverId);
        expect(user.isVerified).toBe(false);
        expect(user.verificationStatus).toBe('unverified');
        // ------------------------------------------------------------------
        // 2. DRIVER IS VALIDATED (verification submission + admin approval)
        // ------------------------------------------------------------------
        const submission = await getAgent()
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
        expect(submission.body.data.status).toBe('pending');
        user = await User.findByPk(driverId);
        expect(user.verificationStatus).toBe('pending');
        expect(user.isVerified).toBe(false);
        // Driver cannot publish a trip while unverified.
        const deniedBeforeApproval = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({});
        expect(deniedBeforeApproval.status).toBe(422); // validation fails before verification check
        // Admin approves the driver.
        const approve = await getAgent()
            .post(`/api/admin/verification/drivers/${driverId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(approve.status).toBe(200);
        user = await User.findByPk(driverId);
        expect(user.isVerified).toBe(true);
        expect(user.verificationStatus).toBe('approved');
        // ------------------------------------------------------------------
        // 3. DRIVER GAINS SUBSCRIPTION + BALANCE (external payment/admin flow)
        // ------------------------------------------------------------------
        await seedActiveSubscription(driverId);
        // ------------------------------------------------------------------
        // 4. DRIVER CREATES A TRIP (departs within the startable window)
        // ------------------------------------------------------------------
        const dep = future(30);
        const createRes = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({
            origin_city: 'Amman',
            origin_area: 'Abdoun',
            destination_city: 'Irbid',
            destination_area: 'Downtown',
            departure_date: localDateYYYYMMDD(dep),
            departure_time: departureTimeHHMM(dep),
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
        expect(createRes.body.status).toBe(TRIP_STATUS.PUBLISHED);
        tripId = createRes.body.trip_id;
        // The trip is persisted.
        const tripRow = await Trip.findByPk(tripId);
        expect(tripRow).not.toBeNull();
        expect(tripRow.originCity).toBe('Amman');
        expect(tripRow.destinationCity).toBe('Irbid');
        // ------------------------------------------------------------------
        // 5. THE TRIP SHOWS EVERYWHERE ON THE DRIVER SIDE
        // ------------------------------------------------------------------
        // a) In the driver's "my trips" list
        const myTrips = await getAgent()
            .get('/api/trips/driver/my-trips')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(myTrips.status).toBe(200);
        expect(myTrips.body.trips.some((t) => t.id === tripId || t.trip_id === tripId)).toBe(true);
        // b) In the driver home screen as the next trip
        const driverHome = await getAgent()
            .get('/api/driver/home')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(driverHome.status).toBe(200);
        expect(driverHome.body.next_trip.trip_id).toBe(tripId);
        // ------------------------------------------------------------------
        // 6. PASSENGER REGISTERS through the real OTP flow
        // ------------------------------------------------------------------
        const passenger = await registerViaOTP('798888002', 'passenger');
        passengerToken = passenger.token;
        passengerId = passenger.userId;
        await getAgent()
            .post('/api/auth/onboarding/profile/passenger')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({
            fullname: 'Lina Passenger',
            national_id: '1122334455',
            age: 26,
            home_address: 'Amman, Jabal Amman',
            gender: 'female',
        });
        const passengerProfile = await PassengerProfile.findOne({ where: { passengerId } });
        expect(passengerProfile.nationalID).toBe('1122334455');
        // ------------------------------------------------------------------
        // 7. PASSENGER SEARCHES AND FINDS THE TRIP
        // ------------------------------------------------------------------
        const search = await getAgent()
            .get('/api/trips/search/available')
            .query({ origin_city: 'Amman', destination_city: 'Irbid', date: localDateYYYYMMDD(dep) })
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(search.status).toBe(200);
        expect(search.body.trips.length).toBeGreaterThanOrEqual(1);
        expect(search.body.trips.some((t) => t.id === tripId)).toBe(true);
        // The search is reflected in the passenger's "last searched trips".
        const recentSearch = await RecentSearch.findOne({
            where: { passengerId, originCity: 'Amman', destinationCity: 'Irbid' },
        });
        expect(recentSearch).not.toBeNull();
        // ------------------------------------------------------------------
        // 8. PASSENGER BOOKS A SEAT
        // ------------------------------------------------------------------
        const lock = await getAgent()
            .post(`/api/trips/${tripId}/seats/lock`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ seat_number: 2 });
        expect(lock.status).toBe(200);
        const book = await getAgent()
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ trip_id: tripId, seat_number: 2, agreed_fare: '20.00' });
        expect(book.status).toBe(201);
        expect(book.body.booking.reference_code).toMatch(/^MSR-/);
        expect(book.body.booking.status).toBe(BOOKING_STATUS.CONFIRMED);
        bookingId = book.body.booking.id;
        // Seat became unavailable + capacity dropped.
        const seat = await TripSeat.findOne({ where: { tripId, seatNumber: 2 } });
        expect(seat.seatType).toBe('unavailable');
        const updatedTrip = await Trip.findByPk(tripId);
        expect(updatedTrip.availableSeats).toBe(2);
        // ------------------------------------------------------------------
        // 9. THE BOOKING SHOWS EVERYWHERE
        // ------------------------------------------------------------------
        // a) In the passenger's bookings list
        const passengerBookings = await getAgent()
            .get('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(passengerBookings.status).toBe(200);
        expect(passengerBookings.body.data.some((b) => b.id === bookingId)).toBe(true);
        // b) In the passenger home screen as the next booking
        const passengerHomeBefore = await getAgent()
            .get('/api/profile/passenger/home')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(passengerHomeBefore.status).toBe(200);
        expect(passengerHomeBefore.body.next_booking.booking_id).toBe(bookingId);
        expect(passengerHomeBefore.body.next_booking.driver.full_name).toBe('Khalid Verified');
        // c) In the driver's bookings list
        const driverBookings = await getAgent()
            .get('/api/driver/bookings')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(driverBookings.status).toBe(200);
        expect(driverBookings.body.data.some((b) => b.id === bookingId || b.booking_id === bookingId))
            .toBe(true);
        // d) The confirmed passenger shows on the driver's trip detail / passengers
        const passengers = await getAgent()
            .get(`/api/trips/${tripId}/passengers`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(passengers.status).toBe(200);
        expect(passengers.body.passengers.some((p) => p.passenger.full_name === 'Lina Passenger'))
            .toBe(true);
        // ------------------------------------------------------------------
        // 10. RIDE IS STARTED
        // ------------------------------------------------------------------
        const start = await getAgent()
            .post(`/api/trips/${tripId}/start`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(start.status).toBe(200);
        expect(start.body.status).toBe(TRIP_STATUS.IN_PROGRESS);
        // ------------------------------------------------------------------
        // 11. RIDE IS COMPLETED
        // ------------------------------------------------------------------
        const complete = await getAgent()
            .post(`/api/trips/${tripId}/complete`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(complete.status).toBe(200);
        expect(complete.body.trip_id).toBe(tripId);
        expect(complete.body.is_in_debt).toBe(false);
        // The booking is finalized (completed + paid).
        const doneBooking = await Booking.findByPk(bookingId);
        expect(doneBooking.status).toBe(BOOKING_STATUS.COMPLETED);
        expect(doneBooking.paymentStatus).toBe('paid_cash');
        // ------------------------------------------------------------------
        // 12. BOTH PARTIES RATE EACH OTHER — the change must propagate
        // ------------------------------------------------------------------
        const passengerRatesDriver = await getAgent()
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
        expect(passengerRatesDriver.body.rating.stars).toBe(5);
        const driverRatesPassenger = await getAgent()
            .post('/api/ratings')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ booking_id: bookingId, stars: 5 });
        expect(driverRatesPassenger.status).toBe(200);
        // The driver's average rating is recomputed and persisted.
        const driverAfter = await User.findByPk(driverId);
        expect(parseFloat(driverAfter.avgRating)).toBe(5);
        // The passenger's average rating is recomputed and persisted.
        const passengerAfter = await User.findByPk(passengerId);
        expect(parseFloat(passengerAfter.avgRating)).toBe(5);
        // ------------------------------------------------------------------
        // 13. EVERY CHANGE IS REFLECTED WHERE IT SHOULD BE
        // ------------------------------------------------------------------
        // a) Passenger home now shows the trip in last_trips with the rating.
        // completeTrip invalidates the cached passenger home, so this read is a
        // fresh build — no manual cache eviction needed here. If the invalidation
        // regresses, this reader still returns the stale pre-ride snapshot.
        const passengerHomeAfter = await getAgent()
            .get('/api/profile/passenger/home')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(passengerHomeAfter.status).toBe(200);
        expect(passengerHomeAfter.body.next_booking).toBeNull();
        expect(passengerHomeAfter.body.last_trips.length).toBeGreaterThanOrEqual(1);
        const lastTrip = passengerHomeAfter.body.last_trips.find((t) => t.booking_id === bookingId);
        expect(lastTrip).toBeDefined();
        expect(lastTrip.status).toBe(BOOKING_STATUS.COMPLETED);
        expect(lastTrip.satisfaction_rating).toBe(5);
        // b) The passenger booking detail shows completed + driver reveal works.
        const bookingDetail = await getAgent()
            .get(`/api/bookings/${bookingId}`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(bookingDetail.status).toBe(200);
        expect(bookingDetail.body.booking.status).toBe(BOOKING_STATUS.COMPLETED);
        // c) The driver sees the rating they received.
        const driverReceived = await getAgent()
            .get('/api/driver/ratings')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(driverReceived.status).toBe(200);
        expect(driverReceived.body.data.some((r) => r.booking_id === bookingId && r.stars === 5))
            .toBe(true);
        // d) The passenger profile reflects their rating points as a ratee.
        const driverSidePassengers = await getAgent()
            .get(`/api/trips/${tripId}/passengers`)
            .set('Authorization', `Bearer ${driverToken}`);
        const ratedPassenger = driverSidePassengers.body.passengers.find((p) => p.passenger.full_name === 'Lina Passenger');
        expect(ratedPassenger.passenger.rating).toBe(5);
        // e) The driver home reflects completed activity (no more pending next_trip
        // and the booking shows as completed) — also served from a fresh cache
        // because completeTrip invalidates it too.
        const driverHomeAfter = await getAgent()
            .get('/api/driver/home')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(driverHomeAfter.status).toBe(200);
        expect(driverHomeAfter.body.next_trip).toBeNull();
        const completedInRecents = driverHomeAfter.body.recent_bookings.some((b) => b.booking_id === bookingId && b.status === BOOKING_STATUS.COMPLETED);
        expect(completedInRecents).toBe(true);
    });
    it('persists the created trip across the returned lists (regression for the missing trip id)', async () => {
        // A focused regression: after a driver creates a trip, the id must be
        // returned and the trip must be retrievable by id and appear in search.
        const driver = await registerViaOTP('798888004', 'driver');
        const dToken = driver.token;
        const dId = driver.userId;
        await getAgent()
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
        await getAgent()
            .post(`/api/admin/verification/drivers/${dId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        await seedActiveSubscription(dId);
        const dep = future(60);
        const create = await getAgent()
            .post('/api/trips')
            .set('Authorization', `Bearer ${dToken}`)
            .send({
            origin_city: 'Zarqa',
            destination_city: 'Aqaba',
            departure_date: localDateYYYYMMDD(dep),
            departure_time: departureTimeHHMM(dep),
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
        const id = create.body.trip_id;
        expect(id).toBeDefined();
        const byId = await getAgent()
            .get(`/api/trips/${id}`)
            .set('Authorization', `Bearer ${dToken}`);
        expect(byId.status).toBe(200);
        expect(byId.body.id).toBe(id);
        const passenger = await registerViaOTP('798888005', 'passenger');
        const pToken = passenger.token;
        const search = await getAgent()
            .get('/api/trips/search/available')
            .query({ origin_city: 'Zarqa', destination_city: 'Aqaba', date: localDateYYYYMMDD(dep) })
            .set('Authorization', `Bearer ${pToken}`);
        expect(search.status).toBe(200);
        expect(search.body.trips.some((t) => t.id === id)).toBe(true);
    });
});
//# sourceMappingURL=fullUserJourney.e2e.test.js.map