"use strict";
const { getAgent } = require('../setup/setup');
const { User, DriverProfile, Vehicle, Trip, TripSeat, Booking, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS, BOOKING_STATUS } = require('../../config/constants');
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440d21';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440d22';
const OUTSIDER_ID = '550e8400-e29b-41d4-a716-446655440d23';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440d30';
let driverToken;
let outsiderToken;
async function seedTrip() {
    const trip = await Trip.create({
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 30 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 1,
        farePerSeat: 5,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
    });
    await TripSeat.bulkCreate([
        { tripId: trip.id, seatNumber: 1, seatType: 'driver' },
        { tripId: trip.id, seatNumber: 2, seatType: 'available' },
    ]);
    await Booking.create({
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 5,
        referenceCode: 'TD-CON-01',
        status: BOOKING_STATUS.CONFIRMED,
    });
    return trip;
}
beforeEach(async () => {
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: {}, force: true });
    await SubscriptionPlan.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID, OUTSIDER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Trip Details Driver',
        phone: '+962710000421',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Confirmed Passenger',
        phone: '+962710000422',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: OUTSIDER_ID,
        fullName: 'Unrelated User',
        phone: '+962710000423',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await DriverProfile.create({ driverId: DRIVER_ID });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'TD-CON-1',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
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
        driverId: DRIVER_ID,
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
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    outsiderToken = generateAccessToken({ id: OUTSIDER_ID, role: 'passenger' });
});
describe('Contract: GET /api/trips/:trip_id (US3)', () => {
    it('keeps the existing trip fields and includes passengers for the driver', async () => {
        const trip = await seedTrip();
        const res = await getAgent()
            .get(`/api/trips/${trip.id}`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(typeof res.body.id).toBe('string');
        expect(res.body.originCity).toBeDefined();
        expect(res.body.destinationCity).toBeDefined();
        expect(res.body.departureTime).toBeDefined();
        expect(res.body.vehicle).toBeDefined();
        expect(Array.isArray(res.body.seats)).toBe(true);
        expect(Array.isArray(res.body.stops)).toBe(true);
        expect(Array.isArray(res.body.passengers)).toBe(true);
        expect(res.body.passengers.length).toBe(1);
        expect(res.body.passengers[0].booking_id).toBeDefined();
        expect(res.body.passengers[0].passenger_name).toBe('Confirmed Passenger');
    });
    it('omits passengers for an unrelated authenticated user but keeps trip info', async () => {
        const trip = await seedTrip();
        const res = await getAgent()
            .get(`/api/trips/${trip.id}`)
            .set('Authorization', `Bearer ${outsiderToken}`);
        expect(res.status).toBe(200);
        expect(typeof res.body.id).toBe('string');
        expect(res.body.originCity).toBeDefined();
        expect(Array.isArray(res.body.seats)).toBe(true);
        expect(res.body.passengers).toBeUndefined();
    });
});
//# sourceMappingURL=tripDetails.contract.test.js.map