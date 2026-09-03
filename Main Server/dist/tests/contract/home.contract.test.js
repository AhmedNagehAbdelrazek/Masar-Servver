"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, TripSeat, Booking, RecentSearch, DriverSubscription, SubscriptionPlan } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const DRIVER_ID = '3d100000-0000-4000-8000-000000000001';
const PASSENGER_ID = '3d100000-0000-4000-8000-000000000002';
const VEHICLE_ID = '3d100000-0000-4000-8000-000000000010';
let driverToken;
let passengerToken;
let tripId;
function getFutureDate(daysAhead = 1) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}
beforeEach(async () => {
    await RecentSearch.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'Home Contract Driver', phone: '+962799333333',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
        avatarUrl: 'http://example.com/d.png', avgRating: 4.6,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'Home Contract Passenger', phone: '+962799444444',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
        avatarUrl: 'http://example.com/p.png',
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Yaris',
        vehicleType: 'sedan', modelYear: 2021, plateNumber: 'HMC-101', color: 'Grey', seats: 4, isVerified: true,
    });
    const plan = await SubscriptionPlan.create({
        name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
        features: [], isFree: false, isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID, planId: plan.id, planName: plan.name,
        planPeriodDays: plan.periodDays, planPercentageCut: plan.percentageCut,
        planCost: plan.cost, balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    const created = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '14:00',
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
            { seat_number: 1, type: 'driver' },
            { seat_number: 2, type: 'available' },
            { seat_number: 3, type: 'available' },
            { seat_number: 4, type: 'unavailable' },
        ],
    });
    tripId = created.body.trip_id;
});
describe('US7 Contract - Passenger Home', () => {
    it('returns the empty passenger-home shape', async () => {
        const res = await getAgent()
            .get('/api/profile/passenger/home')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.passenger).toMatchObject({
            id: PASSENGER_ID,
            full_name: 'Home Contract Passenger',
            profile_picture_url: 'http://example.com/p.png',
        });
        expect(res.body.next_booking).toBeNull();
        expect(Array.isArray(res.body.last_searched_trips)).toBe(true);
        expect(res.body.last_searched_trips).toEqual([]);
        expect(Array.isArray(res.body.last_trips)).toBe(true);
        expect(res.body.last_trips).toEqual([]);
    });
    it('returns passenger-home shape with next_booking and last_searched_trips', async () => {
        await RecentSearch.create({
            passengerId: PASSENGER_ID, originCity: 'Amman', destinationCity: 'Zarqa', searchedOn: getFutureDate(0),
        });
        await getAgent()
            .post(`/api/trips/${tripId}/seats/lock`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ seat_number: 2 });
        const created = await getAgent()
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ trip_id: tripId, seat_number: 2, agreed_fare: '15.00' });
        const bookingId = created.body.booking.id;
        const res = await getAgent()
            .get('/api/profile/passenger/home')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.next_booking).toMatchObject({
            booking_id: bookingId,
            status: 'confirmed',
            trip: { origin: { city: 'Amman' }, destination: { city: 'Irbid' } },
            driver: { full_name: 'Home Contract Driver' },
            vehicle: { type: 'sedan', plate: 'HMC-101' },
        });
        expect(res.body.last_searched_trips[0]).toMatchObject({
            origin_city: 'Amman',
            destination_city: 'Zarqa',
        });
    });
});
//# sourceMappingURL=home.contract.test.js.map