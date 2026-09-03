"use strict";
const { User, Vehicle, Trip, TripSeat, Booking, Rating, DriverProfile } = require('../../Models');
const { TRIP_STATUS } = require('../../config/constants');
const { recomputeForDriver, recomputeAllDrivers } = require('../../Services/driverStatsService');
const DRIVER_ID = 'c4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'c4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'c4000000-0000-4000-8000-000000000010';
let hostTrip;
async function createHostTrip(status = TRIP_STATUS.PUBLISHED) {
    const trip = await Trip.create({
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 86400000),
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 15,
        status,
    });
    const booking = await Booking.create({
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 15,
        currency: 'JOD',
        status: 'confirmed',
        paymentStatus: 'pending',
        referenceCode: 'MSR-TEST1',
    });
    return { tripId: trip.id, bookingId: booking.id };
}
beforeEach(async () => {
    await Rating.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Stats Driver', phone: '+962795559070',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'Stats Passenger', phone: '+962795559071',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'STT-101', color: 'White', seats: 4, isVerified: true,
    });
    // host trip/booking required to satisfy the ratings.booking_id FK
    const host = await createHostTrip();
    hostTrip = host;
});
function createCompletedTrips(count) {
    const rows = [];
    for (let i = 0; i < count; i++) {
        rows.push({
            driverId: DRIVER_ID,
            vehicleId: VEHICLE_ID,
            originCity: 'Amman',
            destinationCity: 'Irbid',
            departureTime: new Date(Date.now() - (i + 1) * 86400000),
            totalSeats: 4,
            availableSeats: 2,
            farePerSeat: 15,
            status: TRIP_STATUS.COMPLETED,
        });
    }
    return Trip.bulkCreate(rows);
}
function createRatings(onTime, late) {
    const rows = [];
    for (let i = 0; i < onTime; i++) {
        rows.push({ bookingId: hostTrip.bookingId, raterId: PASSENGER_ID, rateeId: DRIVER_ID, stars: 5, wasLate: false, isVisible: true });
    }
    for (let i = 0; i < late; i++) {
        rows.push({ bookingId: hostTrip.bookingId, raterId: PASSENGER_ID, rateeId: DRIVER_ID, stars: 3, wasLate: true, isVisible: true });
    }
    return Rating.bulkCreate(rows);
}
describe('driverStatsService.recomputeForDriver', () => {
    it('writes totalTrips, punctualityRate and professional flag back to the profile', async () => {
        await createCompletedTrips(3);
        await createRatings(4, 1); // 80% on time
        const result = await recomputeForDriver(DRIVER_ID);
        expect(result.completedTrips).toBe(3);
        expect(result.punctualityRate).toBe(80);
        expect(result.professionalDriver).toBe(false);
        const profile = await DriverProfile.findOne({ where: { driverId: DRIVER_ID } });
        expect(profile.totalTrips).toBe(3);
        expect(Number(profile.punctualityRate)).toBe(80);
        expect(profile.professionalDriver).toBe(false);
    });
    it('marks a driver professional with enough trips and high punctuality', async () => {
        await createCompletedTrips(20);
        await createRatings(10, 0); // 100% on time
        const result = await recomputeForDriver(DRIVER_ID);
        expect(result.professionalDriver).toBe(true);
    });
    it('handles no activity by zeroing stats with null punctuality', async () => {
        const result = await recomputeForDriver(DRIVER_ID);
        expect(result.completedTrips).toBe(0);
        expect(result.punctualityRate).toBeNull();
        expect(result.professionalDriver).toBe(false);
        const profile = await DriverProfile.findOne({ where: { driverId: DRIVER_ID } });
        expect(profile).toBeTruthy();
    });
    it('recomputes for every driver with activity via recomputeAllDrivers', async () => {
        await createCompletedTrips(1);
        const results = await recomputeAllDrivers();
        expect(Array.isArray(results)).toBe(true);
        const ours = results.find((r) => r.driverId === DRIVER_ID);
        expect(ours).toBeDefined();
        expect(ours.completedTrips).toBe(1);
    });
});
//# sourceMappingURL=driverStatsService.test.js.map