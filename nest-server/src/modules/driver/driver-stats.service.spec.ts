import { describe, expect, it, vi } from 'vitest';
import { DriverStatsService } from './driver-stats.service.js';

// Unit coverage for the driverStats recompute math (port of Main
// Server/tests/unit/driverStatsService.test.ts, file-local with a mocked
// PrismaService so the whole default vitest project stays fast).
function makePrisma(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    trip: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    rating: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    driverProfile: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

describe('DriverStatsService.recomputeForDriver', () => {
  it('writes totalTrips, punctualityRate and professional flag back to the profile', async () => {
    const prisma = makePrisma();
    (prisma.trip as { count: ReturnType<typeof vi.fn> }).count.mockResolvedValue(3);
    const ratingCount = (prisma.rating as { count: ReturnType<typeof vi.fn> }).count;
    ratingCount.mockResolvedValueOnce(5).mockResolvedValueOnce(4); // 80% on time

    const service = new DriverStatsService(prisma as never);
    const result = await service.recomputeForDriver('driver-1');

    expect(result.completedTrips).toBe(3);
    expect(result.punctualityRate).toBe(80);
    expect(result.professionalDriver).toBe(false);
    expect((prisma.driverProfile as { upsert: ReturnType<typeof vi.fn> }).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { driverId: 'driver-1' },
        update: { totalTrips: 3, punctualityRate: 80, professionalDriver: false },
      }),
    );
  });

  it('marks a driver professional with enough trips and high punctuality', async () => {
    const prisma = makePrisma();
    (prisma.trip as { count: ReturnType<typeof vi.fn> }).count.mockResolvedValue(20);
    const ratingCount = (prisma.rating as { count: ReturnType<typeof vi.fn> }).count;
    ratingCount.mockResolvedValueOnce(10).mockResolvedValueOnce(10); // 100% on time

    const service = new DriverStatsService(prisma as never);
    const result = await service.recomputeForDriver('driver-1');

    expect(result.professionalDriver).toBe(true);
  });

  it('handles no activity by zeroing stats with null punctuality', async () => {
    const prisma = makePrisma();
    const service = new DriverStatsService(prisma as never);
    const result = await service.recomputeForDriver('driver-1');

    expect(result.completedTrips).toBe(0);
    expect(result.punctualityRate).toBeNull();
    expect(result.professionalDriver).toBe(false);
    expect((prisma.driverProfile as { upsert: ReturnType<typeof vi.fn> }).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { totalTrips: 0, punctualityRate: null, professionalDriver: false },
      }),
    );
  });

  it('recomputes for every driver with activity via recomputeAllDrivers', async () => {
    const prisma = makePrisma({
      trip: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([{ driverId: 'driver-1' }]),
      },
      rating: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      driverProfile: { upsert: vi.fn().mockResolvedValue({}) },
    });
    const service = new DriverStatsService(prisma as never);
    const results = await service.recomputeAllDrivers();

    expect(Array.isArray(results)).toBe(true);
    expect(results.find((r) => r.driverId === 'driver-1')?.completedTrips).toBe(1);
  });

  it('merges trip and rating driver id sets', async () => {
    const prisma = makePrisma({
      trip: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([{ driverId: 'driver-1' }]),
      },
      rating: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([{ rateeId: 'driver-2' }]),
      },
      driverProfile: { upsert: vi.fn().mockResolvedValue({}) },
    });
    const service = new DriverStatsService(prisma as never);
    const results = await service.recomputeAllDrivers();

    expect(results.map((r) => r.driverId).sort()).toEqual(['driver-1', 'driver-2']);
  });
});
