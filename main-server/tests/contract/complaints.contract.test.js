const { getAgent } = require('../setup/setup');
const { User, Complaint } = require('../../Models');
const { COMPLAINT_STATUS } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d90';
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
const PASSENGER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d82';

let adminToken;
let passengerToken;

beforeEach(async () => {
  await Complaint.destroy({ where: {}, force: true });
  await User.destroy({ where: { id: [ADMIN_ID, DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({
    id: ADMIN_ID, fullName: 'Contract Admin', phone: '+962790000001',
    countryCode: 'JO', role: 'admin', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: DRIVER_ID, fullName: 'Contract Driver', phone: '+962798888888',
    countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true,
  });
  await User.create({
    id: PASSENGER_ID, fullName: 'Contract Passenger', phone: '+962798888889',
    countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true,
  });

  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

describe('US6 Contract - Complaints', () => {
  it('POST /api/complaints returns complaint envelope', async () => {
    const res = await getAgent()
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        accused_id: DRIVER_ID,
        category: 'no_show',
        description: 'Driver did not show',
      });

    expect(res.status).toBe(200);
    expect(res.body.complaint.id).toBeDefined();
    expect(res.body.complaint.accused_id).toBe(DRIVER_ID);
    expect(res.body.complaint.category).toBe('no_show');
    expect(res.body.complaint.status).toBe(COMPLAINT_STATUS.OPEN);
    expect(res.body.complaint.created_at).toBeDefined();
  });

  it('PUT /api/admin/complaints/:id returns resolved envelope', async () => {
    const complaint = await Complaint.create({
      reporterId: PASSENGER_ID, accusedId: DRIVER_ID, category: 'no_show',
      description: 'Driver did not show', status: COMPLAINT_STATUS.OPEN,
    });

    const res = await getAgent()
      .put(`/api/admin/complaints/${complaint.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: COMPLAINT_STATUS.RESOLVED, resolution: 'Refunded' });

    expect(res.status).toBe(200);
    expect(res.body.complaint.id).toBe(complaint.id);
    expect(res.body.complaint.status).toBe(COMPLAINT_STATUS.RESOLVED);
    expect(res.body.complaint.resolution).toBe('Refunded');
    expect(res.body.complaint.resolved_by).toBe(ADMIN_ID);
    expect(res.body.complaint.resolved_at).toBeDefined();
  });

  it('GET /api/admin/complaints returns paginated list', async () => {
    await Complaint.create({
      reporterId: PASSENGER_ID, accusedId: DRIVER_ID, category: 'no_show',
      description: 'Driver did not show', status: COMPLAINT_STATUS.OPEN,
    });

    const res = await getAgent()
      .get('/api/admin/complaints')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].reporter_name).toBe('Contract Passenger');
    expect(res.body.data[0].accused_name).toBe('Contract Driver');
    expect(res.body.data[0].category).toBe('no_show');
    expect(res.body.pagination.total_pages).toBe(1);
  });

  it('422 for self-complaint returns details array', async () => {
    const res = await getAgent()
      .post('/api/complaints')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ accused_id: PASSENGER_ID, category: 'other', description: 'me' });

    expect(res.status).toBe(422);
    expect(res.body.status).toBe('error');
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
