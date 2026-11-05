const { getAgent } = require('../setup/setup');
const { User, Complaint, Booking, Trip } = require('../../Models');
const { COMPLAINT_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_PHONE = '+962790000000';
const DRIVER_PHONE = '+962791111111';
const PASSENGER_PHONE = '+962792222222';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440000';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSENGER_ID = '550e8400-e29b-41d4-a716-446655440002';

let adminToken;
let driverToken;
let passengerToken;

beforeEach(async () => {
  await Complaint.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await User.destroy({ where: { phone: [ADMIN_PHONE, DRIVER_PHONE, PASSENGER_PHONE] }, force: true });

  await User.create({
    id: ADMIN_ID, fullName: 'Admin User', phone: ADMIN_PHONE,
    countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: DRIVER_ID, fullName: 'Omar Khaled', phone: DRIVER_PHONE,
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Lina Haddad', phone: PASSENGER_PHONE,
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

describe('US6 - Complaints', () => {
  describe('POST /api/complaints', () => {
    it('should file a complaint against another user', async () => {
      const res = await getAgent()
        .post('/api/complaints')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          accused_id: DRIVER_ID,
          category: 'no_show',
          description: 'Driver did not arrive at pickup',
          evidence_urls: ['https://res.cloudinary.com/example/evidence.png'],
        });

      expect(res.status).toBe(200);
      expect(res.body.complaint.accused_id).toBe(DRIVER_ID);
      expect(res.body.complaint.category).toBe('no_show');
      expect(res.body.complaint.status).toBe(COMPLAINT_STATUS.OPEN);
      expect(res.body.already_filed).toBe(false);
    });

    it('should be idempotent — matching open complaint is not duplicated', async () => {
      const body = {
        accused_id: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not arrive at pickup',
      };

      await getAgent()
        .post('/api/complaints')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(body);

      const res = await getAgent()
        .post('/api/complaints')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ ...body, description: 'Repeated complaint' });

      expect(res.status).toBe(200);
      expect(res.body.already_filed).toBe(true);

      const count = await Complaint.count({ where: { reporterId: PASSENGER_ID } });
      expect(count).toBe(1);
    });

    it('should reject invalid category with 422', async () => {
      const res = await getAgent()
        .post('/api/complaints')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ accused_id: DRIVER_ID, category: 'bogus', description: 'x' });

      expect(res.status).toBe(422);
    });

    it('should reject self-complaint with 422', async () => {
      const res = await getAgent()
        .post('/api/complaints')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ accused_id: PASSENGER_ID, category: 'other', description: 'me' });

      expect(res.status).toBe(422);
    });

    it('should return 404 for unknown accused', async () => {
      const res = await getAgent()
        .post('/api/complaints')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          accused_id: '550e8400-e29b-41d4-a716-446655440099',
          category: 'other',
          description: 'x',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/driver/complaints', () => {
    it('should show complaints filed by the driver', async () => {
      await Complaint.create({
        reporterId: DRIVER_ID,
        accusedId: PASSENGER_ID,
        category: 'no_show',
        description: 'Passenger did not show',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .get('/api/driver/complaints')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].direction).toBe('filed');
      expect(res.body.data[0].other_party).toBe('Lina Haddad');
      expect(res.body.data[0].category).toBe('no_show');
    });

    it('should show complaints against the driver', async () => {
      await Complaint.create({
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'lateness',
        description: 'Driver was late',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .get('/api/driver/complaints')
        .query({ direction: 'against' })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].direction).toBe('against');
      expect(res.body.data[0].other_party).toBe('Lina Haddad');
    });

    it('should filter by status', async () => {
      await Complaint.create({
        reporterId: DRIVER_ID,
        accusedId: PASSENGER_ID,
        category: 'no_show',
        description: 'Passenger did not show',
        status: COMPLAINT_STATUS.OPEN,
      });
      await Complaint.create({
        reporterId: DRIVER_ID,
        accusedId: PASSENGER_ID,
        category: 'other',
        description: 'Old resolved complaint',
        status: COMPLAINT_STATUS.RESOLVED,
      });

      const res = await getAgent()
        .get('/api/driver/complaints')
        .query({ status: COMPLAINT_STATUS.RESOLVED })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe(COMPLAINT_STATUS.RESOLVED);
    });
  });

  describe('PUT /api/admin/complaints/:complaint_id', () => {
    it('should resolve a complaint and record resolution', async () => {
      const complaint = await Complaint.create({
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .put(`/api/admin/complaints/${complaint.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: COMPLAINT_STATUS.RESOLVED, resolution: 'Driver refunded passenger manually' });

      expect(res.status).toBe(200);
      expect(res.body.complaint.status).toBe(COMPLAINT_STATUS.RESOLVED);
      expect(res.body.complaint.resolution).toBe('Driver refunded passenger manually');
      expect(res.body.complaint.resolved_by).toBe(ADMIN_ID);
      expect(res.body.complaint.resolved_at).toBeDefined();
    });

    it('should dismiss a complaint', async () => {
      const complaint = await Complaint.create({
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'other',
        description: 'Unsubstantiated',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .put(`/api/admin/complaints/${complaint.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: COMPLAINT_STATUS.DISMISSED });

      expect(res.status).toBe(200);
      expect(res.body.complaint.status).toBe(COMPLAINT_STATUS.DISMISSED);
    });

    it('should require resolution when resolving (422)', async () => {
      const complaint = await Complaint.create({
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .put(`/api/admin/complaints/${complaint.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: COMPLAINT_STATUS.RESOLVED });

      expect(res.status).toBe(422);
    });

    it('should reject non-admin with 403', async () => {
      const complaint = await Complaint.create({
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'other',
        description: 'x',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .put(`/api/admin/complaints/${complaint.id}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: COMPLAINT_STATUS.DISMISSED });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/complaints', () => {
    it('should list complaints with reporter and accused names', async () => {
      await Complaint.create({
        reporterId: PASSENGER_ID,
        accusedId: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
        status: COMPLAINT_STATUS.OPEN,
      });

      const res = await getAgent()
        .get('/api/admin/complaints')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reporter_name).toBe('Lina Haddad');
      expect(res.body.data[0].accused_name).toBe('Omar Khaled');
      expect(res.body.pagination.total).toBe(1);
    });
  });
});
