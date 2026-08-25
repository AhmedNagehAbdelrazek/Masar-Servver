const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, Complaint, UploadedImage, DriverProfile, DocumentReview } = require('../../Models');
const { TRIP_STATUS, COMPLAINT_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = 'a5000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a5000000-0000-4000-8000-000000000002';
const PASSENGER_ID = 'a5000000-0000-4000-8000-000000000003';

let adminToken;

async function cleanAndSeed() {
  await DocumentReview.destroy({ where: {}, force: true });
  await Complaint.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: {}, force: true });
  await UploadedImage.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.bulkCreate([
    { id: ADMIN_ID, fullName: 'Admin', phone: '+962700005001', role: 'admin', passwordHash: 'x', isVerified: true },
    { id: DRIVER_ID, fullName: 'Driver X', phone: '+962780005002', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved' },
    { id: PASSENGER_ID, fullName: 'Passenger Y', phone: '+962780005003', role: 'passenger', passwordHash: 'x', isVerified: true },
  ]);
  await Vehicle.create({
    id: 'b5000000-0000-4000-8000-000000000001', driverId: DRIVER_ID,
    manufacturer: 'Kia', model: 'Cerato', vehicleType: 'sedan',
    plateNumber: `E-${Date.now() % 100000}`, seats: 4,
  });
  await Trip.create({
    driverId: DRIVER_ID, vehicleId: 'b5000000-0000-4000-8000-000000000001',
    originCity: 'Amman', destinationCity: 'Zarqa',
    departureTime: new Date(Date.now() + 3600000), totalSeats: 4, availableSeats: 4,
    farePerSeat: 8, status: TRIP_STATUS.PUBLISHED,
  });
}

beforeAll(async () => {
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

beforeEach(cleanAndSeed);

const authed = (agent) => agent.set('Authorization', `Bearer ${adminToken}`);

describe('Contract: GET /api/admin/dashboard/summary', () => {
  it('exposes exactly the documented top-level sections and KPI keys', async () => {
    const res = await authed(getAgent().get('/api/admin/dashboard/summary'));
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([
      'alerts', 'kpis', 'latest_complaints', 'pending_requests', 'recent_trips', 'top_routes',
    ]);
    expect(Object.keys(res.body.kpis).sort()).toEqual([
      'active_drivers', 'active_trips', 'pending_documents', 'total_drivers', 'total_trips', 'total_vehicles',
    ]);
    for (const alert of res.body.alerts) {
      expect(Object.keys(alert).sort()).toEqual(['count', 'message', 'type']);
    }
  });
});

describe('Contract: dashboard partial endpoints', () => {
  it('GET /recent-trips rows + pagination meta shape', async () => {
    const res = await authed(getAgent().get('/api/admin/dashboard/recent-trips'));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const trip of res.body.data) {
      expect(Object.keys(trip).sort()).toEqual([
        'departure_time', 'driver', 'passengers_count', 'reservations_count', 'route', 'status', 'trip_id',
      ]);
    }
    expect(res.body.pagination).toEqual({
      page: expect.any(Number), limit: expect.any(Number),
      total: expect.any(Number), total_pages: expect.any(Number),
    });
  });

  it('GET /top-routes rows shape', async () => {
    const res = await authed(getAgent().get('/api/admin/dashboard/top-routes'));
    expect(res.status).toBe(200);
    for (const route of res.body.top_routes) {
      expect(Object.keys(route).sort()).toEqual(['destination', 'origin', 'trips_count']);
    }
  });

  it('GET /pending-requests row shape', async () => {
    const res = await authed(getAgent().get('/api/admin/dashboard/pending-requests'));
    expect(res.status).toBe(200);
    for (const req of res.body.data) {
      expect(Object.keys(req).sort()).toEqual(['driver_id', 'name', 'pending_documents', 'phone', 'submitted_at']);
    }
  });

  it('GET /latest-complaints row shape', async () => {
    const res = await authed(getAgent().get('/api/admin/dashboard/latest-complaints'));
    expect(res.status).toBe(200);
    for (const complaint of res.body.data) {
      expect(Object.keys(complaint).sort()).toEqual(['accused', 'complainant', 'date', 'id', 'status', 'subject']);
    }
  });
});

describe('Contract: error envelope', () => {
  it('403 forbidden carries status/code/message fields', async () => {
    const driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    const res = await getAgent()
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 'error', code: 'FORBIDDEN' });
    expect(typeof res.body.message).toBe('string');
  });
});
