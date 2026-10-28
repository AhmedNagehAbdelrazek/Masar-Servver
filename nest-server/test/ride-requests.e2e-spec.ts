// 1:1 port of Main Server/tests/integration/rideRequestFlow.test.js,
// rideRequestMatches.test.js and contract/rideRequests.contract.test.js
// (Wave 5.4).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER1_ID = 'd1000000-0000-4000-8000-000000000001';
const DRIVER2_ID = 'd1000000-0000-4000-8000-000000000002';
const PASSENGER1_ID = 'd1000000-0000-4000-8000-000000000003';
const PASSENGER2_ID = 'd1000000-0000-4000-8000-000000000004';
const VEHICLE_ID = 'd1000000-0000-4000-8000-000000000010';

function getFutureDate(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0] as string;
}

describe('Ride request board', () => {
  let ctx: TestContext;
  let driver1Token: string;
  let driver2Token: string;
  let passenger1Token: string;
  let passenger2Token: string;
  let tripId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    const users: [string, string, string, string][] = [
      [DRIVER1_ID, 'Board Driver One', '+962795571001', 'driver'],
      [DRIVER2_ID, 'Board Driver Two', '+962795571002', 'driver'],
      [PASSENGER1_ID, 'Board Passenger One', '+962795571003', 'passenger'],
      [PASSENGER2_ID, 'Board Passenger Two', '+962795571004', 'passenger'],
    ];
    for (const [id, fullName, phone, role] of users) {
      await ctx.prisma.user.create({
        data: { id, fullName, phone, countryCode: 'JO', role: role as 'driver' | 'passenger', passwordHash: 'hashed', isVerified: true },
      });
    }
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER1_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'BRD-100',
        color: 'Grey',
        seats: 4,
        isVerified: true,
      },
    });
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
        driverId: DRIVER1_ID,
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
      where: { id: DRIVER1_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
    driver1Token = generateAccessToken({ id: DRIVER1_ID, role: 'driver' });
    driver2Token = generateAccessToken({ id: DRIVER2_ID, role: 'driver' });
    passenger1Token = generateAccessToken({ id: PASSENGER1_ID, role: 'passenger' });
    passenger2Token = generateAccessToken({ id: PASSENGER2_ID, role: 'passenger' });

    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driver1Token}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: `${getFutureDate(1)}T16:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '18.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(tripRes.status).toBe(201);
    tripId = tripRes.body.trip_id as string;
    void tripId;
  });

  function createRideRequest(
    token: string,
    overrides: Record<string, unknown> = {},
  ): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/ride-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        origin_time: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        max_budget: 20,
        ...overrides,
      });
  }

  function submitOffer(
    token: string,
    requestId: string,
    overrides: Record<string, unknown> = {},
  ): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post(`/api/ride-requests/${requestId}/offers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ offered_fare: 15, message: 'I can take you', ...overrides });
  }

  it('creates an open request with computed expiry', async () => {
    const res = await createRideRequest(passenger1Token, {
      seats_needed: 2,
      attributes_preferred: { ac: true },
    });

    expect(res.status).toBe(201);
    expect(res.body.ride_request.id).toBeDefined();
    expect(res.body.ride_request.status).toBe('open');
    expect(res.body.ride_request.seats_needed).toBe(2);
    expect(res.body.ride_request.origin_city).toBe('Amman');
    expect(res.body.ride_request.destination_city).toBe('Irbid');
    expect(res.body.ride_request.expires_at).toBeDefined();
    expect(new Date(res.body.ride_request.expires_at as string).getTime()).toBeGreaterThan(Date.now());
  });

  it('derives expiry from arrival_deadline', async () => {
    const deadline = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    const res = await createRideRequest(passenger1Token, { arrival_deadline: deadline });

    expect(res.status).toBe(201);
    expect(new Date(res.body.ride_request.expires_at as string).toISOString()).toBe(
      new Date(deadline).toISOString(),
    );
  });

  it('rejects invalid payloads, drivers and anonymous callers', async () => {
    const invalid = await ctx.agent
      .post('/api/ride-requests')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ origin_city: 'Amman' });
    expect(invalid.status).toBe(422);
    expect((await createRideRequest(driver1Token)).status).toBe(403);
    expect(
      (
        await ctx.agent.post('/api/ride-requests').send({ origin_city: 'Amman', destination_city: 'Irbid' })
      ).status,
    ).toBe(401);
  });

  it('shows open requests of others to drivers', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;

    const res = await ctx.agent.get('/api/ride-requests').set('Authorization', `Bearer ${driver2Token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(requestId);
    expect(res.body.data[0].status).toBe('open');
    expect(res.body.data[0].passenger_name).toBe('Board Passenger One');
    expect(res.body.pagination).toBeDefined();
  });

  it('shows passengers only their own requests and filters status', async () => {
    await createRideRequest(passenger1Token);

    const res = await ctx.agent
      .get('/api/ride-requests')
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    const other = await ctx.agent
      .get('/api/ride-requests')
      .set('Authorization', `Bearer ${passenger2Token}`);
    expect(other.body.data.length).toBe(0);

    const expired = await ctx.agent
      .get('/api/ride-requests?status=expired')
      .set('Authorization', `Bearer ${driver1Token}`);
    expect(expired.status).toBe(200);
    expect(expired.body.data.length).toBe(0);
  });

  it('returns detail with offers to owner, open to any driver, 403 to others', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;

    const owner = await ctx.agent
      .get(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(owner.status).toBe(200);
    expect(owner.body.ride_request.id).toBe(requestId);
    expect(Array.isArray(owner.body.ride_request.offers)).toBe(true);

    expect(
      (
        await ctx.agent
          .get(`/api/ride-requests/${requestId}`)
          .set('Authorization', `Bearer ${driver2Token}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await ctx.agent
          .get(`/api/ride-requests/${requestId}`)
          .set('Authorization', `Bearer ${passenger2Token}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .get('/api/ride-requests/d1000000-0000-4000-8000-000000000099')
          .set('Authorization', `Bearer ${driver2Token}`)
      ).status,
    ).toBe(404);
  });

  it('edits and cancels own request', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;

    const edit = await ctx.agent
      .put(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ seats_needed: 3, max_budget: 35 });
    expect(edit.status).toBe(200);
    expect(edit.body.ride_request.seats_needed).toBe(3);
    expect(Number(edit.body.ride_request.max_budget)).toBe(35);

    const cancel = await ctx.agent
      .put(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ action: 'cancel' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.ride_request.status).toBe('cancelled');

    expect(
      (
        await ctx.agent
          .put(`/api/ride-requests/${requestId}`)
          .set('Authorization', `Bearer ${passenger2Token}`)
          .send({ seats_needed: 5 })
      ).status,
    ).toBe(403);
  });

  it('submits offers and flips request to offered', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;

    const res = await submitOffer(driver1Token, requestId);
    expect(res.status).toBe(201);
    expect(res.body.offer.id).toBeDefined();
    expect(res.body.offer.status).toBe('sent');
    expect(Number(res.body.offer.offered_fare)).toBe(15);

    const detail = await ctx.agent
      .get(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(detail.body.ride_request.status).toBe('offered');

    expect((await submitOffer(driver1Token, requestId, { offered_fare: 12 })).status).toBe(409);
    expect((await submitOffer(driver2Token, requestId)).status).toBe(201);
    expect((await submitOffer(passenger1Token, requestId)).status).toBe(403);
  });

  it('runs the accept/decline decision flow', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;
    const o1 = await submitOffer(driver1Token, requestId, { offered_fare: 14 });
    const o2 = await submitOffer(driver2Token, requestId, { offered_fare: 17 });
    const offer1Id = o1.body.offer.id as string;
    const offer2Id = o2.body.offer.id as string;

    const list = await ctx.agent
      .get(`/api/ride-requests/${requestId}/offers`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(2);
    expect(list.body.data.map((o: { driver_name: string }) => o.driver_name).sort()).toEqual([
      'Board Driver One',
      'Board Driver Two',
    ]);

    const accept = await ctx.agent
      .put(`/api/offers/${offer1Id}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ action: 'accept' });
    expect(accept.status).toBe(200);
    expect(accept.body.offer.status).toBe('accepted');

    const detail = await ctx.agent
      .get(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(detail.body.ride_request.status).toBe('accepted');

    const offers = await ctx.agent
      .get(`/api/ride-requests/${requestId}/offers`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(offers.body.data.find((o: { id: string }) => o.id === offer2Id).status).toBe('declined');

    expect(
      (
        await ctx.agent
          .put(`/api/offers/${offer1Id}`)
          .set('Authorization', `Bearer ${passenger2Token}`)
          .send({ action: 'accept' })
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.agent
          .put(`/api/offers/${offer1Id}`)
          .set('Authorization', `Bearer ${passenger1Token}`)
          .send({ action: 'maybe' })
      ).status,
    ).toBe(422);
  });

  it('returns request to open when all offers decline, rejects deciding twice', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;
    const o1 = await submitOffer(driver1Token, requestId, { offered_fare: 14 });
    const o2 = await submitOffer(driver2Token, requestId, { offered_fare: 17 });

    await ctx.agent
      .put(`/api/offers/${o2.body.offer.id as string}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ action: 'decline' });
    const res = await ctx.agent
      .put(`/api/offers/${o1.body.offer.id as string}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ action: 'decline' });
    expect(res.status).toBe(200);
    expect(res.body.offer.status).toBe('declined');

    const detail = await ctx.agent
      .get(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passenger1Token}`);
    expect(detail.body.ride_request.status).toBe('open');

    expect(
      (
        await ctx.agent
          .put(`/api/offers/${o2.body.offer.id as string}`)
          .set('Authorization', `Bearer ${passenger1Token}`)
          .send({ action: 'accept' })
      ).status,
    ).toBe(409);
  });

  it('agrees price only after acceptance', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;
    const o = await submitOffer(driver1Token, requestId);
    const offerId = o.body.offer.id as string;

    expect(
      (
        await ctx.agent
          .put(`/api/offers/${offerId}/price`)
          .set('Authorization', `Bearer ${passenger1Token}`)
          .send({ agreed_fare: 16 })
      ).status,
    ).toBe(409);

    await ctx.agent
      .put(`/api/offers/${offerId}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ action: 'accept' });

    const res = await ctx.agent
      .put(`/api/offers/${offerId}/price`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ agreed_fare: 16.5 });
    expect(res.status).toBe(200);
    expect(Number(res.body.offer.agreed_fare)).toBe(16.5);

    expect(
      (
        await ctx.agent
          .put(`/api/offers/${offerId}/price`)
          .set('Authorization', `Bearer ${passenger1Token}`)
          .send({})
      ).status,
    ).toBe(422);
  });

  it('forbids non-participating driver from listing offers', async () => {
    const reqRes = await createRideRequest(passenger2Token);
    const freshId = reqRes.body.ride_request.id as string;
    expect(
      (
        await ctx.agent
          .get(`/api/ride-requests/${freshId}/offers`)
          .set('Authorization', `Bearer ${driver2Token}`)
      ).status,
    ).toBe(403);
  });

  it('lists own sent offers for drivers', async () => {
    const created = await createRideRequest(passenger1Token);
    await submitOffer(driver1Token, created.body.ride_request.id as string);

    const res = await ctx.agent
      .get('/api/driver/offers')
      .set('Authorization', `Bearer ${driver1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].driver_id).toBe(DRIVER1_ID);
    expect(res.body.data[0].request.origin_city).toBe('Amman');
    expect(res.body.pagination.total).toBe(1);
  });

  it('attaches accepted+priced offers to trips', async () => {
    const created = await createRideRequest(passenger1Token, { seats_needed: 1 });
    const requestId = created.body.ride_request.id as string;
    const o = await submitOffer(driver1Token, requestId);
    const offerId = o.body.offer.id as string;

    async function acceptAndAgree(fare: number): Promise<void> {
      await ctx.agent
        .put(`/api/offers/${offerId}`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ action: 'accept' });
      await ctx.agent
        .put(`/api/offers/${offerId}/price`)
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send({ agreed_fare: fare });
    }

    await acceptAndAgree(18);
    const before = await ctx.prisma.trip.findFirst({ where: { driverId: DRIVER1_ID } });
    const res = await ctx.agent
      .post(`/api/trips/${before?.id as string}/offers/${offerId}/attach`)
      .set('Authorization', `Bearer ${driver1Token}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.booking.reference_code).toMatch(/^MSR-[A-Z0-9]{6}$/);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.payment_status).toBe('pending');
    expect(Number(res.body.booking.agreed_fare)).toBe(18);
    expect(res.body.offer.booking_id).toBe(res.body.booking.id);

    const after = await ctx.prisma.trip.findFirst({ where: { driverId: DRIVER1_ID } });
    expect(Number(after?.availableSeats)).toBe(Number(before?.availableSeats) - 1);
    const stored = await ctx.prisma.booking.findFirst({ where: { tripId: before?.id } });
    expect(stored?.passengerId).toBe(PASSENGER1_ID);
    expect(stored?.seatNumber).toBeNull();
  });

  it('rejects attach before price agreement and twice', async () => {
    const created = await createRideRequest(passenger1Token, { seats_needed: 1 });
    const requestId = created.body.ride_request.id as string;
    const o = await submitOffer(driver1Token, requestId);
    const offerId = o.body.offer.id as string;
    const trip = await ctx.prisma.trip.findFirst({ where: { driverId: DRIVER1_ID } });

    await ctx.agent
      .put(`/api/offers/${offerId}`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ action: 'accept' });
    expect(
      (
        await ctx.agent
          .post(`/api/trips/${trip?.id as string}/offers/${offerId}/attach`)
          .set('Authorization', `Bearer ${driver1Token}`)
          .send({})
      ).status,
    ).toBe(409);

    expect(
      (
        await ctx.agent
          .post(`/api/trips/${trip?.id as string}/offers/${offerId}/attach`)
          .set('Authorization', `Bearer ${driver2Token}`)
          .send({})
      ).status,
    ).toBe(403);
  });

  it('accepts a ride request directly and adds the point to the trip schedule', async () => {
    const created = await createRideRequest(passenger1Token, {
      origin_time: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      max_budget: 18,
      origin_lat: 31.95,
      origin_lng: 35.91,
      destination_lat: 32.55,
      destination_lng: 35.85,
    });
    const requestId = created.body.ride_request.id as string;

    const res = await ctx.agent
      .post(`/api/ride-requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${driver1Token}`)
      .send({});

    expect(res.status).toBe(201);
    const booking = res.body.booking as Record<string, unknown>;
    expect(booking.trip_id).toBe(tripId);
    expect(booking.status).toBe('confirmed');
    expect(Number(booking.pickup_lat)).toBeCloseTo(31.95, 4);

    const saved = await ctx.prisma.booking.findUnique({ where: { id: booking.id as string } });
    expect(saved?.tripId).toBe(tripId);

    const request = await ctx.prisma.rideRequest.findUnique({ where: { id: requestId } });
    expect(request?.status).toBe('accepted');

    const route = await ctx.agent
      .get(`/api/trips/${tripId}/route`)
      .set('Authorization', `Bearer ${driver1Token}`);
    expect(route.status).toBe(200);
    expect(
      (route.body.pickups as Array<{ booking_id: string }>).some((p) => p.booking_id === booking.id),
    ).toBe(true);
  });

  it('accepts onto an explicit trip and rejects another driver trip', async () => {
    const created = await createRideRequest(passenger1Token);
    const requestId = created.body.ride_request.id as string;

    const forbidden = await ctx.agent
      .post(`/api/ride-requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${driver2Token}`)
      .send({ trip_id: tripId });
    expect(forbidden.status).toBe(403);

    const res = await ctx.agent
      .post(`/api/ride-requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${driver1Token}`)
      .send({ trip_id: tripId });
    expect(res.status).toBe(201);
    expect((res.body.trip as Record<string, unknown>).id).toBe(tripId);
  });

  it('creates a new trip when the driver has no matching trip', async () => {
    const created = await createRideRequest(passenger1Token, {
      destination_city: 'Zarqa',
      origin_time: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      max_budget: 12,
      origin_lat: 31.95,
      origin_lng: 35.91,
      destination_lat: 32.07,
      destination_lng: 36.09,
    });
    const requestId = created.body.ride_request.id as string;

    const res = await ctx.agent
      .post(`/api/ride-requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${driver1Token}`)
      .send({});

    expect(res.status).toBe(201);
    const trip = res.body.trip as Record<string, unknown>;
    expect(trip.id).not.toBe(tripId);
    expect(trip.destination_city).toBe('Zarqa');
    expect(Number(trip.fare_per_seat)).toBe(12);

    const saved = await ctx.prisma.trip.findUnique({ where: { id: trip.id as string } });
    expect(saved?.driverId).toBe(DRIVER1_ID);
    expect(saved?.destinationCity).toBe('Zarqa');
    expect(Number(saved?.availableSeats)).toBe(2);
  });
});

describe('Ride request matches', () => {
  let ctx: TestContext;
  let ownerToken: string;
  let otherToken: string;

  const MATCH_DRIVER_ID = 'f7000000-0000-4000-8000-000000000001';
  const OWNER_ID = 'f7000000-0000-4000-8000-000000000002';
  const OTHER_ID = 'f7000000-0000-4000-8000-000000000003';
  const MATCH_VEHICLE_ID = 'f7000000-0000-4000-8000-000000000010';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: MATCH_DRIVER_ID,
        fullName: 'Match Driver',
        phone: '+962795559050',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
        avgRating: 4.8,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: OWNER_ID,
        fullName: 'Match Owner',
        phone: '+962795559051',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: OTHER_ID,
        fullName: 'Match Other',
        phone: '+962795559052',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: MATCH_VEHICLE_ID,
        driverId: MATCH_DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'MCH-101',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
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
        driverId: MATCH_DRIVER_ID,
        planId: plan.id,
        planName: plan.name,
        planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut,
        planCost: plan.cost,
        balance: 100,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      },
    });
    await ctx.prisma.user.update({
      where: { id: MATCH_DRIVER_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
    ownerToken = generateAccessToken({ id: OWNER_ID, role: 'passenger' });
    otherToken = generateAccessToken({ id: OTHER_ID, role: 'passenger' });
  });

  function futureAt(hour: number): string {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  it('returns ranked matches for the owner without side effects', async () => {
    const driverToken = generateAccessToken({ id: MATCH_DRIVER_ID, role: 'driver' });
    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: futureAt(14),
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(tripRes.status).toBe(201);
    const tripId = tripRes.body.trip_id as string;

    const reqRes = await ctx.agent
      .post('/api/ride-requests')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ origin_city: 'Amman', destination_city: 'Irbid', origin_time: futureAt(14), seats_needed: 1 });
    expect(reqRes.status).toBe(201);
    const requestId = reqRes.body.ride_request.id as string;

    const before = await ctx.prisma.rideRequest.count();
    const res = await ctx.agent
      .get(`/api/ride-requests/${requestId}/matches`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ride_request_id).toBe(requestId);
    expect(Array.isArray(res.body.matches)).toBe(true);
    expect(res.body.matches.length).toBeGreaterThan(0);
    const match = res.body.matches[0] as Record<string, unknown>;
    expect(match.score_rank).toBe(1);
    expect(match.trip_id).toBe(tripId);
    expect((match.origin as Record<string, unknown>).city).toBe('Amman');
    expect((match.destination as Record<string, unknown>).city).toBe('Irbid');
    expect(match.fare_per_seat).toBe(15);
    expect(match.available_seats).toBe(2);
    expect((match.driver as Record<string, unknown>).full_name).toBe('Match Driver');
    expect(await ctx.prisma.rideRequest.count()).toBe(before);

    const forbidden = await ctx.agent
      .get(`/api/ride-requests/${requestId}/matches`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe('YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS');
  });
});

describe('Contract: ride requests', () => {
  let ctx: TestContext;
  let passengerToken: string;
  let driverToken: string;
  let otherToken: string;

  const C_PASSENGER_ID = 'e3000000-0000-4000-8000-000000000001';
  const C_DRIVER_ID = 'e3000000-0000-4000-8000-000000000002';
  const C_OTHER_ID = 'e3000000-0000-4000-8000-000000000003';

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: C_PASSENGER_ID,
        fullName: 'Contract Rider',
        phone: '+962797311111',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: C_DRIVER_ID,
        fullName: 'Contract Offer Driver',
        phone: '+962797333333',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: C_OTHER_ID,
        fullName: 'Other Rider',
        phone: '+962797333334',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    passengerToken = generateAccessToken({ id: C_PASSENGER_ID, role: 'passenger' });
    driverToken = generateAccessToken({ id: C_DRIVER_ID, role: 'driver' });
    otherToken = generateAccessToken({ id: C_OTHER_ID, role: 'passenger' });

    // Trip publishing needs a verified vehicle + active subscription.
    await ctx.prisma.vehicle.create({
      data: {
        driverId: C_DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Corolla',
        vehicleType: 'sedan',
        modelYear: 2022,
        plateNumber: 'MTC-101',
        color: 'Black',
        seats: 4,
        isVerified: true,
      },
    });
    const basicPlan = await ctx.prisma.subscriptionPlan.create({
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
        driverId: C_DRIVER_ID,
        planId: basicPlan.id,
        planName: basicPlan.name,
        planPeriodDays: basicPlan.periodDays,
        planPercentageCut: basicPlan.percentageCut,
        planCost: basicPlan.cost,
        balance: 100,
        paymentMethod: { name: 'x', account_number: 'y', type: 'bank_account' },
        status: 'active',
        approvedAt: now,
        activatedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
      },
    });
    await ctx.prisma.user.update({
      where: { id: C_DRIVER_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
  });

  function createRequest(overrides: Record<string, unknown> = {}): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/ride-requests')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ origin_city: 'Amman', destination_city: 'Zarqa', max_budget: 15, ...overrides });
  }

  it('POST returns snake_case envelope', async () => {
    const res = await createRequest({ origin_city: 'Amman', destination_city: 'Irbid', seats_needed: 1 });
    expect(res.status).toBe(201);
    const r = res.body.ride_request as Record<string, unknown>;
    expect(r.id).toBeDefined();
    expect(r.origin_city).toBe('Amman');
    expect(r.destination_city).toBe('Irbid');
    expect(r.seats_needed).toBe(1);
    expect(r.status).toBe('open');
    expect(r.expires_at).toBeDefined();
    expect(r.currency).toBe('JOD');
  });

  it('GET board, detail, edit and cancel', async () => {
    const created = await createRequest();
    const requestId = (created.body.ride_request as Record<string, unknown>).id as string;

    const board = await ctx.agent.get('/api/ride-requests').set('Authorization', `Bearer ${driverToken}`);
    expect(board.status).toBe(200);
    expect(Array.isArray(board.body.data)).toBe(true);
    expect(board.body.pagination.page).toBe(1);
    expect(board.body.data[0]).toMatchObject({ origin_city: 'Amman', destination_city: 'Zarqa', status: 'open' });

    const detail = await ctx.agent
      .get(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(detail.status).toBe(200);
    expect((detail.body.ride_request as Record<string, unknown>).id).toBe(requestId);
    expect(Array.isArray((detail.body.ride_request as Record<string, unknown>).offers)).toBe(true);

    const edit = await ctx.agent
      .put(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ max_budget: 25 });
    expect(edit.status).toBe(200);
    expect(Number((edit.body.ride_request as Record<string, unknown>).max_budget)).toBe(25);

    const cancel = await ctx.agent
      .put(`/api/ride-requests/${requestId}`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ action: 'cancel' });
    expect(cancel.status).toBe(200);
    expect((cancel.body.ride_request as Record<string, unknown>).status).toBe('cancelled');
  });

  it('runs the offer lifecycle with envelopes', async () => {
    const created = await createRequest();
    const requestId = (created.body.ride_request as Record<string, unknown>).id as string;

    const offerRes = await ctx.agent
      .post(`/api/ride-requests/${requestId}/offers`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ offered_fare: 12.5, message: 'Going that way' });
    expect(offerRes.status).toBe(201);
    const offer = offerRes.body.offer as Record<string, unknown>;
    expect(offer.status).toBe('sent');
    expect(Number(offer.offered_fare)).toBe(12.5);

    const list = await ctx.agent
      .get(`/api/ride-requests/${requestId}/offers`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);

    const mine = await ctx.agent.get('/api/driver/offers').set('Authorization', `Bearer ${driverToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.length).toBe(1);
    expect((mine.body.data[0].request as Record<string, unknown>).destination_city).toBe('Zarqa');

    const accept = await ctx.agent
      .put(`/api/offers/${offer.id as string}`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ action: 'accept' });
    expect(accept.status).toBe(200);
    expect((accept.body.offer as Record<string, unknown>).status).toBe('accepted');

    const price = await ctx.agent
      .put(`/api/offers/${offer.id as string}/price`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ agreed_fare: 13 });
    expect(price.status).toBe(200);
    expect(Number((price.body.offer as Record<string, unknown>).agreed_fare)).toBe(13);
  });

  it('rejects unauthenticated board access', async () => {
    expect((await ctx.agent.get('/api/ride-requests')).status).toBe(401);
  });

  it('matches shape for owner and 403 for others', async () => {
    const tripRes = await ctx.agent
      .post('/api/trips')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        departure_time: `${getFutureDate(1)}T14:00:00+03:00`,
        type_of_trip: 'once',
        fare_per_seat: '15.00',
        seats: [
          { seat_number: 1, type: 'driver' },
          { seat_number: 2, type: 'available' },
          { seat_number: 3, type: 'available' },
          { seat_number: 4, type: 'unavailable' },
        ],
      });
    expect(tripRes.status).toBe(201);
    const tripId = tripRes.body.trip_id as string;
    const trip = await ctx.prisma.trip.findUnique({ where: { id: tripId } });

    const reqRes = await createRequest({
      origin_city: 'Amman',
      destination_city: 'Irbid',
      origin_time: (trip?.departureTime as Date).toISOString(),
      seats_needed: 1,
    });
    const requestId = (reqRes.body.ride_request as Record<string, unknown>).id as string;

    const res = await ctx.agent
      .get(`/api/ride-requests/${requestId}/matches`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ride_request_id).toBe(requestId);
    expect(Array.isArray(res.body.matches)).toBe(true);
    const match = res.body.matches[0] as Record<string, unknown>;
    expect(match).toMatchObject({
      trip_id: tripId,
      score_rank: 1,
      origin: { city: 'Amman' },
      destination: { city: 'Irbid' },
      available_seats: 2,
      fare_per_seat: 15,
      currency: 'JOD',
    });
    expect(match.driver).toMatchObject({ id: C_DRIVER_ID, full_name: 'Contract Offer Driver' });

    const forbidden = await ctx.agent
      .get(`/api/ride-requests/${requestId}/matches`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe('YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS');
  });
});
