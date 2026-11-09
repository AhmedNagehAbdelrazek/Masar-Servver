import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';
import { TripReminderService } from '../src/modules/trips/trip-reminder.service.js';

const DRIVER_ID = 'aa100000-0000-4000-8000-000000000001';
const VEHICLE_ID = 'bb100000-0000-4000-8000-000000000001';
const TRIP_ID = 'cc100000-0000-4000-8000-000000000001';

let ctx: TestContext;

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
      id: DRIVER_ID,
      fullName: 'Reminder Driver',
      phone: '+962799999001',
      role: 'driver',
      passwordHash: 'x',
      isVerified: true,
      verificationStatus: 'approved',
      status: 'active',
      locale: 'en',
    },
  });
  await ctx.prisma.vehicle.create({
    data: {
      id: VEHICLE_ID,
      driverId: DRIVER_ID,
      manufacturer: 'Toyota',
      model: 'Corolla',
      vehicleType: 'sedan',
      plateNumber: 'REM-1',
      seats: 4,
      isVerified: true,
    },
  });
});

describe('TripReminderService', () => {
  it('sends one driver reminder per trip occurrence', async () => {
    await ctx.prisma.trip.create({
      data: {
        id: TRIP_ID,
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 5 * 60000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 10,
        status: 'published',
      },
    });

    const service = ctx.app.get(TripReminderService);
    const first = await service.sendDueReminders();
    expect(first.sent).toBe(1);
    expect(await ctx.prisma.tripReminder.count({ where: { tripId: TRIP_ID } })).toBe(1);
    expect(
      await ctx.prisma.notification.count({
        where: { userId: DRIVER_ID, type: 'TRIP_REMINDER' },
      }),
    ).toBe(1);

    const second = await service.sendDueReminders();
    expect(second.sent).toBe(0);
    expect(await ctx.prisma.tripReminder.count({ where: { tripId: TRIP_ID } })).toBe(1);
  });

  it('does not remind for trips outside the lead window', async () => {
    await ctx.prisma.trip.create({
      data: {
        id: TRIP_ID,
        driverId: DRIVER_ID,
        vehicleId: VEHICLE_ID,
        originCity: 'Amman',
        destinationCity: 'Irbid',
        departureTime: new Date(Date.now() + 2 * 3600 * 1000),
        totalSeats: 4,
        availableSeats: 3,
        farePerSeat: 10,
        status: 'published',
      },
    });

    const service = ctx.app.get(TripReminderService);
    const result = await service.sendDueReminders();
    expect(result.sent).toBe(0);
    expect(await ctx.prisma.tripReminder.count({ where: { tripId: TRIP_ID } })).toBe(0);
  });
});
