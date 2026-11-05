"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const Models_1 = require("../../Models");
const constants_1 = require("../../config/constants");
const driverStatsService_1 = require("../../Services/driverStatsService");
const DRIVER_ID = 'c4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'c4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'c4000000-0000-4000-8000-000000000010';
let hostTrip;
async function createHostTrip(status = constants_1.TRIP_STATUS.PUBLISHED) {
    const trip = (await Models_1.Trip.create({
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 86400000),
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 15,
        status,
    }));
    const booking = (await Models_1.Booking.create({
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 15,
        currency: 'JOD',
        status: 'confirmed',
        paymentStatus: 'pending',
        referenceCode: 'MSR-TEST1',
    }));
    return { tripId: trip.id, bookingId: booking.id };
}
(0, globals_1.beforeEach)(async () => {
    await Models_1.Rating.destroy({
        where: {},
        force: true,
    });
    await Models_1.Booking.destroy({
        where: {},
        force: true,
    });
    await Models_1.TripSeat.destroy({
        where: {},
        force: true,
    });
    await Models_1.Trip.destroy({
        where: {},
        force: true,
    });
    await Models_1.Vehicle.destroy({
        where: {},
        force: true,
    });
    await Models_1.DriverProfile.destroy({
        where: { driverId: DRIVER_ID },
        force: true,
    });
    await Models_1.User.destroy({
        where: { id: [DRIVER_ID, PASSENGER_ID] },
        force: true,
    });
    await Models_1.User.create({
        id: DRIVER_ID,
        fullName: 'Stats Driver',
        phone: '+962795559070',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await Models_1.User.create({
        id: PASSENGER_ID,
        fullName: 'Stats Passenger',
        phone: '+962795559071',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await Models_1.Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'STT-101',
        color: 'White',
        seats: 4,
        isVerified: true,
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
            status: constants_1.TRIP_STATUS.COMPLETED,
        });
    }
    return Models_1.Trip.bulkCreate(rows);
}
function createRatings(onTime, late) {
    const rows = [];
    for (let i = 0; i < onTime; i++) {
        rows.push({
            bookingId: hostTrip.bookingId,
            raterId: PASSENGER_ID,
            rateeId: DRIVER_ID,
            stars: 5,
            wasLate: false,
            isVisible: true,
        });
    }
    for (let i = 0; i < late; i++) {
        rows.push({
            bookingId: hostTrip.bookingId,
            raterId: PASSENGER_ID,
            rateeId: DRIVER_ID,
            stars: 3,
            wasLate: true,
            isVisible: true,
        });
    }
    return Models_1.Rating.bulkCreate(rows);
}
(0, globals_1.describe)('driverStatsService.recomputeForDriver', () => {
    (0, globals_1.it)('writes totalTrips, punctualityRate and professional flag back to the profile', async () => {
        await createCompletedTrips(3);
        await createRatings(4, 1); // 80% on time
        const result = (await (0, driverStatsService_1.recomputeForDriver)(DRIVER_ID));
        (0, globals_1.expect)(result.completedTrips).toBe(3);
        (0, globals_1.expect)(result.punctualityRate).toBe(80);
        (0, globals_1.expect)(result.professionalDriver).toBe(false);
        const profile = (await Models_1.DriverProfile.findOne({ where: { driverId: DRIVER_ID } }));
        (0, globals_1.expect)(profile.totalTrips).toBe(3);
        (0, globals_1.expect)(Number(profile.punctualityRate)).toBe(80);
        (0, globals_1.expect)(profile.professionalDriver).toBe(false);
    });
    (0, globals_1.it)('marks a driver professional with enough trips and high punctuality', async () => {
        await createCompletedTrips(20);
        await createRatings(10, 0); // 100% on time
        const result = (await (0, driverStatsService_1.recomputeForDriver)(DRIVER_ID));
        (0, globals_1.expect)(result.professionalDriver).toBe(true);
    });
    (0, globals_1.it)('handles no activity by zeroing stats with null punctuality', async () => {
        const result = (await (0, driverStatsService_1.recomputeForDriver)(DRIVER_ID));
        (0, globals_1.expect)(result.completedTrips).toBe(0);
        (0, globals_1.expect)(result.punctualityRate).toBeNull();
        (0, globals_1.expect)(result.professionalDriver).toBe(false);
        const profile = await Models_1.DriverProfile.findOne({ where: { driverId: DRIVER_ID } });
        (0, globals_1.expect)(profile).toBeTruthy();
    });
    (0, globals_1.it)('recomputes for every driver with activity via recomputeAllDrivers', async () => {
        await createCompletedTrips(1);
        const results = (await (0, driverStatsService_1.recomputeAllDrivers)());
        (0, globals_1.expect)(Array.isArray(results)).toBe(true);
        const ours = results.find((r) => r.driverId === DRIVER_ID);
        (0, globals_1.expect)(ours).toBeDefined();
        (0, globals_1.expect)(ours?.completedTrips).toBe(1);
    });
});
//# sourceMappingURL=driverStatsService.test.js.map