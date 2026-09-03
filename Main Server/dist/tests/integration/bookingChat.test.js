"use strict";
const { getAgent } = require('../setup/setup');
const { startSocketServer, stopSocketServer, connectSocket, connect, waitFor, emitWithAck, } = require('../setup/socket');
const { User, Vehicle, Trip, TripSeat, Booking, Message, SubscriptionPlan, DriverSubscription, SupportTicket, SupportTicketMessage, } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const DRIVER_PHONE = '+962795557001';
const PASSENGER1_PHONE = '+962795557002';
const PASSENGER2_PHONE = '+962795557003';
const DRIVER_ID = 'b2000000-0000-4000-8000-000000000001';
const PASSENGER1_ID = 'b2000000-0000-4000-8000-000000000002';
const PASSENGER2_ID = 'b2000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'b2000000-0000-4000-8000-000000000010';
let driverToken;
let passenger1Token;
let passenger2Token;
let tripId;
let bookingId;
function getFutureDate(daysAhead = 1) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
}
async function openSocket(token) {
    const socket = connectSocket(token);
    await connect(socket);
    return socket;
}
beforeAll(async () => {
    await startSocketServer();
});
afterAll(async () => {
    await stopSocketServer();
});
beforeEach(async () => {
    await SupportTicketMessage.destroy({ where: {}, force: true });
    await SupportTicket.destroy({ where: {}, force: true });
    await Message.destroy({ where: {}, force: true });
    await Booking.destroy({ where: {}, force: true });
    await TripSeat.destroy({ where: {}, force: true });
    await Trip.destroy({ where: {}, force: true });
    await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
    await Vehicle.destroy({ where: {}, force: true });
    await User.destroy({ where: { phone: [DRIVER_PHONE, PASSENGER1_PHONE, PASSENGER2_PHONE] }, force: true });
    await User.create({
        id: DRIVER_ID,
        fullName: 'Chat Driver',
        phone: DRIVER_PHONE,
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: PASSENGER1_ID,
        fullName: 'Chat Passenger 1',
        phone: PASSENGER1_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await User.create({
        id: PASSENGER2_ID,
        fullName: 'Chat Passenger 2',
        phone: PASSENGER2_PHONE,
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    await Vehicle.create({
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'CHT-101',
        color: 'White',
        seats: 4,
        isVerified: true,
    });
    driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
    passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });
    const plan = await SubscriptionPlan.create({
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 100,
        features: [],
        isFree: false,
        isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: SUBSCRIPTION_STATUS.ACTIVE,
        approvedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await User.update({ totalBalance: 100, isInDebt: false }, { where: { id: DRIVER_ID } });
    const tripRes = await getAgent()
        .post('/api/trips')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_date: getFutureDate(1),
        departure_time: '15:00',
        type_of_trip: 'once',
        fare_per_seat: '20.00',
        seats: [
            { seat_number: 1, type: 'driver' },
            { seat_number: 2, type: 'available' },
            { seat_number: 3, type: 'available' },
            { seat_number: 4, type: 'unavailable' },
        ],
    });
    expect(tripRes.status).toBe(201);
    tripId = tripRes.body.trip_id;
    await getAgent()
        .post(`/api/trips/${tripId}/seats/lock`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ seat_number: 2 });
    const bookingRes = await getAgent()
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({
        trip_id: tripId,
        seat_number: 2,
        agreed_fare: '20.00',
    });
    expect(bookingRes.status).toBe(201);
    bookingId = bookingRes.body.booking.id;
});
describe('Booking chat (driver <-> passenger)', () => {
    it('delivers a booking message between the two chat parties in realtime', async () => {
        const driverSocket = await openSocket(driverToken);
        const passengerSocket = await openSocket(passenger1Token);
        const joinDriver = await emitWithAck(driverSocket, 'chat:join', { booking_id: bookingId });
        expect(joinDriver.status).toBe('ok');
        expect(joinDriver.data.room).toBe(`booking:${bookingId}`);
        const joinPassenger = await emitWithAck(passengerSocket, 'chat:join', { booking_id: bookingId });
        expect(joinPassenger.status).toBe('ok');
        const receivePromise = waitFor(driverSocket, 'chat:receive');
        const sendAck = await emitWithAck(passengerSocket, 'chat:send', {
            booking_id: bookingId,
            message: 'See you at the pickup point',
        });
        expect(sendAck.status).toBe('ok');
        expect(sendAck.data.id).toBeDefined();
        const received = await receivePromise;
        expect(received.booking_id).toBe(bookingId);
        expect(received.support_ticket_id).toBeNull();
        expect(received.message).toBe('See you at the pickup point');
        expect(received.sender_id).toBe(PASSENGER1_ID);
        driverSocket.disconnect();
        passengerSocket.disconnect();
    });
    it('rejects users without a booking on the trip', async () => {
        const outsiderSocket = await openSocket(passenger2Token);
        const joinAck = await emitWithAck(outsiderSocket, 'chat:join', { booking_id: bookingId });
        expect(joinAck.status).toBe('error');
        expect(joinAck.code).toBe('FORBIDDEN');
        const sendAck = await emitWithAck(outsiderSocket, 'chat:send', {
            booking_id: bookingId,
            message: 'hello?',
        });
        expect(sendAck.status).toBe('error');
        expect(sendAck.code).toBe('FORBIDDEN');
        outsiderSocket.disconnect();
        const res = await getAgent()
            .get(`/api/chat/bookings/${bookingId}/messages`)
            .set('Authorization', `Bearer ${passenger2Token}`);
        expect(res.status).toBe(403);
    });
    it('requires a confirmed booking to participate', async () => {
        const booking = await Booking.findByPk(bookingId);
        await booking.update({ status: 'pending' });
        const passengerSocket = await openSocket(passenger1Token);
        const sendAck = await emitWithAck(passengerSocket, 'chat:send', {
            booking_id: bookingId,
            message: 'still valid?',
        });
        expect(sendAck.status).toBe('error');
        expect(sendAck.code).toBe('FORBIDDEN');
        passengerSocket.disconnect();
    });
    it('closes the live chat once the trip completes but keeps history readable', async () => {
        const passengerSocket = await openSocket(passenger1Token);
        const driverSocket = await openSocket(driverToken);
        await emitWithAck(passengerSocket, 'chat:join', { booking_id: bookingId });
        await emitWithAck(driverSocket, 'chat:join', { booking_id: bookingId });
        await emitWithAck(passengerSocket, 'chat:send', {
            booking_id: bookingId,
            message: 'before completion',
        });
        const trip = await Trip.findByPk(tripId);
        await trip.update({ status: 'completed' });
        const sendAck = await emitWithAck(passengerSocket, 'chat:send', {
            booking_id: bookingId,
            message: 'too late?',
        });
        expect(sendAck.status).toBe('error');
        expect(sendAck.code).toBe('FORBIDDEN');
        const joinAck = await emitWithAck(passengerSocket, 'chat:join', { booking_id: bookingId });
        expect(joinAck.status).toBe('error');
        expect(joinAck.code).toBe('FORBIDDEN');
        const history = await getAgent()
            .get(`/api/chat/bookings/${bookingId}/messages`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(history.status).toBe(200);
        expect(history.body.data).toHaveLength(1);
        expect(history.body.data[0].message).toBe('before completion');
        expect(history.body.data[0].booking_id).toBe(bookingId);
        passengerSocket.disconnect();
        driverSocket.disconnect();
    });
    it('closes the live chat once the trip is cancelled', async () => {
        const trip = await Trip.findByPk(tripId);
        await trip.update({ status: 'cancelled' });
        const driverSocket = await openSocket(driverToken);
        const joinAck = await emitWithAck(driverSocket, 'chat:join', { booking_id: bookingId });
        expect(joinAck.status).toBe('error');
        expect(joinAck.code).toBe('FORBIDDEN');
        driverSocket.disconnect();
    });
    it('broadcasts read receipts to the booking room', async () => {
        const driverSocket = await openSocket(driverToken);
        const passengerSocket = await openSocket(passenger1Token);
        await emitWithAck(driverSocket, 'chat:join', { booking_id: bookingId });
        await emitWithAck(passengerSocket, 'chat:join', { booking_id: bookingId });
        await emitWithAck(passengerSocket, 'chat:send', {
            booking_id: bookingId,
            message: 'please confirm',
        });
        const ackPromise = waitFor(passengerSocket, 'chat:read_ack');
        const readAck = await emitWithAck(driverSocket, 'chat:read', { booking_id: bookingId });
        expect(readAck.status).toBe('ok');
        const receipt = await ackPromise;
        expect(receipt.booking_id).toBe(bookingId);
        expect(receipt.read_by).toBe(DRIVER_ID);
        const unread = await Message.findAll({ where: { bookingId, senderId: PASSENGER1_ID } });
        expect(unread).toHaveLength(1);
        expect(unread[0].isRead).toBe(true);
        driverSocket.disconnect();
        passengerSocket.disconnect();
    });
    it('returns paginated history for both chat parties only', async () => {
        await Message.create({
            senderId: PASSENGER1_ID,
            bookingId,
            message: 'hi driver',
            messageType: 'text',
        });
        await Message.create({
            senderId: DRIVER_ID,
            bookingId,
            message: 'hello passenger',
            messageType: 'text',
        });
        for (const token of [passenger1Token, driverToken]) {
            const res = await getAgent()
                .get(`/api/chat/bookings/${bookingId}/messages`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.pagination.total).toBe(2);
            const messages = res.body.data.map((m) => m.message);
            expect(messages).toContain('hi driver');
            expect(messages).toContain('hello passenger');
        }
    });
});
describe('Support ticket chat (user <-> support team)', () => {
    async function createTicket(token) {
        const res = await getAgent()
            .post('/api/support-tickets')
            .set('Authorization', `Bearer ${token}`)
            .send({
            category: 'general',
            subject: 'Need help with my account',
            description: 'I cannot access my bookings.',
        });
        expect(res.status).toBe(201);
        return res.body.support_ticket.id || res.body.id || res.body.ticket?.id;
    }
    it('lets both passengers and drivers open support chats regardless of trips', async () => {
        const passengerTicketId = await createTicket(passenger1Token);
        const driverTicketId = await createTicket(driverToken);
        expect(passengerTicketId).toBeDefined();
        expect(driverTicketId).toBeDefined();
        const passengerHistory = await getAgent()
            .get(`/api/chat/tickets/${passengerTicketId}/messages`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(passengerHistory.status).toBe(200);
        expect(passengerHistory.body.data).toEqual([]);
        const driverHistory = await getAgent()
            .get(`/api/chat/tickets/${driverTicketId}/messages`)
            .set('Authorization', `Bearer ${driverToken}`);
        expect(driverHistory.status).toBe(200);
        const passengerSocket = await openSocket(passenger1Token);
        const sendAck = await emitWithAck(passengerSocket, 'chat:send', {
            support_ticket_id: passengerTicketId,
            message: 'any update?',
        });
        expect(sendAck.status).toBe('ok');
        const history = await getAgent()
            .get(`/api/chat/tickets/${passengerTicketId}/messages`)
            .set('Authorization', `Bearer ${passenger1Token}`);
        expect(history.status).toBe(200);
        expect(history.body.data).toHaveLength(1);
        expect(history.body.data[0].support_ticket_id).toBe(passengerTicketId);
        passengerSocket.disconnect();
    });
    it('keeps support chat independent of the trip lifecycle', async () => {
        const ticketId = await createTicket(passenger1Token);
        const trip = await Trip.findByPk(tripId);
        await trip.update({ status: 'cancelled' });
        const passengerSocket = await openSocket(passenger1Token);
        const sendAck = await emitWithAck(passengerSocket, 'chat:send', {
            support_ticket_id: ticketId,
            message: 'trip cancelled, need a refund',
        });
        expect(sendAck.status).toBe('ok');
        passengerSocket.disconnect();
    });
});
//# sourceMappingURL=bookingChat.test.js.map