const { getAgent } = require('../setup/setup');
const { User } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const ADMIN_ID = 'a6000000-0000-4000-8000-000000000001';
let adminToken;

beforeAll(async () => {
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  await User.destroy({ where: {}, force: true });
  await User.bulkCreate([
    { id: ADMIN_ID, fullName: 'Admin', phone: '+962700006001', role: 'admin', passwordHash: 'x', isVerified: true },
    {
      id: 'a6000000-0000-4000-8000-000000000002', fullName: 'Driver Row', phone: '+962780006002',
      role: 'driver', passwordHash: 'x', isVerified: true, verificationStatus: 'approved',
      status: 'active', avgRating: 4.5,
    },
  ]);
});

describe('Contract: GET /api/admin/dashboard/drivers', () => {
  it('list rows expose exactly the documented keys with derived account_status enum', async () => {
    const res = await getAgent()
      .get('/api/admin/dashboard/drivers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const row of res.body.data) {
      expect(Object.keys(row).sort()).toEqual([
        'account_status', 'avg_rating', 'balance', 'id', 'name',
        'phone', 'registration_date', 'total_trips',
      ]);
      expect(['active', 'suspended', 'pending', 'blocked']).toContain(row.account_status);
    }
    expect(res.body.pagination).toEqual({
      page: expect.any(Number), limit: expect.any(Number),
      total: expect.any(Number), total_pages: expect.any(Number),
    });
  });

  it('invalid filter values fail validation (422)', async () => {
    const res = await getAgent()
      .get('/api/admin/dashboard/drivers?status=ghost')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(422);
  });
});

describe('Contract: GET /api/admin/dashboard/drivers/stats/summary', () => {
  it('returns exactly the four stat-card keys', async () => {
    const res = await getAgent()
      .get('/api/admin/dashboard/drivers/stats/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([
      'active_drivers', 'pending_drivers', 'suspended_drivers', 'total_drivers',
    ]);
  });
});
