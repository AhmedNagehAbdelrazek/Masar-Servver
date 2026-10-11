// Port of Main Server/tests/integration/historyJobs.test.js (jobs + retention)
// plus the deferred expiry-sweep test from tests/integration/subscription.test.js
// ("US4 - Expiry transition" → Wave 7 jobs per test/subscriptions.e2e-spec.ts).
// Job bodies run through the Nest JobsService; the SOS trigger runs through
// SosService like the Express file's sosService.trigger call.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { JobsService } from '../src/jobs/jobs.service.js';
import { SosService } from '../src/modules/sos/sos.service.js';
import { resetTestState } from '../src/test/db.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const DRIVER_ID = 'b1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'b1300000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'b1300000-0000-4000-8000-000000000010';

describe('US3 Integration - jobs and retention', () => {
  let ctx: TestContext;
  let jobs: JobsService;
  let sos: SosService;

  beforeAll(async () => {
    ctx = await createTestApp();
    jobs = ctx.app.get(JobsService);
    sos = ctx.app.get(SosService);
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await ctx.prisma.user.create({
      data: {
        id: DRIVER_ID,
        fullName: 'Jobs Driver',
        phone: '+962799171111',
        countryCode: 'JO',
        role: 'driver',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.user.create({
      data: {
        id: PASSENGER_ID,
        fullName: 'Jobs Passenger',
        phone: '+962799172222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    await ctx.prisma.vehicle.create({
      data: {
        id: VEHICLE_ID,
        driverId: DRIVER_ID,
        manufacturer: 'Toyota',
        model: 'Camry',
        vehicleType: 'sedan',
        modelYear: 2023,
        plateNumber: 'JOB-1301',
        color: 'White',
        seats: 4,
        isVerified: true,
      },
    });
  });

  it('sweeps expired plans: flips status, recomputes balance, blocks trips, notifies', async () => {
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
    const sub = await ctx.prisma.driverSubscription.create({
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
        approvedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    await ctx.prisma.user.update({
      where: { id: DRIVER_ID },
      data: { totalBalance: 100, isInDebt: false },
    });
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 20,
        status: 'published',
      },
    });

    await ctx.prisma.driverSubscription.update({
      where: { id: sub.id },
      data: { expiresAt: new Date(Date.now() - 60 * 1000) },
    });

    await jobs.runExpirySweep();

    const expired = await ctx.prisma.driverSubscription.findUnique({ where: { id: sub.id } });
    expect(expired?.status).toBe('expired');

    const user = await ctx.prisma.user.findUnique({ where: { id: DRIVER_ID } });
    expect(Number(user?.totalBalance)).toBe(0);
    expect(user?.isInDebt).toBe(false);

    const dbTrip = await ctx.prisma.trip.findUnique({ where: { id: trip.id } });
    expect(dbTrip?.isBlockedByBalance).toBe(true);

    const notif = await ctx.prisma.notification.findFirst({
      where: { userId: DRIVER_ID, type: 'PLAN_EXPIRED' },
    });
    expect(notif).not.toBeNull();
  });

  it('routeRetryJob recovers failed routes without throwing', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        originLat: 31.9539,
        originLng: 35.9106,
        destinationCity: 'Irbid',
        destinationLat: 32.5568,
        destinationLng: 35.8469,
        departureTime: new Date(Date.now() + 86400000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15.5,
        status: 'published',
        routeStatus: 'failed',
      },
    });
    const out = await jobs.runRouteRetry();
    expect(out.retried).toBeGreaterThanOrEqual(1);
    expect(out.recovered).toBeGreaterThanOrEqual(1);
    const fresh = await ctx.prisma.trip.findUnique({ where: { id: trip.id } });
    expect(fresh?.routeStatus).toBe('ready');
  });

  it('actualPathJob compacts completed trips missing a path', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        originLat: 31.9539,
        originLng: 35.9106,
        destinationCity: 'Irbid',
        destinationLat: 32.5568,
        destinationLng: 35.8469,
        departureTime: new Date(Date.now() - 86400000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 15.5,
        status: 'completed',
      },
    });
    await ctx.prisma.tripLocation.createMany({
      data: [
        { tripId: trip.id, driverId: DRIVER_ID, lat: 31.96, lng: 35.91 },
        { tripId: trip.id, driverId: DRIVER_ID, lat: 32.2, lng: 35.88 },
        { tripId: trip.id, driverId: DRIVER_ID, lat: 32.55, lng: 35.847 },
      ],
    });
    const out = await jobs.runActualPath();
    expect(out.compacted).toBeGreaterThanOrEqual(1);
    const fresh = await ctx.prisma.trip.findUnique({ where: { id: trip.id } });
    expect(typeof fresh?.actualPathPolyline).toBe('string');
  });

  it('retention drops 30-day points but keeps year-old SOS-linked ones', async () => {
    const mkTrip = (status: 'completed'): Promise<{ id: string }> =>
      ctx.prisma.trip.create({
        data: {
          driverId: DRIVER_ID,
          vehicleId: VEHICLE_ID,
          originCity: 'Amman',
          originLat: 31.9539,
          originLng: 35.9106,
          destinationCity: 'Irbid',
          destinationLat: 32.5568,
          destinationLng: 35.8469,
          departureTime: new Date(Date.now() - 40 * 86400000),
          totalSeats: 4,
          availableSeats: 3,
          farePerSeat: 15.5,
          status,
        },
      });
    const plain = await mkTrip('completed');
    const sosTrip = await mkTrip('completed');
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    await ctx.prisma.tripLocation.create({
      data: { tripId: plain.id, driverId: DRIVER_ID, lat: 31.96, lng: 35.91, createdAt: old },
    });
    await ctx.prisma.tripLocation.create({
      data: { tripId: sosTrip.id, driverId: DRIVER_ID, lat: 31.96, lng: 35.91, createdAt: old },
    });
    await ctx.prisma.sosEvent.create({
      data: {
        userId: PASSENGER_ID,
        tripId: sosTrip.id,
        lat: 32.25,
        lng: 35.8793,
        urgency: 'high',
        status: 'pending',
      },
    });

    await jobs.runDataRetention();
    expect(await ctx.prisma.tripLocation.count({ where: { tripId: plain.id } })).toBe(0);
    expect(await ctx.prisma.tripLocation.count({ where: { tripId: sosTrip.id } })).toBe(1);
  });

  it('SOS trigger on a live trip stores the passenger position', async () => {
    const trip = await ctx.prisma.trip.create({
      data: {
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        originLat: 31.9539,
        originLng: 35.9106,
        destinationCity: 'Irbid',
        destinationLat: 32.5568,
        destinationLng: 35.8469,
        departureTime: new Date(Date.now() + 86400000),
        totalSeats: 4,
        availableSeats: 2,
        farePerSeat: 15.5,
        status: 'in_progress',
      },
    });
    await ctx.prisma.booking.create({
      data: {
        tripId: trip.id,
        passengerId: PASSENGER_ID,
        seatsBooked: 1,
        agreedFare: 15.5,
        status: 'confirmed',
        referenceCode: 'MSR-SOS001',
      },
    });
    await ctx.prisma.tripLocation.create({
      data: { tripId: trip.id, driverId: DRIVER_ID, lat: 32.0, lng: 35.895 },
    });

    const out = await sos.trigger({ id: PASSENGER_ID, role: 'passenger' }, { tripId: trip.id, lat: 32.25, lng: 35.8793 });
    expect(out.sos_event_id).toBeDefined();
    const event = await ctx.prisma.sosEvent.findUnique({ where: { id: out.sos_event_id } });
    expect(Number(event?.lat)).toBeCloseTo(32.25, 4);
  });
});
