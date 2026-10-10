import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

// Port of Main Server/Services/statsService.ts (lifetime driver statistics).
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async lifetime(driverId: string): Promise<{
    stats: {
      total_trips: number;
      total_bookings: number;
      no_show_rate: number;
      response_rate: number;
      avg_rating: number;
      total_earnings: number;
      completed_trips: number;
      cancelled_trips: number;
    };
  }> {
    const [user, profile, totalTrips, completedTrips, cancelledTrips, tripIds] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: driverId }, select: { avgRating: true } }),
      this.prisma.driverProfile.findFirst({ where: { driverId }, select: { responseRate: true } }),
      this.prisma.trip.count({ where: { driverId } }),
      this.prisma.trip.count({ where: { driverId, status: 'completed' } }),
      this.prisma.trip.count({ where: { driverId, status: 'cancelled' } }),
      this.prisma.trip
        .findMany({ where: { driverId }, select: { id: true } })
        .then((rows) => rows.map((r) => r.id)),
    ]);

    let totalBookings = 0;
    let noShowBookings = 0;
    let totalEarnings = 0;
    if (tripIds.length > 0) {
      [totalBookings, noShowBookings] = await Promise.all([
        this.prisma.booking.count({ where: { tripId: { in: tripIds } } }),
        this.prisma.booking.count({ where: { tripId: { in: tripIds }, status: 'no_show' } }),
      ]);
      const agg = await this.prisma.booking.aggregate({
        where: { tripId: { in: tripIds }, status: 'completed' },
        _sum: { agreedFare: true },
      });
      totalEarnings = Number(agg._sum.agreedFare ?? 0);
    }

    const noShowRate =
      totalBookings === 0 ? 0 : Math.round((noShowBookings / totalBookings) * 1000) / 10;
    return {
      stats: {
        total_trips: totalTrips,
        total_bookings: totalBookings,
        no_show_rate: noShowRate,
        response_rate: profile ? Number(profile.responseRate ?? 0) : 0,
        avg_rating: user ? Number(user.avgRating ?? 0) : 0,
        total_earnings: totalEarnings,
        completed_trips: completedTrips,
        cancelled_trips: cancelledTrips,
      },
    };
  }
}
