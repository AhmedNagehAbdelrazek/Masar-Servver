const { getAgent } = require('../setup/setup');
const {
  User, Vehicle, Trip, Booking, Complaint, DocumentReview,
} = require('../../Models');
const { TRIP_STATUS, BOOKING_STATUS, COMPLAINT_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = 'a9000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a9000000-0000-4000-8000-000000000002';
const PASSENGER_ID = 'a9000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'b9000000-0000-4000-8000-000000000001';
const TRIP_ID = 'c9000000-0000-4000-8000-000000000001';

let adminToken;

async function cleanAndSeed() {
  await DocumentReview.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await Complaint.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await Vehicle.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });

  await User.bulkCreate([
    { id: ADMIN_ID, fullName: 'Admin', phone: '+962700009001', role: 'admin', passwordHash: 'x', isVerified: true },
    { id: DRIVER_ID, fullName: 'Listing Driver', phone: '+962780009002', role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved' },
    { id: PASSENGER_ID, fullName: 'Listing Passenger', phone: '+962780009003', role: 'passenger', passwordHash: 'x', isVerified: true },
  ]);
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Corolla',
    vehicleType: 'sedan', plateNumber: `G-${Date.now() % 100000}`, seats: 4,
  });
  await Trip.create({
    id: TRIP_ID, driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
    originCity: 'Amman', destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 86400000),
    totalSeats: 4, availableSeats: 2, farePerSeat: 10, status: TRIP_STATUS.PUBLISHED,
  });
  await Booking.bulkCreate([
    {
      tripId: TRIP_ID, passengerId: PASSENGER_ID, seatsBooked: 2, agreedFare: 20,
      referenceCode: `RG${Date.now() % 100000}`, status: BOOKING_STATUS.CONFIRMED,
    },
    {
      tripId: TRIP_ID, passengerId: PASSENGER_ID, seatsBooked: 1, agreedFare: 10,
      referenceCode: `RH${Date.now() % 100000}`, status: BOOKING_STATUS.CANCELLED,
      cancellationReason: 'change of plans',
    },
  ]);
}

beforeAll(async () => {
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

beforeEach(cleanAndSeed);

describe('GET /api/admin/dashboard/reservations', () => {
  it('lists bookings with driver/passenger/trip context and paginates', async () => {
    const res = await getAgent()
      .get('/api/admin/dashboard/reservations?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(2);
    const row = res.body.data[0];
    expect(row.driver.name).toBe('Listing Driver');
    expect(row.passenger.name).toBe('Listing Passenger');
    expect(row.trip).toMatchObject({ origin: 'Amman', destination: 'Irbid' });
  });

  it('filters by status', async () => {
    const res = await getAgent()
      .get('/api/admin/dashboard/reservations?status=cancelled')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('cancelled');
    expect(res.body.data[0].price).toBe(10);
  });
});

describe('Complaints interplay with existing moderation endpoints (R13 reuse)', () => {
  it('an open complaint resolved via PUT /api/admin/complaints/:id no longer counts as unresolved on the dashboard summary', async () => {
    const complaint = await Complaint.create({
      reporterId: PASSENGER_ID, accusedId: DRIVER_ID,
      category: 'misconduct', description: 'test', status: COMPLAINT_STATUS.OPEN,
    });

    const before = await getAgent()
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(before.body.alerts.find((a) => a.type === 'unresolved_complaints').count).toBe(1);

    const resolve = await getAgent()
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved', resolution: 'warned both parties' });
    expect(resolve.status).toBe(200);

    const after = await getAgent()
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.alerts.find((a) => a.type === 'unresolved_complaints').count).toBe(0);
  });
});
