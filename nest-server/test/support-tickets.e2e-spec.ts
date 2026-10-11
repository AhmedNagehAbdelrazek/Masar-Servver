// Support tickets: create/list/detail/messages/staff updates/status flow.
// 1:1 port of Main Server/tests/integration/supportTickets.test.js (Wave 6.3).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const PASSENGER_ID = 'f7000000-0000-4000-8000-000000000001';
const OTHER_ID = 'f7000000-0000-4000-8000-000000000002';
const STAFF_ID = 'f7000000-0000-4000-8000-000000000003';
const ADMIN_ID = 'f7000000-0000-4000-8000-000000000004';
const DRIVER_ID = 'f7000000-0000-4000-8000-000000000005';
const VEHICLE_ID = 'f7000000-0000-4000-8000-000000000010';

describe('US5 - creating support tickets', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let otherToken: string;
  let staffToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const users = [
      { id: PASSENGER_ID, fullName: 'Ticket Passenger', phone: '+962795091101', role: 'passenger' },
      { id: OTHER_ID, fullName: 'Ticket Other', phone: '+962795091102', role: 'passenger' },
      { id: STAFF_ID, fullName: 'Ticket Staff', phone: '+962795091103', role: 'support' },
      { id: ADMIN_ID, fullName: 'Ticket Admin', phone: '+962795091104', role: 'admin' },
      { id: DRIVER_ID, fullName: 'Ticket Driver', phone: '+962795091105', role: 'driver' },
    ];
    for (const u of users) {
      await ctx.prisma.user.create({
        data: {
          id: u.id,
          fullName: u.fullName,
          phone: u.phone,
          countryCode: 'JO',
          role: u.role as 'passenger' | 'support' | 'admin' | 'driver',
          passwordHash: 'hashed',
          isVerified: true,
        },
      });
    }
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
    otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });
    staffToken = generateAccessToken({ id: STAFF_ID, role: 'support' });
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
  });

  async function createBookingForPassenger(): Promise<{ id: string }> {
    const plan = await ctx.prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        periodDays: 30,
        percentageCut: 8,
        cost: 100,
        features: [],
        isFree: false,
        isActive: true,
      },
    });
    const now = new Date();
    await ctx.prisma.driverSubscription.create({
      data: {
        driverId: DRIVER_ID,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance: 100,
        paymentMethod: { name: 'Bank of Jordan', account_number: 'JO94BOJX0000000000', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
    const vehicle = await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'TKT-V-1',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: vehicle.id,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 3600 * 1000),
        totalSeats: 3,
        availableSeats: 3,
        farePerSeat: 10,
        isRecurring: false,
        genderPreference: 'all',
        status: 'published',
      },
    });
    return ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatNumber: 2,
        seatsBooked: 1,
        agreedFare: 10,
        status: 'confirmed',
        paymentStatus: 'pending',
        referenceCode: `MSR-TKT${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      },
    });
  }

  function createTicket(token: string, overrides: Record<string, unknown> = {}) {
    return ctx.agent
      .post('/api/support-tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'booking_issue',
        subject: 'Driver never showed up',
        description: 'I waited at pickup point for 40 minutes.',
        ...overrides,
      });
  }

  it('should create a ticket with a unique TKT reference code', async () => {
    const res = await createTicket(passengerToken);

    expect(res.status).toBe(201);
    expect(res.body.support_ticket.reference_code).toMatch(/^TKT-[A-Z0-9]{6}$/);
    expect(res.body.support_ticket.status).toBe('open');
    expect(res.body.support_ticket.priority).toBe('medium');
    expect(res.body.support_ticket.user_id).toBe(PASSENGER_ID);
  });

  it('should accept an optional priority and linked booking', async () => {
    const booking = await createBookingForPassenger();
    const res = await createTicket(passengerToken, {
      priority: 'urgent',
      booking_id: booking.id,
    });

    expect(res.status).toBe(201);
    expect(res.body.support_ticket.priority).toBe('urgent');
    expect(res.body.support_ticket.booking_id).toBe(booking.id);
  });

  it('should reject a ticket referencing an unknown booking', async () => {
    const res = await createTicket(passengerToken, {
      booking_id: 'f7000000-0000-4000-8000-000000000099',
    });

    expect(res.status).toBe(404);
  });

  it('should validate required fields', async () => {
    const res = await ctx.agent
      .post('/api/support-tickets')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ category: 'booking_issue' });

    expect(res.status).toBe(422);
  });

  it('should reject unauthenticated creation', async () => {
    const res = await ctx.agent
      .post('/api/support-tickets')
      .send({ category: 'x', subject: 'y', description: 'z' });

    expect(res.status).toBe(401);
  });

  describe('US5 - listing tickets', () => {
    beforeEach(async () => {
      await createTicket(passengerToken);
    });

    it('should show passengers only their own tickets', async () => {
      const mine = await ctx.agent
        .get('/api/support-tickets')
        .set('Authorization', `Bearer ${passengerToken}`);
      expect(mine.status).toBe(200);
      expect(mine.body.data.length).toBe(1);

      const others = await ctx.agent
        .get('/api/support-tickets')
        .set('Authorization', `Bearer ${otherToken}`);
      expect(others.status).toBe(200);
      expect(others.body.data.length).toBe(0);
    });

    it('should show staff all tickets', async () => {
      const res = await ctx.agent
        .get('/api/support-tickets')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].user_name).toBe('Ticket Passenger');
    });

    it('should filter by status', async () => {
      const res = await ctx.agent
        .get('/api/support-tickets?status=resolved')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('US5 - ticket detail and messages', () => {
    let ticketId: string;

    beforeEach(async () => {
      const res = await createTicket(passengerToken);
      ticketId = (res.body.support_ticket as Record<string, unknown>).id as string;
    });

    it('should return detail with messages for the owner', async () => {
      const res = await ctx.agent
        .get(`/api/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.support_ticket.id).toBe(ticketId);
      expect(Array.isArray(res.body.support_ticket.messages)).toBe(true);
    });

    it('should allow staff to view any ticket', async () => {
      const res = await ctx.agent
        .get(`/api/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
    });

    it('should forbid another passenger from viewing', async () => {
      const res = await ctx.agent
        .get(`/api/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('should let the owner add a message', async () => {
      const res = await ctx.agent
        .post(`/api/support-tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ message: 'Any update on this?' });

      expect(res.status).toBe(201);
      expect(res.body.ticket_message.message).toBe('Any update on this?');
      expect(res.body.ticket_message.sender_name).toBe('Ticket Passenger');

      const detail = await ctx.agent
        .get(`/api/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${passengerToken}`);
      expect(detail.body.support_ticket.messages.length).toBe(1);
    });

    it('should let staff reply to the ticket', async () => {
      const res = await ctx.agent
        .post(`/api/support-tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ message: 'We are looking into it.' });

      expect(res.status).toBe(201);
      expect(res.body.ticket_message.sender_role).toBe('support');
    });

    it('should forbid an unrelated user from replying', async () => {
      const res = await ctx.agent
        .post(`/api/support-tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ message: 'spam' });

      expect(res.status).toBe(403);
    });

    it('should validate empty messages', async () => {
      const res = await ctx.agent
        .post(`/api/support-tickets/${ticketId}/messages`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('US5 - staff updates and status flow', () => {
    let ticketId: string;

    beforeEach(async () => {
      const res = await createTicket(passengerToken);
      ticketId = (res.body.support_ticket as Record<string, unknown>).id as string;
    });

    it('should let staff assign, prioritize, and add resolution notes', async () => {
      const res = await ctx.agent
        .put(`/api/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          assigned_to: STAFF_ID,
          priority: 'high',
          resolution_notes: 'Contacted the driver, refund issued.',
        });

      expect(res.status).toBe(200);
      expect(res.body.support_ticket.assigned_to).toBe(STAFF_ID);
      expect(res.body.support_ticket.priority).toBe('high');
      expect(res.body.support_ticket.resolution_notes).toContain('refund');
    });

    it('should forbid passengers from staff updates', async () => {
      const res = await ctx.agent
        .put(`/api/support-tickets/${ticketId}`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ priority: 'low' });

      expect(res.status).toBe(403);
    });

    it('should move a ticket through the status lifecycle', async () => {
      const inProgress = await ctx.agent
        .put(`/api/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' });
      expect(inProgress.status).toBe(200);
      expect(inProgress.body.support_ticket.status).toBe('in_progress');

      const resolved = await ctx.agent
        .put(`/api/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'resolved' });
      expect(resolved.body.support_ticket.status).toBe('resolved');

      const closed = await ctx.agent
        .put(`/api/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'closed' });
      expect(closed.body.support_ticket.status).toBe('closed');

      const reopen = await ctx.agent
        .put(`/api/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'open' });
      expect(reopen.status).toBe(409);
    });

    it('should reject invalid status values', async () => {
      const res = await ctx.agent
        .put(`/api/support-tickets/${ticketId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'archived' });

      expect(res.status).toBe(422);
    });

    it('should return 404 for unknown tickets on every route', async () => {
      const fakeId = 'f7000000-0000-4000-8000-000000000088';

      const detail = await ctx.agent
        .get(`/api/support-tickets/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(detail.status).toBe(404);

      const update = await ctx.agent
        .put(`/api/support-tickets/${fakeId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'open' });
      expect(update.status).toBe(404);

      const message = await ctx.agent
        .post(`/api/support-tickets/${fakeId}/messages`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ message: 'hi' });
      expect(message.status).toBe(404);
    });
  });
});
