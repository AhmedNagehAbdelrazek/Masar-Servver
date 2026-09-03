"use strict";
const { getAgent } = require('../setup/setup');
const { User } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = 'a2000000-0000-4000-8000-000000000001';
let adminToken;
const DRIVERS = [
    { id: 'a2000000-0000-4000-8000-000000000010', fullName: 'Ahmad Ali', phone: '+962730000001', verificationStatus: 'approved', status: 'active', avgRating: 4.9, createdat: new Date('2026-01-15T10:00:00Z') },
    { id: 'a2000000-0000-4000-8000-000000000011', fullName: 'Basem Khaled', phone: '+962740000002', verificationStatus: 'pending', status: 'active', avgRating: 3.0, createdat: new Date('2026-03-20T10:00:00Z') },
    { id: 'a2000000-0000-4000-8000-000000000012', fullName: 'Cyril Sami', phone: '+962750000003', verificationStatus: 'approved', status: 'suspended', avgRating: 4.1, createdat: new Date('2026-05-10T10:00:00Z') },
    { id: 'a2000000-0000-4000-8000-000000000013', fullName: 'Diana Hassan', phone: '+962760000004', verificationStatus: 'approved', status: 'banned', avgRating: 2.2, createdat: new Date('2026-07-01T10:00:00Z') },
];
async function cleanAndSeed() {
    await User.destroy({ where: {}, force: true });
    await User.bulkCreate(DRIVERS.map((d) => ({
        ...d, role: 'driver', passwordHash: 'x', isVerified: d.verificationStatus === 'approved',
        createdat: d.createdat, updatedat: d.createdat,
    })));
}
beforeAll(async () => {
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});
beforeEach(cleanAndSeed);
describe('GET /api/admin/dashboard/drivers â€” directory', () => {
    it('searches by partial name (case-insensitive)', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/drivers?search=ahm')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Ahmad Ali');
        expect(res.body.data[0]).toMatchObject({
            account_status: 'active',
            avg_rating: 4.9,
            total_trips: 0,
            balance: 0,
        });
        expect(res.body.data[0].registration_date).toBeTruthy();
    });
    it('searches by partial phone number', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/drivers?search=74000000')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].id).toBe(DRIVERS[1].id);
    });
    it.each([
        ['active', 'Ahmad Ali'],
        ['pending', 'Basem Khaled'],
        ['suspended', 'Cyril Sami'],
        ['blocked', 'Diana Hassan'],
    ])('filters by derived status %s', async (status, expectedName) => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers?status=${status}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe(expectedName);
        expect(res.body.data[0].account_status).toBe(status);
    });
    it('filters by inclusive registration date range and combines with AND semantics', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/drivers?registration_from=2026-03-01&registration_to=2026-05-31&search=basem')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toBe('Basem Khaled');
    });
    it('sorts by full_name ascending and avg_rating descending', async () => {
        const asc = await getAgent()
            .get('/api/admin/dashboard/drivers?sort_by=full_name&sort_order=asc')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(asc.body.data.map((d) => d.name)).toEqual(['Ahmad Ali', 'Basem Khaled', 'Cyril Sami', 'Diana Hassan']);
        const desc = await getAgent()
            .get('/api/admin/dashboard/drivers?sort_by=avg_rating&sort_order=desc')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(desc.body.data[0].name).toBe('Ahmad Ali');
    });
    it('paginates and returns empty rows past the end with correct meta', async () => {
        const page1 = await getAgent()
            .get('/api/admin/dashboard/drivers?page=1&limit=3')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(page1.body.data).toHaveLength(3);
        expect(page1.body.pagination).toMatchObject({ page: 1, limit: 3, total: 4, total_pages: 2 });
        const page3 = await getAgent()
            .get('/api/admin/dashboard/drivers?page=3&limit=3')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(page3.body.data).toEqual([]);
        expect(page3.body.pagination.total).toBe(4);
    });
});
describe('GET /api/admin/dashboard/drivers/stats/summary â€” platform-wide cards', () => {
    it('returns the four platform-wide buckets', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/drivers/stats/summary')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            total_drivers: 4,
            active_drivers: 1,
            suspended_drivers: 1,
            pending_drivers: 1,
        });
    });
    it('ignores any filters applied to the drivers list (clarification Q4)', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/drivers/stats/summary?status=blocked&search=diana&page=2')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.total_drivers).toBe(4);
        expect(res.body.active_drivers).toBe(1);
    });
});
//# sourceMappingURL=adminDashboardDrivers.test.js.map