"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, DriverProfile, UploadedImage, DocumentReview, Penalty, VerificationStatusChange, } = require('../../Models');
const { PENALTY_TYPES } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = 'a4000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a4000000-0000-4000-8000-000000000002';
const PASSENGER_ID = 'a4000000-0000-4000-8000-000000000003';
const IMG_ID = 9100;
let adminToken;
let driverToken;
async function cleanAll() {
    await DocumentReview.destroy({ where: {}, force: true });
    await Penalty.destroy({ where: {}, force: true });
    await VerificationStatusChange.destroy({ where: {}, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await DriverProfile.destroy({ where: {}, force: true });
    await UploadedImage.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
}
async function seedBase() {
    await User.bulkCreate([
        { id: ADMIN_ID, fullName: 'Admin', phone: '+962700004001', role: 'admin', passwordHash: 'x', isVerified: true },
        {
            id: DRIVER_ID, fullName: 'Action Driver', phone: '+962780004002', role: 'driver',
            passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active',
        },
        { id: PASSENGER_ID, fullName: 'Passenger', phone: '+962780004003', role: 'passenger', passwordHash: 'x', isVerified: true },
    ]);
}
async function seedUploadedImage() {
    await UploadedImage.create({
        id: IMG_ID, hash: `hash-action-${Date.now()}`, url: 'http://img/id.jpg',
        filename: 'id.jpg', mimetype: 'image/jpeg',
    });
}
beforeAll(async () => {
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});
describe('POST /api/admin/dashboard/drivers/:driver_id/account-status â€” standing actions', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedBase();
    });
    it('suspend sets status and appends a suspension penalty to the account log', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'suspend', reason: 'Repeated complaints' });
        expect(res.status).toBe(200);
        expect(res.body.driver).toMatchObject({ id: DRIVER_ID, account_status: 'suspended' });
        const penalties = await Penalty.findAll({ where: { userId: DRIVER_ID } });
        expect(penalties).toHaveLength(1);
        expect(penalties[0]).toMatchObject({
            type: PENALTY_TYPES.SUSPENSION, issuedBy: ADMIN_ID, reason: 'Repeated complaints',
        });
        expect(penalties[0].endsAt).toBeNull();
    });
    it('reactivate returns the driver to active and closes open suspensions', async () => {
        await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'suspend' });
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'reactivate' });
        expect(res.status).toBe(200);
        expect(res.body.driver.account_status).toBe('active');
        const penalties = await Penalty.findAll({ where: { userId: DRIVER_ID } });
        expect(penalties[0].endsAt).not.toBeNull();
    });
    it('unblock works as an alias for reactivate (clarification Q1)', async () => {
        await User.update({ status: 'banned' }, { where: { id: DRIVER_ID } });
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'unblock' });
        expect(res.status).toBe(200);
        expect(res.body.driver.account_status).toBe('active');
        const driver = await User.findByPk(DRIVER_ID);
        expect(driver.status).toBe('active');
    });
    it('rejects no-op transitions with 409', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'suspend' });
        expect(res.status).toBe(200);
        const repeat = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'suspend' });
        expect(repeat.status).toBe(409);
    });
    it('rejects invalid actions with validation error', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ action: 'explode' });
        expect(res.status).toBe(422);
    });
});
describe('POST /api/admin/dashboard/drivers/:driver_id/status â€” direct writes', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedBase();
    });
    it.each([
        ['suspended', 'suspended', 'active'],
        ['blocked', 'blocked', 'active'],
        ['active', 'active', 'banned'],
    ])('writes %s into the single canonical status field (from %s)', async (requested, expected, from) => {
        await User.update({ status: from, verificationStatus: 'approved' }, { where: { id: DRIVER_ID } });
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: requested });
        expect(res.status).toBe(200);
        expect(res.body.driver.account_status).toBe(expected);
        const driver = await User.findByPk(DRIVER_ID);
        if (requested === 'blocked')
            expect(driver.status).toBe('banned');
        else
            expect(driver.status).toBe(requested);
    });
    it("'pending' flips verification flow and records a status change row", async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'pending' });
        expect(res.status).toBe(200);
        expect(res.body.driver.account_status).toBe('pending');
        const driver = await User.findByPk(DRIVER_ID);
        expect(driver.verificationStatus).toBe('pending');
        const changes = await VerificationStatusChange.findAll({ where: { driverId: DRIVER_ID } });
        expect(changes).toHaveLength(1);
        expect(changes[0]).toMatchObject({ fromStatus: 'approved', toStatus: 'pending', changedBy: ADMIN_ID });
    });
    it('rejects invalid values with 422 and unknown drivers with 404', async () => {
        const bad = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'ghost' });
        expect(bad.status).toBe(422);
        const missing = await getAgent()
            .post('/api/admin/dashboard/drivers/00000000-0000-4000-8000-000000000099/status')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ status: 'suspended' });
        expect(missing.status).toBe(404);
    });
});
describe('Document approve/reject â€” attribution & last-write-wins', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedBase();
        await seedUploadedImage();
        await DriverProfile.create({ driverId: DRIVER_ID, userIdentificationFront: IMG_ID });
    });
    it('rejects an uploaded document with an optional recorded reason', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/id_front/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ reason: 'ØµÙˆØ±Ø© ØºÙŠØ± ÙˆØ§Ø¶Ø­Ø©' });
        expect(res.status).toBe(200);
        expect(res.body.document).toMatchObject({
            key: 'id_front', status: 'rejected', decided_by: ADMIN_ID, reason: 'ØµÙˆØ±Ø© ØºÙŠØ± ÙˆØ§Ø¶Ø­Ø©',
        });
        const review = await DocumentReview.findOne({ where: { driverId: DRIVER_ID, documentKey: 'id_front' } });
        expect(review.decision).toBe('rejected');
        expect(review.decidedAt).not.toBeNull();
    });
    it('approve then re-reject: last confirmed action wins (upsert)', async () => {
        await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/id_front/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        const second = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/id_front/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({});
        expect(second.status).toBe(200);
        expect(second.body.document.status).toBe('rejected');
        const reviews = await DocumentReview.findAll({ where: { driverId: DRIVER_ID } });
        expect(reviews).toHaveLength(1);
    });
    it('documents tab reflects the decision on next read', async () => {
        await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/id_front/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents`)
            .set('Authorization', `Bearer ${adminToken}`);
        const idFront = res.body.personal_documents.find((d) => d.key === 'id_front');
        expect(idFront.status).toBe('approved');
    });
    it('rejects unknown document keys and unbacked documents without side effects', async () => {
        const unknown = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/passport/approve`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(unknown.status).toBe(400);
        const insurance = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents/insurance/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ reason: 'none' });
        expect(insurance.status).toBe(400);
        const reviews = await DocumentReview.findAll({ where: { driverId: DRIVER_ID } });
        expect(reviews).toHaveLength(0);
    });
});
describe('Dashboard action access control', () => {
    beforeEach(async () => {
        await cleanAll();
        await seedBase();
    });
    it('rejects driver tokens on mutations with 403', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/status`)
            .set('Authorization', `Bearer ${driverToken}`)
            .send({ status: 'suspended' });
        expect(res.status).toBe(403);
    });
    it('rejects anonymous mutations with 401', async () => {
        const res = await getAgent()
            .post(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-status`)
            .send({ action: 'suspend' });
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=adminDriverActions.test.js.map