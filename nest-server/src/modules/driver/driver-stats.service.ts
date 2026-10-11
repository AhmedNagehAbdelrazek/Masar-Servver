import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

// Port of Main Server/Services/driverStatsService.ts (spec 012 US5).
// Materialises derivable performance columns onto `driver_profiles` so the
// passenger-facing driver reveal does not recompute them per request.
export const PROFESSIONAL_MIN_TRIPS = 20;
export const PROFESSIONAL_MIN_PUNCTUALITY = 90;

export interface DriverStatsResult {
  driverId: string;
  completedTrips: number;
  punctualityRate: number | null;
  professionalDriver: boolean;
}

@Injectable()
export class DriverStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async recomputeForDriver(driverId: string): Promise<DriverStatsResult> {
    const completedTrips = await this.prisma.trip.count({
      where: { driverId, status: 'completed' },
    });

    // Express parity: `!r.wasLate` counts NULL as on-time (only an explicit
    // `true` is late). Keep the 20-trip / 90% professional threshold.
    const [total, onTime] = await Promise.all([
      this.prisma.rating.count({ where: { rateeId: driverId, isVisible: true } }),
      this.prisma.rating.count({
        where: { rateeId: driverId, isVisible: true, NOT: { wasLate: true } },
      }),
    ]);

    let punctualityRate: number | null = null;
    if (total > 0) {
      punctualityRate = Math.round((onTime / total) * 10000) / 100;
    }

    const professionalDriver =
      completedTrips >= PROFESSIONAL_MIN_TRIPS &&
      (punctualityRate == null || punctualityRate >= PROFESSIONAL_MIN_PUNCTUALITY);

    await this.prisma.driverProfile.upsert({
      where: { driverId },
      create: {
        driverId,
        totalTrips: completedTrips,
        punctualityRate,
        professionalDriver,
      },
      update: {
        totalTrips: completedTrips,
        punctualityRate,
        professionalDriver,
      },
    });

    return { driverId, completedTrips, punctualityRate, professionalDriver };
  }

  async recomputeAllDrivers(): Promise<DriverStatsResult[]> {
    const [tripDrivers, ratingDrivers] = await Promise.all([
      this.prisma.trip.findMany({
        select: { driverId: true },
        distinct: ['driverId'],
      }),
      this.prisma.rating.findMany({
        select: { rateeId: true },
        distinct: ['rateeId'],
      }),
    ]);
    const ids = new Set<string>();
    for (const r of tripDrivers) if (r.driverId) ids.add(r.driverId);
    for (const r of ratingDrivers) if (r.rateeId) ids.add(r.rateeId);

    const results: DriverStatsResult[] = [];
    for (const driverId of ids) {
      results.push(await this.recomputeForDriver(driverId));
    }
    return results;
  }
}
