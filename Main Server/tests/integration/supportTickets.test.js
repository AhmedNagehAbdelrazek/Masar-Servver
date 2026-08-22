const { getAgent } = require('../setup/setup');
const {
  User,
  Booking,
  Trip,
  Vehicle,
  SubscriptionPlan,
  DriverSubscription,
  SupportTicket,
  SupportTicketMessage,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const PASSENGER_ID = 'f7000000-0000-4000-8000-000000000001';
const OTHER_ID = 'f7000000-0000-4000-8000-000000000002';
const STAFF_ID = 'f7000000-0000-4000-8000-000000000003';
const ADMIN_ID = 'f7000000-0000-4000-8000-000000000004';
const DRIVER_ID = 'f7000000-0000-4000-8000-000000000005';
const VEHICLE_ID = 'f7000000-0000-4000-8000-000000000010';

const PASSENGER_PHONE = '+962795091101';
const OTHER_PHONE = '+962795091102';
const STAFF_PHONE = '+962795091103';
const ADMIN_PHONE = '+962795091104';
const DRIVER_PHONE = '+962795091105';

let passengerToken;
let otherToken;
let staffToken;
let adminToken;

beforeEach(async () => {
  await SupportTicketMessage.destroy({ where: {}, force: true });
  await SupportTicket.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({
    where: { phone: [PASSENGER_PHONE, OTHER_PHONE, STAFF_PHONE, ADMIN_PHONE, DRIVER_PHONE] },
    force: true,
  });

  const users = [
    { id: PASSENGER_ID, fullName: 'Ticket Passenger', phone: PASSENGER_PHONE, role: 'passenger' },
    { id: OTHER_ID, fullName: 'Ticket Other', phone: OTHER_PHONE, role: 'passenger' },
    { id: STAFF_ID, fullName: 'Ticket Staff', phone: STAFF_PHONE, role: 'support' },
    { id: ADMIN_ID, fullName: 'Ticket Admin', phone: ADMIN_PHONE, role: 'admin' },
    { id: DRIVER_ID, fullName: 'Ticket Driver', phone: DRIVER_PHONE, role: 'driver' },
  ];
  for (const u of users) {
    await User.create({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      countryCode: 'JO',
      role: u.role,
      passwordHash: 'hashed',
      isVerified: true,
    });
  }

  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });
  staffToken = generateAccessToken({ id: STAFF_ID, role: 'support' });
  adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});

async function createBookingForPassenger() {
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

  const vehicle = await Vehicle.create({
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
  });
  const trip = await Trip.create({
    driverId: DRIVER_ID,
    vehicleId: vehicle.id,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    totalSeats: 3,
    availableSeats: 3,
    farePerSeat: 10,
    isRecurring: false,
    genderPreference: 'all',
    status: 'published',
  });
  return Booking.create({
    tripId: trip.id,
    passengerId: PASSENGER_ID,
    seatNumber: 2,
    seatsBooked: 1,
    agreedFare: 10,
    status: 'confirmed',
    paymentStatus: 'pending',
    referenceCode: 'MSR-TKT' + Math.random().toString(36).slice(2, 6).toUpperCase(),
  });
}

async function createTicket(token, overrides = {}) {
  return getAgent()
    .post('/api/support-tickets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      category: 'booking_issue',
      subject: 'Driver never showed up',
      description: 'I waited at pickup point for 40 minutes.',
      ...overrides,
    });
}

describe('US5 - creating support tickets', () => {
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
    const fakeBookingId = 'f7000000-0000-4000-8000-000000000099';
    const res = await createTicket(passengerToken, { booking_id: fakeBookingId });

    expect(res.status).toBe(404);
  });

  it('should validate required fields', async () => {
    const res = await getAgent()
      .post('/api/support-tickets')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ category: 'booking_issue' });

    expect(res.status).toBe(422);
  });

  it('should reject unauthenticated creation', async () => {
    const res = await getAgent()
      .post('/api/support-tickets')
      .send({ category: 'x', subject: 'y', description: 'z' });

    expect(res.status).toBe(401);
  });
});

describe('US5 - listing tickets', () => {
  let ticketId;

  beforeEach(async () => {
    const res = await createTicket(passengerToken);
    ticketId = res.body.support_ticket.id;
  });

  it('should show passengers only their own tickets', async () => {
    const mine = await getAgent()
      .get('/api/support-tickets')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.length).toBe(1);

    const others = await getAgent()
      .get('/api/support-tickets')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(others.status).toBe(200);
    expect(others.body.data.length).toBe(0);
  });

  it('should show staff all tickets', async () => {
    const res = await getAgent()
      .get('/api/support-tickets')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].user_name).toBe('Ticket Passenger');
  });

  it('should filter by status', async () => {
    const res = await getAgent()
      .get('/api/support-tickets?status=resolved')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

describe('US5 - ticket detail and messages', () => {
  let ticketId;

  beforeEach(async () => {
    const res = await createTicket(passengerToken);
    ticketId = res.body.support_ticket.id;
  });

  it('should return detail with messages for the owner', async () => {
    const res = await getAgent()
      .get(`/api/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.support_ticket.id).toBe(ticketId);
    expect(Array.isArray(res.body.support_ticket.messages)).toBe(true);
  });

  it('should allow staff to view any ticket', async () => {
    const res = await getAgent()
      .get(`/api/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
  });

  it('should forbid another passenger from viewing', async () => {
    const res = await getAgent()
      .get(`/api/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it('should let the owner add a message', async () => {
    const res = await getAgent()
      .post(`/api/support-tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ message: 'Any update on this?' });

    expect(res.status).toBe(201);
    expect(res.body.ticket_message.message).toBe('Any update on this?');
    expect(res.body.ticket_message.sender_name).toBe('Ticket Passenger');

    const detail = await getAgent()
      .get(`/api/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(detail.body.support_ticket.messages.length).toBe(1);
  });

  it('should let staff reply to the ticket', async () => {
    const res = await getAgent()
      .post(`/api/support-tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ message: 'We are looking into it.' });

    expect(res.status).toBe(201);
    expect(res.body.ticket_message.sender_role).toBe('support');
  });

  it('should forbid an unrelated user from replying', async () => {
    const res = await getAgent()
      .post(`/api/support-tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ message: 'spam' });

    expect(res.status).toBe(403);
  });

  it('should validate empty messages', async () => {
    const res = await getAgent()
      .post(`/api/support-tickets/${ticketId}/messages`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});

    expect(res.status).toBe(422);
  });
});

describe('US5 - staff updates and status flow', () => {
  let ticketId;

  beforeEach(async () => {
    const res = await createTicket(passengerToken);
    ticketId = res.body.support_ticket.id;
  });

  it('should let staff assign, prioritize, and add resolution notes', async () => {
    const res = await getAgent()
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
    const res = await getAgent()
      .put(`/api/support-tickets/${ticketId}`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ priority: 'low' });

    expect(res.status).toBe(403);
  });

  it('should move a ticket through the status lifecycle', async () => {
    const inProgress = await getAgent()
      .put(`/api/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });
    expect(inProgress.status).toBe(200);
    expect(inProgress.body.support_ticket.status).toBe('in_progress');

    const resolved = await getAgent()
      .put(`/api/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'resolved' });
    expect(resolved.body.support_ticket.status).toBe('resolved');

    const closed = await getAgent()
      .put(`/api/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'closed' });
    expect(closed.body.support_ticket.status).toBe('closed');

    const reopen = await getAgent()
      .put(`/api/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'open' });
    expect(reopen.status).toBe(409);
  });

  it('should reject invalid status values', async () => {
    const res = await getAgent()
      .put(`/api/support-tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'archived' });

    expect(res.status).toBe(422);
  });

  it('should return 404 for unknown tickets on every route', async () => {
    const fakeId = 'f7000000-0000-4000-8000-000000000088';

    const detail = await getAgent()
      .get(`/api/support-tickets/${fakeId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(detail.status).toBe(404);

    const update = await getAgent()
      .put(`/api/support-tickets/${fakeId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'open' });
    expect(update.status).toBe(404);

    const message = await getAgent()
      .post(`/api/support-tickets/${fakeId}/messages`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ message: 'hi' });
    expect(message.status).toBe(404);
  });
});
