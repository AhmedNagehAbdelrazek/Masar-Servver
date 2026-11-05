"use strict";
const { getAgent } = require('../setup/setup');
const { User, Penalty } = require('../../Models');
const { USER_STATUS, PENALTY_TYPES } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const DRIVER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
let driverToken;
beforeEach(async () => {
    await Penalty.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: DRIVER_ID }, force: true });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Contract Driver',
        phone: '+962798888888',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        status: USER_STATUS.SUSPENDED,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
describe('US4 Contract - Driver Penalties', () => {
    it('GET /api/driver/penalties returns paginated penalty envelope', async () => {
        await Penalty.create({
            userId: DRIVER_ID,
            type: PENALTY_TYPES.SUSPENSION,
            reason: 'Two no-show incidents',
            startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            issuedBy: DRIVER_ID,
        });
        const res = await getAgent()
            .get('/api/driver/penalties')
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        const p = res.body.data[0];
        expect(p.id).toBeDefined();
        expect(p.type).toBe(PENALTY_TYPES.SUSPENSION);
        expect(p.reason).toBe('Two no-show incidents');
        expect(p.starts_at).toBeDefined();
        expect(p.ends_at).toBeDefined();
        expect(p.is_appealed).toBe(false);
        expect(p.enforcement_state).toBe(USER_STATUS.SUSPENDED);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(20);
        expect(res.body.pagination.total).toBe(1);
        expect(res.body.pagination.total_pages).toBe(1);
    });
    it('422 returns details array for invalid active filter', async () => {
        const res = await getAgent()
            .get('/api/driver/penalties')
            .query({ active: 'maybe' })
            .set('Authorization', `Bearer ${driverToken}`);
        expect(res.status).toBe(422);
        expect(res.body.status).toBe('error');
        expect(typeof res.body.message).toBe('string');
        expect(Array.isArray(res.body.details)).toBe(true);
        expect(res.body.code).toBe('VALIDATION_ERROR');
    });
});
//# sourceMappingURL=penalties.contract.test.js.map