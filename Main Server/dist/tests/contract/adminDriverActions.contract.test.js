"use strict";
const { getAgent } = require('../setup/setup');
const { User, DriverProfile } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = 'a8000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a8000000-0000-4000-8000-000000000002';
let adminToken;
beforeAll(async () => {
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    await User.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await User.bulkCreate([
        { id: ADMIN_ID, fullName: 'Admin', phone: '+962700008001', role: 'admin', passwordHash: 'x', isVerified: true },
        {
            id: DRIVER_ID, fullName: 'Action Contract', phone: '+962780008002', role: 'driver',
            passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active',
        },
    ]);
});
describe('Contract: action response shapes', () => {
    it('POST /status returns {driver:{id, account_status}}', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'suspended' });
        expect(res.status).toBe(200);
        expect(res.body.driver).toEqual({
            id: DRIVER_ID,
            account_status: expect.stringMatching(/^(active|suspended|pending|blocked)$/),
        });
    });
    it('POST /account-status returns the same shape (alias equivalence)', async () => {
        await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'reactivate' });
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'suspend' });
        expect(res.status).toBe(200);
        expect(res.body.driver).toHaveProperty('account_status');
    });
    it('document decisions return {document:{key,status,decided_by,decided_at}}', async () => {
        // No backing file â†’ documented 400 error envelope
        const missing = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/id_front/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(missing.status).toBe(400);
        expect(missing.body).toMatchObject({ status: 'error' });
        expect(typeof missing.body.message).toBe('string');
    });
    it('validation failures return 422 error envelope with details', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'nope' });
        expect(res.status).toBe(422);
        expect(res.body).toMatchObject({ status: 'error', code: 'VALIDATION_ERROR' });
    });
    it('conflicts return 409 with the already-in-state code', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'suspended' });
        expect(res.status).toBe(409);
        expect(res.body).toMatchObject({ status: 'error', code: 'CONFLICT' });
    });
});
//# sourceMappingURL=adminDriverActions.contract.test.js.map