import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';

const DASHBOARD_TTL = 30;

// Port of Main Server/Services/dashboardService.ts (Redis-cached 30s).
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private key(driverId: string): string {
    return `driver_dashboard:${driverId}`;
  }

  async getDashboard(driverId: string): Promise<Record<string, unknown>> {
    const cacheKey = this.key(driverId);
    try {
      const cached = await this.redis.getKey(cacheKey);
      if (cached) return JSON.parse(cached) as Record<string, unknown>;
    } catch (err) {
      this.logger.warn(`dashboard cache read failed: ${(err as Error).message}`);
    }

    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
    if (!vehicle) {
      throw new NotFoundException({ message: 'VEHICLE_NOT_FOUND', code: 'VEHICLE_NOT_FOUND' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayTrips, upcomingTrips, totalCompleted, monthlyEarnings, avgAgg, recentBookings] =
      await Promise.all([
        this.prisma.trip.findMany({
          where: {
            driverId,
            departureTime: { gte: today, lt: tomorrow },
            status: { in: ['published', 'in_progress'] },
          },
          orderBy: { departureTime: 'asc' },
        }),
        this.prisma.trip.findMany({
          where: { driverId, departureTime: { gte: tomorrow }, status: 'published' },
          orderBy: { departureTime: 'asc' },
          take: 10,
        }),
        this.prisma.trip.count({ where: { driverId, status: 'completed' } }),
        this.prisma.booking.aggregate({
          where: {
            status: 'confirmed',
            createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
            trip: { driverId },
          },
          _sum: { agreedFare: true },
        }),
        this.prisma.rating.aggregate({ where: { rateeId: driverId }, _avg: { stars: true } }),
        this.prisma.booking.findMany({
          where: { trip: { driverId } },
          include: {
            trip: {
              select: { id: true, originCity: true, destinationCity: true, departureTime: true },
            },
            passenger: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const avgRating = avgAgg._avg.stars === null ? null : Number(avgAgg._avg.stars);
    const monthly = Number(monthlyEarnings._sum.agreedFare ?? 0);
    const tripRow = (t: {
      id: string;
      originCity: string;
      destinationCity: string;
      departureTime: Date;
      availableSeats: number;
      totalSeats: number;
      status: string;
    }): Record<string, unknown> => ({
      trip_id: t.id,
      origin_city: t.originCity,
      destination_city: t.destinationCity,
      departure_time: t.departureTime,
      available_seats: t.availableSeats,
      total_seats: t.totalSeats,
      status: t.status,
    });

    const dashboard = {
      account: {
        driver_id: driver.id,
        full_name: driver.fullName,
        phone: driver.phone,
        gender: driver.gender,
        rating: avgRating ?? 0,
        vehicle_seats_number: vehicle.seats,
        total_trips_completed: totalCompleted,
        verified: driver.isVerified,
        profile_picture_url: driver.avatarUrl,
      },
      schedule: {
        today: todayTrips.map((t) => tripRow(t as unknown as Parameters<typeof tripRow>[0])),
        upcoming: upcomingTrips.map((t) => tripRow(t as unknown as Parameters<typeof tripRow>[0])),
      },
      summary: {
        today_trips_count: todayTrips.length,
        total_completed_trips: totalCompleted,
        monthly_earnings: monthly,
        avg_passenger_rating: avgRating ? parseFloat(avgRating.toFixed(1)) : 0,
      },
      reservation_history: {
        recent: recentBookings.map((b) => {
          const trip = b.trip as unknown as {
            id: string;
            originCity: string;
            destinationCity: string;
            departureTime: Date;
          };
          const passenger = b.passenger as unknown as { fullName: string | null } | null;
          return {
            booking_id: b.id,
            trip: {
              trip_id: trip.id,
              origin_city: trip.originCity,
              destination_city: trip.destinationCity,
              departure_time: trip.departureTime,
            },
            passenger_name: passenger?.fullName ?? 'Unknown',
            seats_booked: b.seatsBooked,
            status: b.status,
            agreed_fare: Number(b.agreedFare),
            created_at: b.createdAt,
            rating_received: null,
          };
        }),
        pagination: { total: recentBookings.length, page: 1, limit: 10 },
      },
    };

    try {
      await this.redis.setKey(cacheKey, JSON.stringify(dashboard), DASHBOARD_TTL);
    } catch (err) {
      this.logger.warn(`dashboard cache write failed: ${(err as Error).message}`);
    }
    return dashboard as unknown as Record<string, unknown>;
  }

  async invalidateDashboardCache(driverId: string): Promise<void> {
    try {
      await this.redis.deleteKey(this.key(driverId));
    } catch (err) {
      this.logger.warn(`dashboard cache invalidation failed: ${(err as Error).message}`);
    }
  }
}
