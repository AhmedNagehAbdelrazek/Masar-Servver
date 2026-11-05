"use strict";
const { getAgent } = require('../setup/setup');
const { User, DriverProfile, Vehicle, Trip, TripSeat, Booking, SubscriptionPlan, DriverSubscription, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS, BOOKING_STATUS } = require('../../config/constants');
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440d41';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440d42';
const OUTSIDER_ID = '550e8400-e29b-41d4-a716-446655440d43';
const VEHICLE_ID = '550e8400-e29b-41d4-a716-446655440d50';
let driverToken;
let passengerToken;
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
        referenceCode: 'TD-INT-01',
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
        phone: '+962710000441',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Confirmed Passenger',
        phone: '+962710000442',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: OUTSIDER_ID,
        fullName: 'Unrelated User',
        phone: '+962710000443',
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
        plateNumber: 'TD-INT-1',
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
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    outsiderToken = generateAccessToken({ id: OUTSIDER_ID, role: 'passenger' });
});
describe('US1 - Trip details with passengers', () => {
    it('shows full driver profile and vehicle to confirmed passenger', async () => {
        const trip = await seedTrip();
        const res = await getAgent()
            .get(`/api/trips/${trip.id}`)
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.trip).toBeDefined();
        expect(res.body.trip.driver).toBeDefined();
        expect(res.body.trip.driver.full_name).toBe('Trip Details Driver');
        expect(res.body.trip.driver.phone).toBe('+962710000441');
        expect(res.body.trip.driver.rating).toBeDefined();
        expect(res.body.trip.vehicle).toBeDefined();
        expect(res.body.trip.vehicle.make_model).toBe('Toyota Camry');
        expect(res.body.trip.vehicle.year).toBe(2023);
        expect(res.body.trip.vehicle.plate_number).toBe('TD-INT-1');
        expect(res.body.trip.vehicle.total_seats).toBe(4);
    });
    it('shows passenger with booking details to driver', async () => {
        const trip = await seedTrip();
        const res = await getAgent()
            .get(`/api/trips/${trip.id}`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.passengers).toHaveLength(1);
        const p = res.body.passengers[0];
        expect(p.passenger).toBeDefined();
        expect(p.passenger.full_name).toBe('Confirmed Passenger');
        expect(p.passenger.phone).toBe('+962710000442');
        expect(p.seat_numbers).toEqual([2]);
        expect(p.agreed_fare).toBe(5);
        expect(p.booking_status).toBe('confirmed');
    });
    it('returns 403 for an unrelated authenticated user', async () => {
        const trip = await seedTrip();
        const res = await getAgent()
            .get(`/api/trips/${trip.id}`)
            .set('Authorization', `Bearer ${outsiderToken}`);
        expect(res.status).toBe(403);
    });
    it('returns 404 for a non-existent trip', async () => {
        const res = await getAgent()
            .get('/api/trips/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d98')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(404);
    });
    it('returns empty passengers array when no bookings exist', async () => {
        const trip = await seedTrip();
        await Booking.destroy({ where: { tripId: trip.id } });
        const res = await getAgent()
            .get(`/api/trips/${trip.id}`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.passengers).toEqual([]);
    });
});
//# sourceMappingURL=tripDetails.test.js.map