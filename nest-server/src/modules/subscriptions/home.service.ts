import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { jordanStartOfToday } from '../../common/utils/jordan-time.js';
import { seatNumbersFor } from '../../common/utils/seat-numbers.js';
import { freeTripsLimit, hasFreeTripsOffer } from '../../common/utils/free-trips.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { BalanceService } from '../balance/balance.service.js';
import { RecentSearchService } from './recent-search.service.js';
import { SubscriptionsService } from './subscriptions.service.js';

const DAY_MS = 24 * 3600 * 1000;
const HOUR_MS = 3600 * 1000;

interface SubscriptionLike {
  planName: string | null;
  planCost: unknown;
  balance: unknown;
  expiresAt: Date | null;
  freeOffer: unknown;
  freeTripsUsed: number;
}

function freeTripsFor(sub: SubscriptionLike | null): { max: number; used: number; remaining: number } | null {
  if (!sub || !hasFreeTripsOffer({ freeOffer: sub.freeOffer as never })) return null;
  const limit = freeTripsLimit({ freeOffer: sub.freeOffer as never });
  const used = Number(sub.freeTripsUsed) || 0;
  return { max: limit, used, remaining: Math.max(0, limit - used) };
}

// Port of Main Server/Services/homeService.ts (driver + passenger home,
// driver subscription page). NOTE: the pre-home tripExpiry sweep is skipped —
// tripExpiryService arrives with Wave 5; all fixtures use future trips, and
// the call is best-effort in Express too.
@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly balance: BalanceService,
    private readonly subscriptions: SubscriptionsService,
    private readonly recentSearch: RecentSearchService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async toSubscriptionSection(driverId: string): Promise<Record<string, unknown>> {
    const current = (await this.balance.findCurrentSubscription(driverId)) as unknown as
      | SubscriptionLike
      | null;
    if (!current) {
      return {
        tier: 'free',
        price: 0,
        currency: 'JOD',
        expires_at: null,
        days_remaining: 0,
        free_trips: null,
      };
    }
    const daysRemaining = Math.max(
      0,
      Math.ceil(((current.expiresAt?.getTime() ?? 0) - Date.now()) / DAY_MS),
    );
    return {
      tier: String(current.planName ?? 'free').toLowerCase(),
      price: Number(current.planCost ?? 0),
      currency: 'JOD',
      expires_at: current.expiresAt,
      days_remaining: daysRemaining,
      free_trips: freeTripsFor(current),
    };
  }

  private toNextTrip(
    trip: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!trip) return null;
    const bookings = (trip.bookings as Record<string, unknown>[] | undefined) ?? [];
    const bookedSeatsCount = bookings.reduce((sum, b) => sum + Number(b.seatsBooked ?? 0), 0);
    const canStart =
      ['published', 'full'].includes(trip.status as string) &&
      new Date(trip.departureTime as string).getTime() - Date.now() <= HOUR_MS;
    const vehicle = trip.vehicle as Record<string, unknown> | null;
    return {
      trip_id: trip.id,
      origin_city: trip.originCity,
      origin_area: trip.originArea,
      destination_city: trip.destinationCity,
      destination_area: trip.destinationArea,
      departure_time: trip.departureTime,
      fare_per_seat: Number(trip.farePerSeat),
      total_profit: Number(trip.totalProfit) || 0,
      currency: (trip.currency as string) || 'JOD',
      total_seats: trip.totalSeats,
      available_seats: trip.availableSeats,
      booked_seats_count: bookedSeatsCount,
      vehicle: vehicle
        ? {
            make_model: [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '),
            year: vehicle.modelYear,
            plate_number: vehicle.plateNumber,
            color: vehicle.color,
          }
        : null,
      status: trip.status,
      passengers: bookings.map((b) => {
        const passenger = b.passenger as Record<string, unknown> | null;
        return {
          booking_id: b.id,
          passenger_name: passenger ? (passenger.fullName as string) : 'Unknown',
          seats_booked: b.seatsBooked,
          seat_numbers: seatNumbersFor(b as never),
        };
      }),
      can_start: canStart,
    };
  }

  private async toRecentBookings(driverId: string): Promise<Record<string, unknown>[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { trip: { driverId } },
      include: {
        trip: { select: { id: true, originCity: true, destinationCity: true, departureTime: true } },
        passenger: { select: { fullName: true } },
      },
      orderBy: { trip: { departureTime: 'desc' } },
      take: 5,
    });
    return bookings.map((b) => {
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
        seat_numbers: seatNumbersFor(b as unknown as never),
        agreed_fare: Number(b.agreedFare),
        status: b.status,
        created_at: b.createdAt,
      };
    });
  }

  async getHome(driverId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });

    const todayStart = jordanStartOfToday();
    const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);
    const now = new Date();

    const [subscription, nextTrip, completedToday, tripsToday, recentBookings] = await Promise.all([
      this.toSubscriptionSection(driverId),
      this.prisma.trip.findFirst({
        where: {
          driverId,
          status: { in: ['published', 'full'] },
          departureTime: { gt: now },
        },
        include: {
          vehicle: true,
          bookings: {
            where: { status: 'confirmed' },
            include: { passenger: { select: { id: true, fullName: true } } },
          },
        },
        orderBy: { departureTime: 'asc' },
      }),
      this.prisma.trip.count({
        where: { driverId, status: 'completed', departureTime: { gte: todayStart, lt: tomorrowStart } },
      }),
      this.prisma.trip.count({
        where: { driverId, departureTime: { gte: todayStart, lt: tomorrowStart } },
      }),
      this.toRecentBookings(driverId),
    ]);

    const nextTripPayload = this.toNextTrip(nextTrip as unknown as Record<string, unknown> | null);
    return {
      driver: {
        id: user.id,
        full_name: user.fullName,
        profile_picture_url: user.avatarUrl,
        rating: Number(user.avgRating ?? 0),
        total_trips_completed: Number(profile?.totalTrips ?? 0),
      },
      subscription,
      next_trip: nextTripPayload,
      summary: {
        completed_trips_today: completedToday,
        reserved_seats_for_next_trip: nextTripPayload
          ? (nextTripPayload.booked_seats_count as number)
          : 0,
        trips_today: tripsToday,
      },
      recent_bookings: recentBookings,
    };
  }

  async getSubscription(driverId: string): Promise<Record<string, unknown>> {
    const current = (await this.balance.findCurrentSubscription(driverId)) as unknown as
      | (SubscriptionLike & { id: string }) 
      | null;
    const history = await this.subscriptions.getMySubscriptions(driverId);
    return {
      subscription: current
        ? {
            tier: String(current.planName ?? 'free').toLowerCase(),
            price: Number(current.planCost ?? 0),
            currency: 'JOD',
            expires_at: current.expiresAt,
            days_remaining: Math.max(
              0,
              Math.ceil((((current.expiresAt as Date | null)?.getTime() ?? 0) - Date.now()) / DAY_MS),
            ),
            balance: Number(current.balance ?? 0),
            plan_name: current.planName,
            free_trips: freeTripsFor(current),
          }
        : null,
      history: (history as Record<string, unknown>[]).map((s) => {
        const plan = s.plan as Record<string, unknown>;
        return {
          id: s.id,
          plan_name: plan.name,
          period_days: plan.period_days,
          balance: s.balance,
          status: s.status,
          created_at: s.created_at,
          expires_at: s.expires_at,
        };
      }),
    };
  }

  async getPassengerHome(passengerId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({ where: { id: passengerId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const now = new Date();

    const nextBooking = await this.prisma.booking.findFirst({
      where: {
        passengerId,
        status: { in: ['pending', 'confirmed'] },
        trip: { departureTime: { gte: now } },
      },
      include: {
        trip: {
          include: {
            driver: { select: { id: true, fullName: true, avgRating: true, avatarUrl: true } },
            vehicle: { select: { id: true, vehicleType: true, plateNumber: true, seats: true } },
          },
        },
      },
      orderBy: { trip: { departureTime: 'asc' } },
    });

    const [lastSearched, recentBookings] = await Promise.all([
      this.recentSearch.getRecent(passengerId, 5),
      this.prisma.booking.findMany({
        where: { passengerId },
        include: {
          trip: {
            include: {
              driver: { select: { id: true, fullName: true, avgRating: true, avatarUrl: true } },
              vehicle: { select: { id: true, vehicleType: true, plateNumber: true, seats: true } },
            },
          },
          ratings: { select: { stars: true }, where: { raterId: passengerId } },
        },
        orderBy: { trip: { departureTime: 'desc' } },
        take: 10,
      }),
    ]);

    const lastTrips = recentBookings
      .filter(
        (b) =>
          b.trip &&
          (b.status === 'completed' ||
            new Date((b.trip as unknown as { departureTime: Date }).departureTime) < now),
      )
      .slice(0, 5)
      .map((b) => {
        const trip = b.trip as unknown as {
          id: string;
          originCity: string;
          originArea: string | null;
          destinationCity: string;
          destinationArea: string | null;
          departureTime: Date;
        };
        const ratings = (b as unknown as { ratings: { stars: number }[] }).ratings ?? [];
        return {
          booking_id: b.id,
          trip_id: trip.id,
          origin: { city: trip.originCity, area: trip.originArea },
          destination: { city: trip.destinationCity, area: trip.destinationArea },
          departure_time: trip.departureTime,
          status: b.status,
          satisfaction_rating: ratings[0] ? Number(ratings[0].stars) : null,
          trip_cost: Number(b.agreedFare),
          currency: b.currency ?? 'JOD',
        };
      });

    const nb = nextBooking as unknown as {
      id: string;
      referenceCode: string;
      status: string;
      seatsBooked: number;
      agreedFare: unknown;
      currency: string | null;
      trip: {
        id: string;
        originCity: string;
        originArea: string | null;
        destinationCity: string;
        destinationArea: string | null;
        departureTime: Date;
        driver: { id: string; fullName: string | null; avgRating: unknown; avatarUrl: string | null } | null;
        vehicle: { id: string; vehicleType: string; plateNumber: string; seats: number } | null;
      } | null;
    } | null;

    return {
      passenger: {
        id: user.id,
        full_name: user.fullName,
        profile_picture_url: user.avatarUrl,
        // Falsy (0/unset) ratings render null, mirroring Express.
        rating: user.avgRating ? Number(user.avgRating) : null,
      },
      next_booking: !nb || !nb.trip
        ? null
        : {
            booking_id: nb.id,
            reference_code: nb.referenceCode,
            status: nb.status,
            seats_booked: nb.seatsBooked,
            agreed_fare: Number(nb.agreedFare),
            currency: nb.currency ?? 'JOD',
            trip: {
              trip_id: nb.trip.id,
              origin: { city: nb.trip.originCity, area: nb.trip.originArea },
              destination: { city: nb.trip.destinationCity, area: nb.trip.destinationArea },
              departure_time: nb.trip.departureTime,
            },
            driver: nb.trip.driver
              ? {
                  id: nb.trip.driver.id,
                  full_name: nb.trip.driver.fullName,
                  rating: Number(nb.trip.driver.avgRating) || 0,
                  image: nb.trip.driver.avatarUrl,
                }
              : null,
            vehicle: nb.trip.vehicle
              ? {
                  vehicle_id: nb.trip.vehicle.id,
                  type: nb.trip.vehicle.vehicleType,
                  plate: nb.trip.vehicle.plateNumber,
                  seats: nb.trip.vehicle.seats,
                }
              : null,
          },
      last_searched_trips: lastSearched,
      last_trips: lastTrips,
    };
  }

  async invalidateHomeCache(_driverId: string): Promise<void> {
    // No home cache exists (homes are always built fresh); kept for call sites.
    void _driverId;
  }

  async invalidatePassengerHome(_passengerId: string): Promise<void> {
    void _passengerId;
  }

  async invalidateHomeForTrip(tripId: string, driverId: string): Promise<void> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { tripId },
        select: { passengerId: true },
      });
      const userIds = new Set([driverId, ...bookings.map((b) => b.passengerId)]);
      for (const userId of userIds) {
        if (!userId) continue;
        try {
          this.realtime.emitToUser(userId, 'home:invalidate', { trip_id: tripId });
        } catch {
          // socket layer offline (e.g. tests) — ignore
        }
      }
    } catch (err) {
      this.logger.warn(`[homeService] home invalidation failed: ${(err as Error).message}`);
    }
  }
}
