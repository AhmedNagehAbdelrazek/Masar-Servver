"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, TripSeat, TripStop, Trip, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const DRIVER_ID = 'f4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'f4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'f4000000-0000-4000-8000-000000000010';
let driverToken;
let passengerToken;
let tripId;
let stopId;
function getFutureDate(daysAhead = 1) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}
beforeEach(async () => {
    await TripStop.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });
    await User.create({
        id: DRIVER_ID, fullName: 'MultiSeat Driver', phone: '+962795559020',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
    });
    await User.create({
        id: PASSENGER_ID, fullName: 'MultiSeat Passenger', phone: '+962795559021',
        countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
        vehicleType: 'sedan', modelYear: 2023, plateNumber: 'MS-101', color: 'White', seats: 4, isVerified: true,
    });
    const plan = await SubscriptionPlan.create({
        name: 'Basic', periodDays: 30, percentageCut: 8, cost: 100,
        features: [], isFree: false, isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID, planId: plan.id, planName: plan.name, planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut, planCost: plan.cost, balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE, approvedAt: new Date(), activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    const res = await getAgent()
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
        waypoints: [{ stop_name: 'Salt' }],
    });
    expect(res.status).toBe(201);
    tripId = res.body.trip_id;
    const stop = await TripStop.findOne({ where: { tripId } });
    stopId = stop.id;
});
describe('US3 - multi-seat booking with drop-off', () => {
    it('creates a confirmed booking for multiple seats and reduces capacity', async () => {
        const res = await getAgent()
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ trip_id: tripId, seats: 2, agreed_fare: '15.00', drop_off_point: stopId });
        expect(res.status).toBe(201);
        expect(res.body.booking.status).toBe('confirmed');
        expect(res.body.booking.seats_booked).toBe(2);
        expect(res.body.booking.dropoff_place).toBeDefined();
        const trip = await Trip.findByPk(tripId);
        expect(trip.availableSeats).toBe(0);
        expect(trip.status).toBe('full');
    });
    it('rejects a drop_off_point that is not on the trip', async () => {
        const foreignStop = 'f4000000-0000-4000-8000-000000000099';
        const res = await getAgent()
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ trip_id: tripId, seats: 1, agreed_fare: '15.00', drop_off_point: foreignStop });
        expect(res.status).toBe(409);
        expect(res.body.code).toBe('DROP_OFF_POINT_NOT_ON_TRIP');
    });
    it('rejects seats exceeding available seats', async () => {
        const res = await getAgent()
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ trip_id: tripId, seats: 3, agreed_fare: '15.00' });
        expect(res.status).toBe(409);
        expect(res.body.code).toBe('NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP');
    });
    it('rejects combining seat_number lock booking with seats > 1', async () => {
        const res = await getAgent()
            .post('/api/bookings')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ trip_id: tripId, seat_number: 2, seats: 2, agreed_fare: '15.00' });
        expect(res.status).toBe(422);
    });
});
//# sourceMappingURL=bookingMultiSeat.test.js.map