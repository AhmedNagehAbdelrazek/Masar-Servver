"use strict";
const { getAgent } = require('../setup/setup');
const { User, Notification } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const USER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d81';
let token;
beforeEach(async () => {
    await Notification.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: USER_ID }, force: true });
    await User.create({
        id: USER_ID,
        fullName: 'Contract User',
        phone: '+962798888888',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await Notification.create({
        userId: USER_ID,
        type: 'TRIP_CANCELLED',
        title: 'Trip cancelled',
        body: 'Your trip Amman → Irbid was cancelled.',
        data: { tripId: 'abc' },
        isRead: false,
        sentVia: ['in_app'],
    });
    token = generateAccessToken({ id: USER_ID, role: 'passenger' });
});
describe('US8 Contract - Notifications', () => {
    it('GET /api/notifications returns envelope with data + pagination', async () => {
        const res = await getAgent()
            .get('/api/notifications')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            data: expect.any(Array),
            pagination: {
                page: 1,
                limit: 20,
                total: 1,
                total_pages: 1,
            },
        });
        expect(res.body.data[0]).toEqual({
            id: expect.any(String),
            type: 'TRIP_CANCELLED',
            title: 'Trip cancelled',
            body: 'Your trip Amman → Irbid was cancelled.',
            data: { tripId: 'abc' },
            is_read: false,
            created_at: expect.any(String),
        });
    });
    it('PUT /api/notifications/:id/read returns { notification: { id, is_read } }', async () => {
        const notification = await Notification.findOne({ where: { userId: USER_ID } });
        const res = await getAgent()
            .put(`/api/notifications/${notification.id}/read`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            notification: { id: notification.id, is_read: true },
        });
    });
});
//# sourceMappingURL=notifications.contract.test.js.map