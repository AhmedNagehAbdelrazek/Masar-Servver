"use strict";
const { getAgent } = require('../setup/setup');
const { User, NotificationSetting } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { NOTIFICATION_TYPE } = require('../../config/constants');
const USER_ID = '550e8400-e29b-41d4-a716-446655440n01';
let userToken;
beforeEach(async () => {
    await NotificationSetting.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: USER_ID }, force: true });
    await User.create({
        id: USER_ID,
        fullName: 'Settings Test User',
        phone: '+962710000n01',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    userToken = generateAccessToken({ id: USER_ID, role: 'passenger' });
});
describe('US3 - Notification settings', () => {
    it('returns all types with defaults when no settings exist', async () => {
        const res = await getAgent()
            .get('/api/settings/notifications')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.settings).toBeDefined();
        expect(Array.isArray(res.body.settings)).toBe(true);
        expect(res.body.settings.length).toBe(Object.values(NOTIFICATION_TYPE).length);
        const allEnabled = res.body.settings.every((s) => s.enabled_in_app === true && s.enabled_push === true);
        expect(allEnabled).toBe(true);
    });
    it('updates specific notification types', async () => {
        const res = await getAgent()
            .put('/api/settings/notifications')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
            settings: [
                { type: 'trip_cancelled', enabled_in_app: true, enabled_push: false },
                { type: 'new_message', enabled_in_app: false, enabled_push: true },
            ],
        });
        expect(res.status).toBe(200);
        expect(res.body.updated_count).toBe(2);
        const getRes = await getAgent()
            .get('/api/settings/notifications')
            .set('Authorization', `Bearer ${userToken}`);
        const tripCancelled = getRes.body.settings.find((s) => s.type === 'trip_cancelled');
        expect(tripCancelled.enabled_in_app).toBe(true);
        expect(tripCancelled.enabled_push).toBe(false);
        const newMessage = getRes.body.settings.find((s) => s.type === 'new_message');
        expect(newMessage.enabled_in_app).toBe(false);
        expect(newMessage.enabled_push).toBe(true);
        const others = getRes.body.settings.filter((s) => s.type !== 'trip_cancelled' && s.type !== 'new_message');
        expect(others.every((s) => s.enabled_in_app === true && s.enabled_push === true)).toBe(true);
    });
    it('returns updated_count 0 for empty settings array', async () => {
        const res = await getAgent()
            .put('/api/settings/notifications')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ settings: [] });
        expect(res.status).toBe(422);
    });
    it('rejects invalid notification type', async () => {
        const res = await getAgent()
            .put('/api/settings/notifications')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
            settings: [{ type: 'nonexistent_type', enabled_in_app: true }],
        });
        expect(res.status).toBe(422);
    });
    it('returns 401 without auth token', async () => {
        const res = await getAgent()
            .get('/api/settings/notifications');
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=notificationSettings.test.js.map