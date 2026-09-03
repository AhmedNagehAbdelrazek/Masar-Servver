"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, Booking, Complaint, UploadedImage, DriverProfile, DocumentReview, } = require('../../Models');
const { TRIP_STATUS, BOOKING_STATUS, COMPLAINT_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = 'a1000000-0000-4000-8000-000000000001';
const DRIVER_A_ID = 'a1000000-0000-4000-8000-000000000002';
const DRIVER_B_ID = 'a1000000-0000-4000-8000-000000000003';
const DRIVER_C_ID = 'a1000000-0000-4000-8000-000000000004';
const PASSENGER_ID = 'a1000000-0000-4000-8000-000000000005';
const VEHICLE_A_ID = 'b1000000-0000-4000-8000-000000000001';
const TRIP_1_ID = 'c1000000-0000-4000-8000-000000000001';
const TRIP_2_ID = 'c1000000-0000-4000-8000-000000000002';
const BOOKING_1_ID = 'd1000000-0000-4000-8000-000000000001';
let adminToken;
let driverToken;
async function cleanAll() {
    await DocumentReview.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await Complaint.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await UploadedImage.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
}
async function seedWorld() {
    await User.bulkCreate([
        { id: ADMIN_ID, fullName: 'Admin One', phone: '+962700000001', role: 'admin', passwordHash: 'x', isVerified: true },
        { id: DRIVER_A_ID, fullName: 'Active Driver', phone: '+962711111101', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active' },
        { id: DRIVER_B_ID, fullName: 'Pending Driver', phone: '+962711111102', role: 'driver', passwordHash: 'x', isVerified: false, verificationStatus: 'pending', status: 'active' },
        { id: DRIVER_C_ID, fullName: 'Suspended Driver', phone: '+962711111103', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'suspended' },
        { id: PASSENGER_ID, fullName: 'Passenger P', phone: '+962722222201', role: 'passenger', passwordHash: 'x', isVerified: true },
    ]);
    const img = await UploadedImage.create({ hash: `h-${Date.now()}-a`, url: 'http://img/id_front.jpg', filename: 'f.jpg', mimetype: 'image/jpeg' });
    await DriverProfile.create({ driverId: DRIVER_B_ID, userIdentificationFront: img.id });
    await Vehicle.create({
        id: VEHICLE_A_ID, driverId: DRIVER_A_ID, manufacturer: 'Toyota', model: 'Corolla',
        vehicleType: 'sedan', modelYear: 2022, plateNumber: `A-${Date.now() % 100000}`, color: 'White', seats: 4, isVerified: true,
    });
    await Trip.bulkCreate([
        {
            id: TRIP_1_ID, driverId: DRIVER_A_ID, vehicleId: VEHICLE_A_ID,
            originCity: 'Amman', destinationCity: 'Irbid',
            departureTime: new Date(Date.now() + 86400000), totalSeats: 4, availableSeats: 4,
            farePerSeat: 10, status: TRIP_STATUS.PUBLISHED,
        },
        {
            id: TRIP_2_ID, driverId: DRIVER_A_ID, vehicleId: VEHICLE_A_ID,
            originCity: 'Irbid', destinationCity: 'Amman',
            departureTime: new Date(Date.now() - 172800000), totalSeats: 4, availableSeats: 4,
            farePerSeat: 9, status: TRIP_STATUS.COMPLETED,
        },
    ]);
    await Booking.create({
        id: BOOKING_1_ID, tripId: TRIP_1_ID, passengerId: PASSENGER_ID,
        seatsBooked: 2, agreedFare: 20, referenceCode: `RC${Date.now() % 1000000}`,
        status: BOOKING_STATUS.CONFIRMED,
    });
    await Complaint.bulkCreate([
        { reporterId: PASSENGER_ID, accusedId: DRIVER_A_ID, category: 'misconduct', description: 'rude', status: COMPLAINT_STATUS.OPEN },
        { reporterId: PASSENGER_ID, accusedId: DRIVER_C_ID, category: 'delay', description: 'late', status: COMPLAINT_STATUS.RESOLVED },
    ]);
}
beforeAll(async () => {
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_A_ID, role: 'driver' });
});
describe('GET /api/admin/dashboard/summary â€” empty platform', () => {
    beforeEach(async () => { await cleanAll(); });
    it('returns zeroed KPIs and empty arrays without errors', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/summary')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.kpis).toMatchObject({
            total_drivers: 0, active_drivers: 0, total_trips: 0,
            active_trips: 0, total_vehicles: 0, pending_documents: 0,
        });
        expect(res.body.alerts.every((a) => typeof a.count === 'number')).toBe(true);
        expect(res.body.top_routes).toEqual([]);
        expect(res.body.recent_trips).toEqual([]);
        expect(res.body.pending_requests).toEqual([]);
        expect(res.body.latest_complaints).toEqual([]);
    });
});
describe('GET /api/admin/dashboard/summary â€” seeded platform', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedWorld();
    });
    it('returns reconciled KPIs, alerts, routes, trips, requests, complaints in one payload', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/summary')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.kpis).toMatchObject({
            total_drivers: 3, active_drivers: 1, total_trips: 2, active_trips: 1, total_vehicles: 1,
        });
        const alertTypes = res.body.alerts.map((a) => a.type);
        expect(alertTypes).toEqual(expect.arrayContaining([
            'pending_verification_documents', 'pending_review_drivers', 'unresolved_complaints',
        ]));
        expect(res.body.alerts.find((a) => a.type === 'unresolved_complaints').count).toBe(1);
        expect(res.body.top_routes.length).toBeGreaterThan(0);
        const ammanIrbid = res.body.top_routes.find((r) => r.origin === 'Amman' && r.destination === 'Irbid');
        expect(ammanIrbid.trips_count).toBe(1);
        const recent = res.body.recent_trips.find((t) => t.trip_id === TRIP_1_ID);
        expect(recent).toMatchObject({ status: 'published' });
        expect(recent.driver.name).toBe('Active Driver');
        expect(recent.passengers_count).toBe(2);
        const pendingReq = res.body.pending_requests.find((p) => p.driver_id === DRIVER_B_ID);
        expect(pendingReq).toBeDefined();
        expect(pendingReq.pending_documents).toContain('id_front');
        expect(res.body.latest_complaints).toHaveLength(2);
        const openComplaint = res.body.latest_complaints.find((c) => c.status === 'open');
        expect(openComplaint.accused.name).toBe('Active Driver');
    });
});
describe('Dashboard partials', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedWorld();
    });
    it('GET /recent-trips paginates and filters independently', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/recent-trips?status=completed&page=1&limit=10')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].status).toBe('completed');
        expect(res.body.pagination.total).toBe(1);
    });
    it('GET /top-routes returns ranked routes', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/top-routes')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.top_routes[0]).toHaveProperty('trips_count');
    });
    it('GET /pending-requests lists pending drivers with their outstanding documents', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/pending-requests')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].driver_id).toBe(DRIVER_B_ID);
        expect(res.body.pagination.total).toBe(1);
    });
    it('GET /latest-complaints paginates', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/latest-complaints?page=1&limit=1')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination.total).toBe(2);
        expect(res.body.pagination.total_pages).toBe(2);
    });
});
describe('Dashboard access control', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedWorld();
    });
    it('rejects drivers with 403', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/summary')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(403);
    });
    it('rejects anonymous callers with 401', async () => {
        const res = await getAgent().get('/api/admin/dashboard/summary');
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=adminDashboardSummary.test.js.map