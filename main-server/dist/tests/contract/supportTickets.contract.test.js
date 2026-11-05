"use strict";
const { getAgent } = require('../setup/setup');
const { User, SupportTicket, SupportTicketMessage } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const PASSENGER_ID = 'f8000000-0000-4000-8000-000000000001';
const STAFF_ID = 'f8000000-0000-4000-8000-000000000002';
const PASSENGER_PHONE = '+962795101101';
const STAFF_PHONE = '+962795101102';
let passengerToken;
let staffToken;
beforeEach(async () => {
    await SupportTicketMessage.destroy({ where: {}, force: true });
    await SupportTicket.destroy({ where: {}, force: true });
    await User.destroy({ where: { phone: [PASSENGER_PHONE, STAFF_PHONE] }, force: true });
    await User.create({
        id: PASSENGER_ID,
        fullName: 'Contract Ticket User',
        phone: PASSENGER_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: STAFF_ID,
        fullName: 'Contract Ticket Staff',
        phone: STAFF_PHONE,
        countryCode: 'JO',
        role: 'support',
        passwordHash: 'hashed',
        isVerified: true,
    });
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    staffToken = generateAccessToken({ id: STAFF_ID, role: 'support' });
});
async function createTicket() {
    const res = await getAgent()
        .post('/api/support-tickets')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
        category: 'payment_issue',
        subject: 'Double charged',
        description: 'I was charged twice for the same ride.',
    });
    expect(res.status).toBe(201);
    return res.body.support_ticket.id;
}
describe('US5 Contract - Support Tickets', () => {
    it('POST /api/support-tickets returns support_ticket envelope with TKT reference code', async () => {
        const res = await getAgent()
            .post('/api/support-tickets')
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({
            category: 'general',
            subject: 'Question about the app',
            description: 'How do favorites work?',
            priority: 'low',
        });
        expect(res.status).toBe(201);
        expect(res.body.support_ticket).toMatchObject({
            category: 'general',
            subject: 'Question about the app',
            status: 'open',
            priority: 'low',
        });
        expect(res.body.support_ticket.reference_code).toMatch(/^TKT-[A-Z0-9]{6}$/);
    });
    it('GET /api/support-tickets returns data + pagination envelope', async () => {
        await createTicket();
        const res = await getAgent()
            .get('/api/support-tickets')
            .set('Authorization', `Bearer ${passengerToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.data[0]).toHaveProperty('reference_code');
    });
    it('GET /api/support-tickets/:ticket_id returns messages array', async () => {
        const ticketId = await createTicket();
        await getAgent()
            .post(`/api/support-tickets/${ticketId}/messages`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ message: 'Additional details here.' });
        const res = await getAgent()
            .get(`/api/support-tickets/${ticketId}`)
            .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(200);
        expect(res.body.support_ticket.id).toBe(ticketId);
        expect(res.body.support_ticket.messages.length).toBe(1);
        expect(res.body.support_ticket.messages[0].message).toBe('Additional details here.');
    });
    it('PUT /api/support-tickets/:ticket_id/status updates lifecycle (staff only)', async () => {
        const ticketId = await createTicket();
        const denied = await getAgent()
            .put(`/api/support-tickets/${ticketId}/status`)
            .set('Authorization', `Bearer ${passengerToken}`)
            .send({ status: 'resolved' });
        expect(denied.status).toBe(403);
        const res = await getAgent()
            .put(`/api/support-tickets/${ticketId}/status`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ status: 'resolved' });
        expect(res.status).toBe(200);
        expect(res.body.support_ticket.status).toBe('resolved');
    });
    it('POST /api/support-tickets/:ticket_id/messages returns ticket_message envelope', async () => {
        const ticketId = await createTicket();
        const res = await getAgent()
            .post(`/api/support-tickets/${ticketId}/messages`)
            .set('Authorization', `Bearer ${staffToken}`)
            .send({ message: 'Staff reply.' });
        expect(res.status).toBe(201);
        expect(res.body.ticket_message).toMatchObject({
            ticket_id: ticketId,
            message: 'Staff reply.',
        });
    });
});
//# sourceMappingURL=supportTickets.contract.test.js.map