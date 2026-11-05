"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const VEHICLE_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d80';
const TRIP_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4a01';
let adminToken;
beforeEach(async () => {
    await Trip.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: [ADMIN_ID, DRIVER_ID] }, force: true });
    await User.create({
        id: ADMIN_ID, fullName: 'Admin', phone: '+962790000001',
        countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true,
    });
    await User.create({
        id: DRIVER_ID, fullName: 'Omar Khaled', phone: '+962798800001',
        countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true, avgRating: 4.8,
    });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
        vehicleType: 'sedan', modelYear: 2022, plateNumber: '12-34567', color: 'White', seats: 4, isVerified: true,
    });
    await Trip.create({
        id: TRIP_ID, driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
        originCity: 'Amman', destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalSeats: 4, availableSeats: 3, farePerSeat: 10, status: 'published',
    });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});
describe('US10 Contract - Admin User & Trip Moderation + Penalty Issuance', () => {
    it('GET /api/admin/users returns data + pagination envelope', async () => {
        const res = await getAgent()
            .get('/api/admin/users?role=driver')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data[0]).toEqual({
            id: DRIVER_ID,
            full_name: 'Omar Khaled',
            phone: expect.any(String),
            role: 'driver',
            status: 'active',
            avg_rating: 4.8,
            created_at: expect.any(String),
        });
        expect(res.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1, total_pages: 1 });
    });
    it('PUT /api/admin/users/:id returns user envelope', async () => {
        const res = await getAgent()
            .put(`/api/admin/users/${DRIVER_ID}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'suspended', reason: 'No-show rate above threshold' });
        expect(res.status).toBe(200);
        expect(res.body.user).toEqual({
            id: DRIVER_ID,
            status: 'suspended',
            updated_by: ADMIN_ID,
        });
    });
    it('PUT /api/admin/trips/:id returns trip envelope', async () => {
        const res = await getAgent()
            .put(`/api/admin/trips/${TRIP_ID}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'unpublish', reason: 'Duplicate listing' });
        expect(res.status).toBe(200);
        expect(res.body.trip).toMatchObject({
            id: TRIP_ID,
            status: 'published',
            is_blocked_by_balance: false,
            moderated: true,
        });
    });
    it('POST /api/admin/penalties returns penalty envelope', async () => {
        const res = await getAgent()
            .post('/api/admin/penalties')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            user_id: DRIVER_ID,
            type: 'warning',
            reason: 'Late responses',
        });
        expect(res.status).toBe(200);
        expect(res.body.penalty).toMatchObject({
            user_id: DRIVER_ID,
            type: 'warning',
            reason: 'Late responses',
            starts_at: expect.any(String),
            ends_at: null,
            issued_by: ADMIN_ID,
        });
    });
});
//# sourceMappingURL=adminModeration.contract.test.js.map