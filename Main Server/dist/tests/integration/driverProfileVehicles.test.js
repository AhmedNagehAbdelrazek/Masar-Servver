"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, Rating, Trip, Booking } = require('../../Models');
const { TRIP_STATUS, BOOKING_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const OTHER_DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d83';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const OTHER_VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d91';
const TRIP_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
const BOOKING_1 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b01';
const BOOKING_2 = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4b02';
let driverToken;
let passengerToken;
async function seedDriver(id, phone) {
    return User.create({
        id,
        fullName: 'Omar Khaled',
        phone,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 4.8,
        status: 'active',
    });
}
beforeEach(async () => {
    await Rating.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: [DRIVER_ID, OTHER_DRIVER_ID, PASSENGER_ID] }, force: true });
    await seedDriver(DRIVER_ID, '+962798800001');
    await seedDriver(OTHER_DRIVER_ID, '+962798800002');
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Sara Ali',
        phone: '+962798800003',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await DriverProfile.create({
        driverId: DRIVER_ID,
        idVerified: true,
        licenseExpiry: '2027-05-01',
        totalTrips: 14,
        totalEarnings: 425.0,
        responseRate: 98,
        nationalID: '1234567890',
    });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: '12-34567',
        codeNumber: 'CODE-100',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
    await Vehicle.create({
        id: OTHER_VEHICLE_ID,
        driverId: OTHER_DRIVER_ID,
        manufacturer: 'Honda',
        model: 'Civic',
        vehicleType: 'sedan',
        modelYear: 2021,
        plateNumber: '77-00000',
        codeNumber: 'CODE-200',
        color: 'Black',
        seats: 4,
        isVerified: false,
    });
    await Trip.create({
        id: TRIP_ID,
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 10,
        status: TRIP_STATUS.COMPLETED,
    });
    await Booking.create({
        id: BOOKING_1,
        tripId: TRIP_ID,
        passengerId: PASSENGER_ID,
        seatsBooked: 1,
        agreedFare: 10,
        referenceCode: 'REF-00000001',
        status: BOOKING_STATUS.COMPLETED,
    });
    await Booking.create({
        id: BOOKING_2,
        tripId: TRIP_ID,
        passengerId: PASSENGER_ID,
        seatsBooked: 1,
        agreedFare: 10,
        referenceCode: 'REF-00000002',
        status: BOOKING_STATUS.COMPLETED,
    });
    await Rating.create({
        bookingId: BOOKING_1,
        raterId: PASSENGER_ID,
        rateeId: DRIVER_ID,
        stars: 5,
        isVisible: true,
    });
    await Rating.create({
        bookingId: BOOKING_2,
        raterId: PASSENGER_ID,
        rateeId: DRIVER_ID,
        stars: 4,
        isVisible: true,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});
describe('GET /api/driver/profile', () => {
    it('should return the aggregated profile', async () => {
        const res = await getAgent()
            .get('/api/driver/profile')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.profile.user).toMatchObject({
            id: DRIVER_ID,
            full_name: 'Omar Khaled',
            phone: '+96279***0001',
            role: 'driver',
            status: 'active',
            avg_rating: 4.8,
        });
        expect(res.body.profile.driver).toMatchObject({
            id_verified: true,
            license_expiry: '2027-05-01',
            total_trips: 14,
            total_earnings: 425,
            response_rate: 98,
            national_id: '123***890',
        });
        expect(res.body.profile.verification).toEqual({
            identity_verified: true,
            vehicle_verified: true,
            fully_verified: true,
        });
        expect(res.body.profile.vehicles).toHaveLength(1);
        expect(res.body.profile.vehicles[0]).toMatchObject({
            id: VEHICLE_ID,
            manufacturer: 'Toyota',
            model: 'Corolla',
            vehicle_type: 'sedan',
            is_verified: true,
        });
        expect(res.body.profile.ratings_summary).toEqual({ avg: 4.8, count: 2 });
    });
    it('should require a driver role', async () => {
        const res = await getAgent()
            .get('/api/driver/profile')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
    });
});
describe('GET /api/vehicles', () => {
    it('should list only the calling driver\'s vehicles', async () => {
        const res = await getAgent()
            .get('/api/vehicles')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(res.body.vehicles).toHaveLength(1);
        expect(res.body.vehicles[0].id).toBe(VEHICLE_ID);
        expect(res.body.vehicles[0].plate_number).toBe('12-34567');
        expect(res.body.vehicles[0].is_verified).toBe(true);
    });
    it('should require a driver role', async () => {
        const res = await getAgent()
            .get('/api/vehicles')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(403);
    });
});
describe('PUT /api/vehicles/:vehicle_id', () => {
    it('should partially update the driver\'s own vehicle', async () => {
        const res = await getAgent()
            .put(`/api/vehicles/${VEHICLE_ID}`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ color: 'Silver', seats: 4 });
        expect(res.status).toBe(200);
        expect(res.body.vehicle.id).toBe(VEHICLE_ID);
        expect(res.body.vehicle.color).toBe('Silver');
        expect(res.body.vehicle.seats).toBe(4);
        expect(res.body.vehicle.is_verified).toBe(true);
        const persisted = await Vehicle.findByPk(VEHICLE_ID);
        expect(persisted.color).toBe('Silver');
    });
    it('should reject updating another driver\'s vehicle', async () => {
        const res = await getAgent()
            .put(`/api/vehicles/${OTHER_VEHICLE_ID}`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ color: 'Red' });
        expect(res.status).toBe(403);
    });
    it('should return 409 when the plate number is already taken', async () => {
        const res = await getAgent()
            .put(`/api/vehicles/${VEHICLE_ID}`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ plate_number: '77-00000' });
        expect(res.status).toBe(409);
    });
    it('should allow a code number shared with another vehicle (not unique)', async () => {
        const res = await getAgent()
            .put(`/api/vehicles/${VEHICLE_ID}`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ code_number: 'CODE-200' });
        expect(res.status).toBe(200);
        expect(res.body.vehicle.code_number).toBe('CODE-200');
    });
    it('should update the code number', async () => {
        const res = await getAgent()
            .put(`/api/vehicles/${VEHICLE_ID}`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ code_number: 'CODE-999' });
        expect(res.status).toBe(200);
        expect(res.body.vehicle.code_number).toBe('CODE-999');
    });
    it('should return 404 for a nonexistent vehicle', async () => {
        const res = await getAgent()
            .put('/api/vehicles/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ color: 'Red' });
        expect(res.status).toBe(404);
    });
    it('should return 422 for an invalid vehicle_type', async () => {
        const res = await getAgent()
            .put(`/api/vehicles/${VEHICLE_ID}`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ vehicle_type: 'spaceship' });
        expect(res.status).toBe(422);
    });
});
//# sourceMappingURL=driverProfileVehicles.test.js.map