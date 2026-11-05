"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Booking, Trip } = require('../../Models');
const { BOOKING_STATUS, TRIP_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
let driverToken;
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Contract Driver', phone: '+962798888888',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true, avgRating: 4.5,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'Contract Passenger', phone: '+962798888889',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'CTR-1001', color: 'White', seats: 4, isVerified: true,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
function makeRef() {
    return 'MSR-' + Math.random().toString(36).slice(2, 9).toUpperCase();
}
describe('US7 Contract - Earnings & Stats', () => {
    it('GET /api/driver/earnings returns envelope with period/currency/total/breakdown', async () => {
        const trip = await Trip.create({
            driverId: DRIVER_ID,
            vehicleId: VEHICLE_ID,
            originCity: 'Amman', destinationCity: 'Irbid',
            departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            totalSeats: 4, availableSeats: 3, farePerSeat: 10, status: TRIP_STATUS.COMPLETED,
        });
        await Booking.create({
            tripId: trip.id, passengerId: PASSENGER_ID, seatNumber: 2, seatsBooked: 1,
            agreedFare: 85, status: BOOKING_STATUS.COMPLETED, referenceCode: makeRef(),
        });
        const res = await getAgent()
            .get('/api/driver/earnings')
            .query({ period: 'week' })
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.period).toBe('week');
        expect(res.body.currency).toBe('JOD');
        expect(typeof res.body.total).toBe('number');
        expect(Array.isArray(res.body.breakdown)).toBe(true);
        expect(res.body.breakdown[0].bucket).toBeDefined();
        expect(typeof res.body.breakdown[0].earnings).toBe('number');
        expect(typeof res.body.breakdown[0].trips).toBe('number');
    });
    it('GET /api/driver/stats returns stats envelope', async () => {
        const res = await getAgent()
            .get('/api/driver/stats')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.stats).toBeDefined();
        expect(typeof res.body.stats.total_trips).toBe('number');
        expect(typeof res.body.stats.total_bookings).toBe('number');
        expect(typeof res.body.stats.no_show_rate).toBe('number');
        expect(typeof res.body.stats.response_rate).toBe('number');
        expect(typeof res.body.stats.avg_rating).toBe('number');
        expect(typeof res.body.stats.total_earnings).toBe('number');
        expect(typeof res.body.stats.completed_trips).toBe('number');
        expect(typeof res.body.stats.cancelled_trips).toBe('number');
    });
    it('422 for invalid period', async () => {
        const res = await getAgent()
            .get('/api/driver/earnings')
            .query({ period: 'year' })
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(422);
        expect(res.body.status).toBe('error');
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
});
//# sourceMappingURL=earningsStats.contract.test.js.map