import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
  forwardRef,
} from '@nestjs/common';
import {
  jordanDateOnly,
  jordanMinutesOfDay,
  jordanStartOfToday,
  jordanWeekday,
} from '../../common/utils/jordan-time.js';
import { seatNumbersFor } from '../../common/utils/seat-numbers.js';
import {
  parseJordanDateOnly,
  parseJordanDayStart,
  parseTimezoneAware,
} from '../../common/utils/time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CommissionService } from '../subscriptions/commission.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { RecentSearchService } from '../subscriptions/recent-search.service.js';
import { SeatLockService } from './seat-lock.service.js';
import { TRIP_START_WINDOW_MS } from './trip.constants.js';
import { TripExpiryService } from './trip-expiry.service.js';
import { getMapsConfig } from '../maps/maps.config.js';
import { PickupService } from '../maps/pickup.service.js';
import { RouteService } from '../maps/route.service.js';
import { assertNoOverlappingTrip } from './trip-overlap.js';
import type { CreateTripDto } from './dto/create-trip.dto.js';

function validationError(code: string, message: string, details?: unknown): UnprocessableEntityException {
  return new UnprocessableEntityException(
    details === undefined ? { message, code } : { message, code, details },
  );
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

interface StopInput {
  stop_name?: string;
  name?: string;
  city?: string;
  address?: string;
  lat?: string | number;
  lng?: string | number;
  stop_lat?: string | number;
  stop_lng?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  stop_order?: number;
  stop_type?: string;
}

function buildStopRecord(
  tripId: string,
  src: StopInput,
  fallbackOrder: number,
  fallbackType: string,
): Record<string, unknown> | null {
  const name = (src.stop_name ?? src.name ?? src.city ?? null) as string | null;
  const city = (src.city ?? src.stop_name ?? src.name ?? null) as string | null;
  const address = (src.address ?? null) as string | null;
  const latRaw = src.lat ?? src.stop_lat ?? src.latitude ?? null;
  const lngRaw = src.lng ?? src.stop_lng ?? src.longitude ?? null;
  const stopOrder = src.stop_order != null ? Number(src.stop_order) : fallbackOrder;
  const stopType = src.stop_type ?? fallbackType ?? 'both';
  return {
    tripId,
    stopOrder,
    stopName: typeof name === 'string' ? name.trim() || null : null,
    city: typeof city === 'string' ? city.trim() || null : null,
    address: typeof address === 'string' ? address.trim() || null : null,
    lat: latRaw === null || latRaw === undefined || latRaw === '' ? null : String(latRaw),
    lng: lngRaw === null || lngRaw === undefined || lngRaw === '' ? null : String(lngRaw),
    stopLat: latRaw === null || latRaw === undefined || latRaw === '' ? null : String(latRaw),
    stopLng: lngRaw === null || lngRaw === undefined || lngRaw === '' ? null : String(lngRaw),
    stopType,
  };
}

// Port of Main Server/Services/tripService.ts (Wave 5.1 scope: create, reads,
// search, seats, seat-adjacent helpers; lifecycle/route/pickup land in
// subsequent sub-waves of this file).
@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commission: CommissionService,
    private readonly seatLocks: SeatLockService,
    private readonly recentSearch: RecentSearchService,
    private readonly notifications: NotificationsService,
    private readonly home: HomeService,
    private readonly realtime: RealtimeGateway,
    @Inject(forwardRef(() => TripExpiryService))
    private readonly expiry: TripExpiryService,
    private readonly routeService: RouteService,
    private readonly pickupService: PickupService,
  ) {}

  private async hasRemainingFreeTrips(driverId: string): Promise<boolean> {
    const subscription = await this.prisma.driverSubscription.findFirst({
      where: { driverId, status: 'active', expiresAt: { gt: new Date() } },
      include: { plan: { select: { isFree: true } } },
      orderBy: [{ plan: { isFree: 'desc' } }, { planPeriodDays: 'asc' }, { createdAt: 'asc' }],
    });
    if (!subscription) return false;
    const offer = subscription.freeOffer as unknown as { type?: string; value?: number; max?: number } | null;
    if (!offer || offer.type !== 'trips') return false;
    if (!subscription.plan || !subscription.plan.isFree) return false;
    const used = Number(subscription.freeTripsUsed) || 0;
    const value = Number(offer.value);
    const limit = Number.isFinite(value) && value > 0 ? value : Number(offer.max) || 0;
    return used < limit;
  }

  private async assertFreeTripsAvailable(driverId: string): Promise<void> {
    const subscription = await this.prisma.driverSubscription.findFirst({
      where: { driverId, status: 'active', expiresAt: { gt: new Date() } },
      include: { plan: { select: { isFree: true } } },
      orderBy: [{ plan: { isFree: 'desc' } }, { planPeriodDays: 'asc' }, { createdAt: 'asc' }],
    });
    if (!subscription) return;
    const offer = subscription.freeOffer as unknown as { type?: string; value?: number; max?: number } | null;
    if (!offer || offer.type !== 'trips') return;
    if (!subscription.plan || !subscription.plan.isFree) return;
    const value = Number(offer.value);
    const limit = Number.isFinite(value) && value > 0 ? value : Number(offer.max) || 0;
    const used = Number(subscription.freeTripsUsed) || 0;
    if (used < limit) return;
    const paidSub = await this.prisma.driverSubscription.findFirst({
      where: { driverId, status: 'active', expiresAt: { gt: new Date() }, plan: { isFree: false } },
    });
    if (paidSub) return;
    throw new UnprocessableEntityException({
      message: 'FREE_TRIPS_EXHAUSTED_PUBLISHING',
      code: 'FREE_TRIPS_EXHAUSTED',
    });
  }

  private async assertCanPublish(
    driverId: string,
    farePerSeat: number,
  ): Promise<{ minimum: number; totalBalance: number }> {
    const { current, minimum, totalBalance } = await this.commission.getGatingSnapshot(
      driverId,
      farePerSeat,
    );
    if (!current) {
      throw new UnprocessableEntityException({
        message: 'YOU_NEED_AN_ACTIVE_PLAN_TO_PUBLISH_TRIPS',
        code: 'NO_ACTIVE_PLAN',
      });
    }
    if (await this.hasRemainingFreeTrips(driverId)) return { minimum, totalBalance };
    if (totalBalance < minimum) {
      throw new UnprocessableEntityException({
        message: 'INSUFFICIENT_BALANCE_TO_PUBLISH_TRIP',
        code: 'INSUFFICIENT_BALANCE',
        params: { minimum: minimum.toFixed(2), balance: totalBalance.toFixed(2) },
      });
    }
    return { minimum, totalBalance };
  }

  async createTrip(
    driverId: string,
    data: CreateTripDto,
  ): Promise<{
    trip_id: string;
    status: string;
    total_seats: number;
    available_seats: number;
    estimated_earnings: number;
    total_profit: number;
    message: string;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    if (user.role !== 'driver') {
      throw new ForbiddenException({ message: 'ONLY_DRIVERS_CAN_CREATE_TRIPS', code: 'FORBIDDEN' });
    }
    if (!user.isVerified) {
      throw new ForbiddenException({ message: 'DRIVER_NOT_VERIFIED', code: 'FORBIDDEN' });
    }

    const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
    if (!vehicle) {
      throw new ForbiddenException({ message: 'DRIVER_HAS_NO_REGISTERED_VEHICLE', code: 'FORBIDDEN' });
    }
    if (!vehicle.isVerified) {
      throw new ForbiddenException({ message: 'DRIVER_VEHICLE_IS_NOT_VERIFIED', code: 'FORBIDDEN' });
    }

    const seats = data.seats ?? [];
    if (seats.length !== vehicle.seats) {
      throw validationError(
        'SEAT_COUNT_DOES_NOT_MATCH_VEHICLE_TOTAL_SEATS',
        'SEAT_COUNT_DOES_NOT_MATCH_VEHICLE_TOTAL_SEATS',
      );
    }
    const seatNumbers = seats.map((s) => Number(s.seat_number)).sort((a, b) => a - b);
    const expected = Array.from({ length: vehicle.seats }, (_, i) => i + 1);
    if (JSON.stringify(seatNumbers) !== JSON.stringify(expected)) {
      throw validationError(
        'SEAT_NUMBERS_MUST_BE_SEQUENTIAL_FROM_1_TO_TOTAL_SEATS',
        'SEAT_NUMBERS_MUST_BE_SEQUENTIAL_FROM_1_TO_TOTAL_SEATS',
      );
    }
    const availableSeats = seats.filter((s) => s.type === 'available');
    if (availableSeats.length === 0) {
      throw validationError(
        'AT_LEAST_ONE_SEAT_MUST_BE_AVAILABLE',
        'AT_LEAST_ONE_SEAT_MUST_BE_AVAILABLE',
      );
    }
    if (seats.filter((s) => s.type === 'driver').length !== 1) {
      throw validationError(
        'EXACTLY_ONE_SEAT_MUST_BE_MARKED_AS_DRIVER',
        'EXACTLY_ONE_SEAT_MUST_BE_MARKED_AS_DRIVER',
      );
    }

    const departureDateTime = parseTimezoneAware(data.departure_time);
    if (departureDateTime <= new Date()) {
      throw validationError(
        'DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE',
        'DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE',
      );
    }

    const isRecurring = data.type_of_trip === 'repeated';
    if (isRecurring && (!data.repeated_days || data.repeated_days.length === 0)) {
      throw validationError(
        'REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS',
        'REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS',
      );
    }
    if (isRecurring && !data.repeated_end_date) {
      throw validationError(
        'END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS',
        'END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS',
      );
    }
    if (isRecurring && data.repeated_end_date) {
      const endDate = parseJordanDateOnly(data.repeated_end_date);
      if (endDate <= departureDateTime) {
        throw validationError(
          'END_DATE_MUST_BE_AFTER_DEPARTURE_DATE',
          'END_DATE_MUST_BE_AFTER_DEPARTURE_DATE',
        );
      }
    }

    await assertNoOverlappingTrip(this.prisma, driverId, {
      departureTime: departureDateTime,
      isRecurring,
      recurrenceDays: isRecurring ? (data.repeated_days ?? null) : null,
      recurrenceEndDate: isRecurring ? (data.repeated_end_date ?? null) : null,
    });

    await this.assertFreeTripsAvailable(driverId);

    const fare = Number(data.fare_per_seat);
    await this.assertCanPublish(driverId, fare);

    const trip = await this.prisma.trip.create({
      data: {
        driverId,
        vehicleId: vehicle.id,
        originCity: data.origin_city,
        originArea: data.origin_area ?? null,
        originLat: data.origin_lat !== undefined ? Number(data.origin_lat) : null,
        originLng: data.origin_lng !== undefined ? Number(data.origin_lng) : null,
        destinationCity: data.destination_city,
        destinationArea: data.destination_area ?? null,
        destinationLat: data.destination_lat !== undefined ? Number(data.destination_lat) : null,
        destinationLng: data.destination_lng !== undefined ? Number(data.destination_lng) : null,
        departureTime: departureDateTime,
        totalSeats: vehicle.seats,
        availableSeats: availableSeats.length,
        farePerSeat: fare,
        totalProfit: fare * availableSeats.length,
        isRecurring,
        recurrenceDays: isRecurring ? (data.repeated_days ?? []) : [],
        recurrenceEndDate:
          isRecurring && data.repeated_end_date
            ? new Date(`${data.repeated_end_date}T00:00:00+03:00`)
            : null,
        genderPreference: (data.allowed_type ?? 'all') as 'all' | 'women_only' | 'men_only',
        driverInstructions: data.instructions ?? [],
        additionalInstructions: data.additional_instructions ?? null,
        status: 'published',
      },
    });

    await this.prisma.tripSeat.createMany({
      data: seats.map((s) => ({
        tripId: trip.id,
        seatNumber: Number(s.seat_number),
        seatType: s.type as 'driver' | 'available' | 'unavailable',
        wasAvailable: s.type === 'available',
      })),
    });

    const stopInputs: { record: StopInput; order: number; type: string }[] = [];
    if (data.stops && data.stops.length > 0) {
      data.stops.forEach((s, idx) => {
        stopInputs.push({
          record: s as StopInput,
          order: (s as { stop_order?: number }).stop_order ?? idx + 1,
          type: (s as { stop_type?: string }).stop_type ?? 'both',
        });
      });
    } else {
      const pickup = (data.pickup_point ?? data.pickup ?? data.pickup_location) as StopInput | undefined;
      const dropoff = (data.dropoff_point ??
        data.dropoff ??
        data.dropoff_location ??
        data.drop_off_point) as StopInput | undefined;
      let order = 1;
      if (pickup && Object.keys(pickup).length > 0) {
        stopInputs.push({ record: pickup, order: order++, type: 'pickup' });
      }
      for (const w of data.waypoints ?? []) {
        const ww = w as StopInput;
        const hasName = ww.stop_name ?? ww.name ?? ww.city;
        const hasCoords =
          ww.lat ?? ww.stop_lat ?? ww.lng ?? ww.stop_lng ?? ww.city;
        if (!hasName && !hasCoords) continue;
        stopInputs.push({ record: ww, order: order++, type: (ww.stop_type as string) ?? 'both' });
      }
      if (dropoff && Object.keys(dropoff).length > 0) {
        stopInputs.push({ record: dropoff, order: order++, type: 'dropoff' });
      }
    }
    if (stopInputs.length > 0) {
      const sorted = [...stopInputs].sort((a, b) => a.order - b.order);
      await this.prisma.tripStop.createMany({
        data: sorted.map((s, idx) => {
          const record = buildStopRecord(trip.id, s.record, idx + 1, s.type);
          return {
            tripId: trip.id,
            stopOrder: idx + 1,
            stopName: record?.stopName as string | null,
            city: record?.city as string | null,
            address: record?.address as string | null,
            lat: record?.lat as never,
            lng: record?.lng as never,
            stopLat: record?.stopLat as never,
            stopLng: record?.stopLng as never,
            stopType: (record?.stopType ?? 'both') as 'pickup' | 'dropoff' | 'both',
          };
        }),
      });
    }

    // Best-effort route computation (spec 013 O8): failure marks
    // route_status=failed and never blocks publish.
    try {
      await this.routeService.computeTripRoute(trip.id);
    } catch (err) {
      this.logger.warn(`route compute failed: ${(err as Error).message}`);
    }
    return {
      trip_id: trip.id,
      status: trip.status,
      total_seats: trip.totalSeats,
      available_seats: trip.availableSeats,
      estimated_earnings: trip.availableSeats * Number(trip.farePerSeat),
      total_profit: Number(trip.totalProfit),
      message: 'TRIP_PUBLISHED_SUCCESSFULLY',
    };
  }

  async getTripById(tripId: string): Promise<Record<string, unknown>> {
    try {
      await this.expiry.refreshStaleTrips([tripId]);
    } catch {
      // best-effort (mirrors the Express try/catch)
    }
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: { select: { id: true, fullName: true, phone: true, avgRating: true, avatarUrl: true } },
        vehicle: {
          select: {
            id: true,
            manufacturer: true,
            model: true,
            modelYear: true,
            plateNumber: true,
            color: true,
            seats: true,
          },
        },
        seats: true,
        stops: { orderBy: { stopOrder: 'asc' } },
        attributes: true,
        bookings: {
          where: { status: 'confirmed' },
          include: {
            passenger: {
              select: { id: true, fullName: true, phone: true, avgRating: true, avatarUrl: true },
            },
          },
        },
      },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });

    const t = trip as unknown as Record<string, unknown>;
    const driver = t.driver as Record<string, unknown> | null;
    const vehicle = t.vehicle as Record<string, unknown> | null;
    const stops = (t.stops as Record<string, unknown>[]) ?? [];
    const attributes = (t.attributes as Record<string, unknown>[]) ?? [];
    const bookings = (t.bookings as Record<string, unknown>[]) ?? [];

    const out: Record<string, unknown> = { ...(t as object) };
    for (const key of [
      'driver', 'vehicle', 'bookings', 'originCity', 'originArea', 'originAddress',
      'originLat', 'originLng', 'destinationCity', 'destinationArea', 'destinationAddress',
      'destinationLat', 'destinationLng', 'farePerSeat', 'totalProfit', 'totalSeats',
      'availableSeats', 'genderPreference', 'driverInstructions', 'additionalInstructions',
      'isRecurring', 'recurrenceDays', 'recurrenceEndDate', 'createdAt', 'updatedAt',
      'isFeatured', 'featuredUntil', 'isBlockedByBalance', 'isModerated', 'moderationReason',
      'moderatedBy', 'arrivalTime',
    ]) {
      delete out[key];
    }
    out.trip = {
      trip_id: t.id,
      driver: driver
        ? {
            id: driver.id,
            full_name: driver.fullName,
            phone: driver.phone,
            rating: Number(driver.avgRating) || 0,
            profile_picture_url: driver.avatarUrl ?? null,
          }
        : null,
      vehicle: vehicle
        ? {
            vehicle_id: vehicle.id,
            make_model: [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '),
            year: vehicle.modelYear,
            plate_number: vehicle.plateNumber,
            color: vehicle.color,
            total_seats: vehicle.seats,
          }
        : null,
      origin: {
        city: t.originCity,
        area: t.originArea,
        lat: toNumber(t.originLat),
        lng: toNumber(t.originLng),
      },
      destination: {
        city: t.destinationCity,
        area: t.destinationArea,
        lat: toNumber(t.destinationLat),
        lng: toNumber(t.destinationLng),
      },
      departure_time: t.departureTime,
      fare_per_seat: Number(t.farePerSeat),
      total_profit: Number(t.totalProfit) || 0,
      currency: (t.currency as string) || 'JOD',
      total_seats: t.totalSeats,
      available_seats: t.availableSeats,
      status: t.status,
      is_recurring: t.isRecurring,
      recurrence_days: t.recurrenceDays,
      recurrence_end_date: t.recurrenceEndDate,
      gender_preference: t.genderPreference,
      attributes: attributes.map((a) => ({ key: a.attrKey, value: a.attrValue === 'true' })),
      waypoints: stops.map((s) => ({
        stop_name: s.stopName,
        stop_lat: toNumber(s.lat ?? s.stopLat),
        stop_lng: toNumber(s.lng ?? s.stopLng),
      })),
      instructions: t.driverInstructions,
      additional_instructions: t.additionalInstructions,
      created_at: t.createdAt,
    };
    out.passengers = bookings.map((b) => {
      const passenger = b.passenger as Record<string, unknown> | null;
      return {
        booking_id: b.id,
        passenger: passenger
          ? {
              id: passenger.id,
              full_name: passenger.fullName,
              phone: passenger.phone,
              rating: Number(passenger.avgRating) || 0,
              profile_picture_url: passenger.avatarUrl ?? null,
            }
          : null,
        seats_booked: b.seatsBooked,
        seat_numbers: seatNumbersFor(b as never),
        agreed_fare: Number(b.agreedFare),
        booking_status: b.status,
        dropoff_place: b.dropoffPlace,
        dropoff_deadline: b.dropoffDeadline,
        created_at: b.createdAt,
      };
    });
    return out;
  }

  async getTripOptions(tripId: string): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true, availableSeats: true },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (!['published', 'full'].includes(trip.status)) {
      throw new ConflictException({ message: 'TRIP_NOT_BOOKABLE', code: 'TRIP_NOT_BOOKABLE' });
    }
    const stops = await this.prisma.tripStop.findMany({
      where: { tripId },
      orderBy: { stopOrder: 'asc' },
    });
    const shape = (s: {
      id: string;
      stopOrder: number;
      stopName: string | null;
      city: string | null;
      address: string | null;
      lat: unknown;
      lng: unknown;
      stopLat: unknown;
      stopLng: unknown;
      stopType: string | null;
    }): Record<string, unknown> => ({
      stop_id: s.id,
      stop_order: s.stopOrder,
      stop_name: s.stopName,
      city: s.city,
      address: s.address ?? null,
      lat: toNumber(s.lat) ?? toNumber(s.stopLat),
      lng: toNumber(s.lng) ?? toNumber(s.stopLng),
      stop_type: s.stopType ?? 'both',
    });
    const points = stops.map((s) => shape(s as unknown as Parameters<typeof shape>[0]));
    return {
      trip_id: trip.id,
      available_seats: trip.availableSeats,
      drop_off_points: points.filter((p) => ['dropoff', 'both'].includes(p.stop_type as string)),
      pickup_points: points.filter((p) => ['pickup', 'both'].includes(p.stop_type as string)),
      points,
      stops: points,
    };
  }

  async getTripSeats(tripId: string): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, status: true, totalSeats: true, availableSeats: true, driverId: true },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    const seats = await this.prisma.tripSeat.findMany({
      where: { tripId },
      orderBy: { seatNumber: 'asc' },
    });
    const shaped = await Promise.all(
      seats.map(async (s) => {
        let lock = { locked: false, passengerId: null as string | null, expiresAt: null as string | null };
        try {
          lock = await this.seatLocks.checkSeatLock(tripId, s.seatNumber);
        } catch {
          // best-effort: treat as unlocked
        }
        const isAvailable = s.seatType === 'available' && !lock.locked;
        return {
          seat_number: s.seatNumber,
          seat_type: s.seatType,
          was_available: Boolean(s.wasAvailable),
          is_available: isAvailable,
          is_locked: lock.locked,
          locked_by: lock.passengerId,
          locked_expires_at: lock.expiresAt,
        };
      }),
    );
    const available = shaped.filter((s) => s.seat_type === 'available');
    return {
      trip_id: trip.id,
      status: trip.status,
      total_seats: trip.totalSeats,
      available_seats: trip.availableSeats,
      seats_count: shaped.length,
      seats: shaped,
      empty_seats: shaped.filter((s) => s.seat_type === 'available' && !s.is_locked),
      empty_seats_count: shaped.filter((s) => s.seat_type === 'available' && !s.is_locked).length,
      available_seats_detail: available,
    };
  }

  async getDriverTrips(
    driverId: string,
    status?: string | null,
  ): Promise<Record<string, unknown>[]> {
    // Unknown status strings match nothing (Express exact-equality semantics).
    const knownStatuses = ['published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled'];
    if (status && !knownStatuses.includes(status)) return [];
    try {
      const live = await this.prisma.trip.findMany({
        where: {
          driverId,
          isRecurring: false,
          status: { in: ['published', 'full', 'in_progress', 'ongoing'] },
        },
        select: { id: true },
      });
      await this.expiry.refreshStaleTrips(live.map((t) => t.id));
    } catch {
      // best-effort
    }
    const trips = await this.prisma.trip.findMany({
      where: { driverId, ...(status ? { status: status as never } : {}) },
      include: {
        seats: true,
        stops: { orderBy: { stopOrder: 'asc' } },
      },
      orderBy: { departureTime: 'asc' },
    });
    return trips.map((t) => {
      const seats = (t.seats as unknown as Record<string, unknown>[]) ?? [];
      const stops = (t.stops as unknown as Record<string, unknown>[]) ?? [];
      return {
        trip_id: t.id,
        origin_city: t.originCity,
        origin_area: t.originArea,
        destination_city: t.destinationCity,
        destination_area: t.destinationArea,
        departure_time: t.departureTime,
        arrival_time: t.arrivalTime,
        fare_per_seat: Number(t.farePerSeat),
        total_profit: Number(t.totalProfit) || 0,
        currency: t.currency ?? 'JOD',
        total_seats: t.totalSeats,
        available_seats: t.availableSeats,
        gender_preference: t.genderPreference,
        is_recurring: t.isRecurring,
        recurrence_days: t.recurrenceDays,
        recurrence_end_date: t.recurrenceEndDate,
        instructions: t.driverInstructions,
        additional_instructions: t.additionalInstructions,
        status: t.status,
        seats: seats.map((s) => ({
          seat_number: s.seatNumber,
          seat_type: s.seatType,
          was_available: Boolean(s.wasAvailable),
        })),
        waypoints: stops.map((s) => ({
          stop_name: s.stopName,
          stop_lat: toNumber(s.lat ?? s.stopLat),
          stop_lng: toNumber(s.lng ?? s.stopLng),
        })),
        created_at: t.createdAt,
      };
    });
  }

  async getAvailableTrips(filters: {
    originCity?: string;
    destinationCity?: string;
    date?: string;
    returnDate?: string;
    genderPreference?: string | null;
    timeFrom?: string;
    timeTo?: string;
    vehicleType?: string;
    seats?: unknown;
  }): Promise<{ trips: Record<string, unknown>[]; returningTrips: Record<string, unknown>[] }> {
    const { date, returnDate } = filters;
    if (date) {
      const queryDate = parseJordanDayStart(date);
      if (jordanDateOnly(queryDate) < jordanStartOfToday()) {
        throw validationError('DATE_CANNOT_BE_IN_THE_PAST', 'DATE_CANNOT_BE_IN_THE_PAST');
      }
    }
    if (returnDate) {
      const rd = parseJordanDayStart(returnDate);
      if (jordanDateOnly(rd) < jordanStartOfToday()) {
        throw validationError('DATE_CANNOT_BE_IN_THE_PAST', 'DATE_CANNOT_BE_IN_THE_PAST');
      }
      if (date && jordanDateOnly(rd) < jordanDateOnly(parseJordanDayStart(date))) {
        throw validationError('DATE_CANNOT_BE_IN_THE_PAST', 'DATE_CANNOT_BE_IN_THE_PAST');
      }
    }
    if (filters.timeFrom && filters.timeTo && filters.timeTo < filters.timeFrom) {
      throw validationError('TIME_FROM_AFTER_TIME_TO', 'TIME_FROM_AFTER_TIME_TO');
    }

    const trips = await this.fetchTripsForDate({
      targetDate: date ?? null,
      originCity: filters.originCity,
      destinationCity: filters.destinationCity,
      genderPreference: filters.genderPreference,
      timeFrom: filters.timeFrom,
      timeTo: filters.timeTo,
      vehicleType: filters.vehicleType,
      seats: filters.seats,
    });
    let returningTrips: Record<string, unknown>[] = [];
    if (returnDate && filters.originCity && filters.destinationCity) {
      returningTrips = await this.fetchTripsForDate({
        targetDate: returnDate,
        originCity: filters.destinationCity,
        destinationCity: filters.originCity,
        genderPreference: filters.genderPreference,
        timeFrom: filters.timeFrom,
        timeTo: filters.timeTo,
        vehicleType: filters.vehicleType,
        seats: filters.seats,
      });
    }
    return { trips, returningTrips };
  }

  private async fetchTripsForDate({
    targetDate,
    originCity,
    destinationCity,
    genderPreference,
    timeFrom,
    timeTo,
    vehicleType,
    seats,
  }: {
    targetDate: string | null;
    originCity?: string;
    destinationCity?: string;
    genderPreference?: string | null;
    timeFrom?: string;
    timeTo?: string;
    vehicleType?: string;
    seats?: unknown;
  }): Promise<Record<string, unknown>[]> {
    const seatCount = Number(seats);
    const hasDate = Boolean(targetDate);
    const dayStart = hasDate ? jordanDateOnly(parseJordanDayStart(targetDate)) : null;
    const now = new Date();

    type TripWhere = Record<string, unknown>;
    const andConditions: TripWhere[] = [];
    if (hasDate && dayStart) {
      const weekday = jordanWeekday(dayStart);
      andConditions.push({
        OR: [
          { isRecurring: false, departureTime: { gte: dayStart } },
          {
            isRecurring: true,
            AND: [
              { OR: [{ recurrenceEndDate: { gte: dayStart } }, { recurrenceEndDate: null }] },
              {
                OR: [
                  { departureTime: { gte: dayStart } },
                  { recurrenceDays: { has: weekday } },
                ],
              },
            ],
          },
        ],
      });
      andConditions.push({ OR: [{ isRecurring: true }, { departureTime: { gt: now } }] });
    } else {
      andConditions.push({
        OR: [
          { isRecurring: false, departureTime: { gt: now } },
          {
            isRecurring: true,
            OR: [{ recurrenceEndDate: { gte: now } }, { recurrenceEndDate: null }],
          },
        ],
      });
    }

    const rows = await this.prisma.trip.findMany({
      where: {
        status: 'published',
        isModerated: false,
        availableSeats:
          Number.isFinite(seatCount) && seatCount > 0 ? { gte: seatCount } : { gt: 0 },
        ...(originCity ? { originCity } : {}),
        ...(destinationCity ? { destinationCity } : {}),
        ...(genderPreference && genderPreference !== 'all'
          ? { genderPreference: { in: [genderPreference as never] } }
          : {}),
        AND: andConditions as never,
        seats: { some: { seatType: 'available' } },
      },
      include: {
        seats: { where: { seatType: 'available' } },
        stops: true,
        vehicle: true,
        driver: { select: { id: true, fullName: true, avgRating: true, avatarUrl: true, gender: true } },
      },
      orderBy: { departureTime: 'asc' },
    });

    // Vehicle-type filter as INNER join: drop rows whose vehicle was filtered out.
    const withVehicle = vehicleType
      ? rows.filter(
          (r) =>
            r.vehicle !== null &&
            (r.vehicle as unknown as { vehicleType: string }).vehicleType === vehicleType,
        )
      : rows;

    const anchor = dayStart ?? jordanStartOfToday();
    const toMin = (hhmm: string): number => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };
    const fromMin = timeFrom ? toMin(timeFrom) : null;
    const toMinVal = timeTo ? toMin(timeTo) : null;

    const kept = withVehicle.filter((t) => {
      const depMs = new Date(t.departureTime).getTime();
      if (!t.isRecurring && depMs <= now.getTime()) return false;
      if (t.isRecurring && dayStart) {
        const firstOk =
          new Date(t.departureTime).getTime() >= dayStart.getTime() ||
          (t.recurrenceDays as number[]).includes(jordanWeekday(dayStart));
        if (!firstOk) return false;
      }
      const mins = jordanMinutesOfDay(t.departureTime);
      if (fromMin !== null && toMinVal !== null) {
        return mins >= fromMin && mins <= toMinVal;
      }
      if (fromMin !== null) {
        if (t.isRecurring) return mins >= fromMin;
        const cutoff = Math.max(anchor.getTime() + fromMin * 60000, now.getTime());
        return depMs >= cutoff;
      }
      if (toMinVal !== null) {
        if (t.isRecurring) return mins <= toMinVal;
        const upper = anchor.getTime() + toMinVal * 60000;
        return depMs > now.getTime() && depMs <= upper;
      }
      return true;
    });

    const anchorFromMs =
      fromMin !== null ? anchor.getTime() + fromMin * 60000 : null;
    kept.sort((a, b) => {
      if (fromMin !== null && toMinVal !== null && anchorFromMs !== null) {
        const da = Math.abs(new Date(a.departureTime).getTime() - anchorFromMs);
        const db = Math.abs(new Date(b.departureTime).getTime() - anchorFromMs);
        if (da !== db) return da - db;
      }
      return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    });

    return kept as unknown as Record<string, unknown>[];
  }

  async cancelTrip(
    driverId: string,
    tripId: string,
  ): Promise<{ trip: { id: string; status: string; notified_passengers: number } }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (['in_progress', 'ongoing', 'completed'].includes(trip.status)) {
      throw new ForbiddenException({
        message: 'A_TRIP_THAT_HAS_ALREADY_STARTED_CANNOT_BE_CANCELLED',
        code: 'FORBIDDEN',
      });
    }
    if (trip.status === 'cancelled') {
      throw new ConflictException({ message: 'TRIP_IS_ALREADY_CANCELLED', code: 'ALREADY_CANCELLED' });
    }

    const now = new Date();
    await this.prisma.trip.update({ where: { id: tripId }, data: { status: 'cancelled' } });
    // Notify BEFORE flipping bookings (notifyConfirmedPassengers only sees
    // confirmed rows) — order mirrors Express.
    let notifiedPassengers = 0;
    try {
      notifiedPassengers = await this.notifications.notifyConfirmedPassengers([tripId], 'TRIP_CANCELLED', {
        data: { trip_id: tripId },
      });
    } catch {
      // best-effort
    }
    await this.prisma.booking.updateMany({
      where: { tripId, status: { in: ['confirmed', 'pending'] } },
      data: {
        status: 'cancelled',
        cancellationReason: 'Trip cancelled by driver',
        cancelledBy: driverId,
        cancelledAt: now,
      },
    });
    const seats = await this.prisma.tripSeat.findMany({ where: { tripId }, select: { seatNumber: true } });
    for (const s of seats) {
      try {
        await this.seatLocks.releaseSeatLock(tripId, s.seatNumber);
      } catch {
        // best-effort
      }
    }
    try {
      await this.home.invalidateHomeForTrip(tripId, driverId);
    } catch {
      // best-effort
    }
    return { trip: { id: tripId, status: 'cancelled', notified_passengers: notifiedPassengers } };
  }

  async startTrip(
    driverId: string,
    tripId: string,
  ): Promise<{ trip_id: string; status: string; message: string; tracking_link: string }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_START_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (!['published', 'full'].includes(trip.status)) {
      throw new UnprocessableEntityException({
        message: 'TRIP_CANNOT_BE_STARTED_FROM_ITS_CURRENT_STATUS',
        code: 'INVALID_TRIP_STATUS',
      });
    }
    if (new Date(trip.departureTime).getTime() - Date.now() > TRIP_START_WINDOW_MS) {
      throw new BadRequestException({
        message: 'TRIP_CANNOT_BE_STARTED_YET_IT_CAN_ONLY_BE_STARTED',
        code: 'TOO_EARLY_TO_START',
      });
    }

    const { current, minimum, totalBalance } = await this.commission.getGatingSnapshot(
      driverId,
      Number(trip.farePerSeat),
    );
    if (!current) {
      throw new UnprocessableEntityException({
        message: 'YOU_NEED_AN_ACTIVE_PLAN_TO_START_TRIPS',
        code: 'NO_ACTIVE_PLAN',
      });
    }
    if (!(await this.hasRemainingFreeTrips(driverId)) && totalBalance < minimum) {
      const user = await this.prisma.user.findUnique({ where: { id: driverId } });
      if (user) {
        try {
          await this.notifications.sendToUser(
            user as unknown as Parameters<NotificationsService['sendToUser']>[0],
            'INSUFFICIENT_BALANCE_START',
            {
              channels: ['sms', 'in_app', 'push'],
              data: { trip_id: tripId, required: minimum, balance: totalBalance },
            },
          );
        } catch {
          // best-effort
        }
      }
      throw new UnprocessableEntityException({
        message: 'YOUR_TRIP_CANNOT_BE_STARTED_BECAUSE_YOUR_BALANCE_IS_INSUFFICIENT',
        code: 'INSUFFICIENT_BALANCE',
      });
    }

    const now = new Date();
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'in_progress', startedAt: now },
    });
    try {
      await this.notifications.notifyConfirmedPassengers([tripId], 'TRIP_STARTED', {
        data: { trip_id: tripId },
      });
    } catch {
      // best-effort
    }
    // invalidateHomeCache is a documented no-op in Express (homes are never
    // cached); the home test asserts the key stays absent.
    const base =
      process.env.SOCKET_TRACKING_BASE_URL ?? 'wss://api.masar.app/socket.io';
    return {
      trip_id: tripId,
      status: 'in_progress',
      message: 'TRIP_STARTED_SUCCESSFULLY',
      tracking_link: `${base}?trip=${tripId}`,
    };
  }

  async completeTrip(
    driverId: string,
    tripId: string,
  ): Promise<{
    trip_id: string;
    commission: number;
    plan_name: string | null;
    balance_after: number;
    is_in_debt: boolean;
  }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_COMPLETE_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (!['in_progress', 'ongoing'].includes(trip.status)) {
      throw new UnprocessableEntityException({
        message: 'TRIP_CANNOT_BE_COMPLETED_FROM_ITS_CURRENT_STATUS',
        code: 'INVALID_TRIP_STATUS',
      });
    }

    const result = await this.commission.deductCommission(
      { id: trip.id, driverId: trip.driverId },
      driverId,
    );
    const now = new Date();
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'completed', completedAt: now },
    });
    // Actual-path compaction wires with Wave 5.5 (routeService).
    try {
      this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:ended', {
        trip_id: tripId,
        reason: 'completed',
      });
    } catch {
      // best-effort
    }

    const confirmed = await this.prisma.booking.findMany({
      where: { tripId, status: 'confirmed' },
      include: { passenger: { select: { id: true, phone: true, fcmToken: true, locale: true } } },
    });
    for (const booking of confirmed) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'completed', paymentStatus: 'paid_cash', completedAt: now },
      });
      try {
        const tripRow = await this.prisma.trip.findUnique({ where: { id: tripId } });
        await this.notifications.sendToUser(
          booking.passenger as unknown as Parameters<NotificationsService['sendToUser']>[0],
          'TRIP_COMPLETED_PROMPT',
          {
            channels: ['in_app'],
            vars: {
              route: tripRow ? `${tripRow.originCity}-${tripRow.destinationCity}` : '',
            },
            data: { trip_id: tripId },
          },
        );
      } catch {
        // best-effort per passenger
      }
    }

    try {
      const freeSub = await this.prisma.driverSubscription.findFirst({
        where: {
          driverId,
          status: 'active',
          expiresAt: { gt: new Date() },
          plan: { isFree: true },
        },
      });
      const offer = freeSub?.freeOffer as unknown as { type?: string } | null;
      if (freeSub && offer?.type === 'trips') {
        await this.prisma.driverSubscription.update({
          where: { id: freeSub.id },
          data: { freeTripsUsed: { increment: 1 } },
        });
      }
    } catch {
      // best-effort
    }

    if (result.isInDebt) {
      try {
        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (driver) {
          await this.notifications.sendToUser(
            driver as unknown as Parameters<NotificationsService['sendToUser']>[0],
            'DEBT',
            {
              channels: ['in_app', 'push'],
              vars: { balance: result.balanceAfter.toFixed(2) },
              data: { trip_id: tripId, commission: result.commission },
            },
          );
        }
      } catch {
        // best-effort
      }
    }

    try {
      await this.home.invalidateHomeForTrip(tripId, driverId);
    } catch {
      // best-effort (Express awaits and would throw; our hook never throws)
    }
    return {
      trip_id: tripId,
      commission: result.commission,
      plan_name: result.planName,
      balance_after: result.balanceAfter,
      is_in_debt: result.isInDebt,
    };
  }

  async updateTrip(
    driverId: string,
    tripId: string,
    data: {
      fare_per_seat?: string | number;
      arrival_time?: string;
      gender_preference?: string;
      driver_instructions?: string[];
      additional_instructions?: string;
      attributes?: { attr_key?: string; attr_value?: string }[];
      stops?: {
        stop_order?: number;
        city?: string;
        address?: string;
        lat?: string | number;
        lng?: string | number;
        stop_type?: string;
        estimated_arrival?: string;
      }[];
      departure_time?: string;
    },
  ): Promise<{ trip: Record<string, unknown> }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_EDIT_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (['completed', 'cancelled'].includes(trip.status)) {
      throw new UnprocessableEntityException({
        message: 'TRIP_CANNOT_BE_EDITED_FROM_ITS_CURRENT_STATUS',
        code: 'INVALID_TRIP_STATUS',
      });
    }

    const fields: Record<string, unknown> = {};
    if (data.fare_per_seat !== undefined) {
      const fare = Number(data.fare_per_seat);
      fields.farePerSeat = fare;
      const seatCount = await this.prisma.tripSeat.count({
        where: { tripId, wasAvailable: true },
      });
      fields.totalProfit = fare * seatCount;
    }
    if (data.arrival_time !== undefined) {
      fields.arrivalTime = parseTimezoneAware(data.arrival_time);
    }
    if (data.gender_preference !== undefined) fields.genderPreference = data.gender_preference;
    if (data.driver_instructions !== undefined) fields.driverInstructions = data.driver_instructions;
    if (data.additional_instructions !== undefined) {
      fields.additionalInstructions = data.additional_instructions || null;
    }

    let departureChanged = false;
    if (data.departure_time !== undefined) {
      const departure = parseTimezoneAware(data.departure_time);
      if (departure <= new Date()) {
        throw validationError(
          'DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE',
          'DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE',
        );
      }
      fields.departureTime = departure;
      departureChanged = departure.getTime() !== new Date(trip.departureTime).getTime();
      if (departureChanged) {
        await assertNoOverlappingTrip(this.prisma, driverId, {
          departureTime: departure,
          isRecurring: trip.isRecurring,
          recurrenceDays: trip.recurrenceDays,
          recurrenceEndDate: trip.recurrenceEndDate,
          excludeTripId: tripId,
        });
      }
    }

    const updated = await this.prisma.trip.update({ where: { id: tripId }, data: fields as never });

    if (data.attributes !== undefined) {
      await this.prisma.tripAttribute.deleteMany({ where: { tripId } });
      if (data.attributes.length > 0) {
        await this.prisma.tripAttribute.createMany({
          data: data.attributes.map((a) => ({
            tripId,
            attrKey: a.attr_key ?? '',
            attrValue: a.attr_value ?? '',
          })),
        });
      }
    }

    if (data.stops !== undefined) {
      await this.prisma.tripStop.deleteMany({ where: { tripId } });
      if ((data.stops as unknown[]).length > 0) {
        await this.prisma.tripStop.createMany({
          data: (data.stops as Record<string, unknown>[]).map((s, idx) => ({
            tripId,
            stopOrder: (s.stop_order as number) ?? idx + 1,
            city: (s.city as string) ?? null,
            address: (s.address as string) ?? null,
            lat: (s.lat as never) ?? null,
            lng: (s.lng as never) ?? null,
            stopType: ((s.stop_type as string) ?? 'both') as 'pickup' | 'dropoff' | 'both',
            estimatedArrival: s.estimated_arrival ? new Date(s.estimated_arrival as string) : null,
          })),
        });
      }
    }

    let notifiedPassengers = 0;
    if (departureChanged) {
      try {
        notifiedPassengers = await this.notifications.notifyConfirmedPassengers(
          [tripId],
          'TRIP_TIME_CHANGED',
          {
            vars: { time: (updated.departureTime as Date).toISOString() },
            data: { trip_id: tripId },
          },
        );
      } catch {
        // best-effort
      }
      try {
        await this.home.invalidateHomeForTrip(tripId, driverId);
      } catch {
        // best-effort
      }
    }

    const attributes = await this.prisma.tripAttribute.findMany({ where: { tripId } });
    return {
      trip: {
        id: updated.id,
        origin_city: updated.originCity,
        destination_city: updated.destinationCity,
        departure_time: updated.departureTime,
        fare_per_seat: Number(updated.farePerSeat),
        total_profit: Number(updated.totalProfit),
        status: updated.status,
        attributes: attributes.map((a) => ({ attr_key: a.attrKey, attr_value: a.attrValue })),
        notified_passengers: notifiedPassengers,
      },
    };
  }

  private async countRecentCancellations(driverId: string): Promise<number> {
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return this.prisma.penalty.count({
      where: { userId: driverId, penaltyType: 'trip_cancellation', createdAt: { gte: monthAgo } },
    });
  }

  private getEscalationLevel(cancellationCount: number): {
    severity: string;
    suspensionDays: number | null;
  } {
    if (cancellationCount >= 7) return { severity: 'major', suspensionDays: 30 };
    if (cancellationCount >= 5) return { severity: 'major', suspensionDays: 7 };
    if (cancellationCount >= 3) return { severity: 'moderate', suspensionDays: null };
    return { severity: 'minor', suspensionDays: null };
  }

  private async applyEscalation(
    penaltyId: string,
    driverId: string,
  ): Promise<{ count: number; severity: string; suspensionDays: number | null }> {
    const count = await this.countRecentCancellations(driverId);
    const { severity, suspensionDays } = this.getEscalationLevel(count);
    const penalty = await this.prisma.penalty.findUnique({ where: { id: penaltyId } });
    if (penalty && severity !== penalty.severity) {
      await this.prisma.penalty.update({
        where: { id: penaltyId },
        data: {
          severity,
          ...(suspensionDays ? { endsAt: new Date(Date.now() + suspensionDays * 24 * 3600 * 1000) } : {}),
        },
      });
    }
    if (suspensionDays) {
      await this.prisma.user.update({ where: { id: driverId }, data: { status: 'suspended' } });
      try {
        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (driver) {
          await this.notifications.sendToUser(
            driver as unknown as Parameters<NotificationsService['sendToUser']>[0],
            'PENALTY_ISSUED',
            {
              channels: ['in_app', 'push'],
              vars: { severity: `suspension (${suspensionDays} days)`, reason: 'Repeated trip cancellations' },
              data: { penalty_id: penaltyId },
            },
          );
        }
      } catch {
        // best-effort
      }
    } else if (severity === 'moderate') {
      try {
        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (driver) {
          await this.notifications.sendToUser(
            driver as unknown as Parameters<NotificationsService['sendToUser']>[0],
            'PENALTY_ISSUED',
            {
              channels: ['in_app', 'push'],
              vars: { severity: 'warning', reason: 'Repeated trip cancellations' },
              data: { penalty_id: penaltyId },
            },
          );
        }
      } catch {
        // best-effort
      }
    }
    return { count, severity, suspensionDays };
  }

  async cancelTripWithPenalty(
    driverId: string,
    tripId: string,
    { reason, note }: { reason: string; note?: string },
  ): Promise<{
    message: string;
    trip_id: string;
    status: string;
    penalty_id: string;
    penalty_type: string;
  }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_CANCEL_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (!['published', 'full'].includes(trip.status)) {
      throw new ConflictException({
        message: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED_CANNOT_CANCEL',
        code: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED_CANNOT_CANCEL',
      });
    }
    if (trip.status === 'cancelled') {
      throw new ConflictException({ message: 'TRIP_IS_ALREADY_CANCELLED', code: 'ALREADY_CANCELLED' });
    }
    const confirmedCount = await this.prisma.booking.count({
      where: { tripId, status: 'confirmed' },
    });
    if (confirmedCount > 0) {
      throw new ConflictException({
        message: 'CANNOT_CANCEL_TRIP_THERE_ARE_CONFIRMED_BOOKINGS_PLEASE_CONTACT_SUPPORT',
        code: 'CANNOT_CANCEL_TRIP_THERE_ARE_CONFIRMED_BOOKINGS_PLEASE_CONTACT_SUPPORT',
      });
    }

    await this.prisma.trip.update({ where: { id: tripId }, data: { status: 'cancelled' } });
    const penalty = await this.prisma.penalty.create({
      data: {
        userId: driverId,
        tripId,
        type: 'warning',
        penaltyType: 'trip_cancellation',
        severity: 'minor',
        reason,
        details: note ?? null,
        startsAt: new Date(),
        issuedBy: driverId,
      },
    });
    const escalation = await this.applyEscalation(penalty.id, driverId);
    try {
      await this.notifications.notifyBookedPassengers([tripId], 'TRIP_CANCELLED', {
        data: { trip_id: tripId },
      });
    } catch {
      // best-effort
    }
    try {
      await this.home.invalidateHomeForTrip(tripId, driverId);
    } catch {
      // best-effort
    }
    return {
      message: 'TRIP_CANCELLED_SUCCESSFULLY',
      trip_id: tripId,
      status: 'cancelled',
      penalty_id: penalty.id,
      penalty_type: escalation.severity,
    };
  }

  async replaceTripStops(
    driverId: string,
    tripId: string,
    stops: Record<string, unknown>[],
  ): Promise<{ trip_id: string; stops: number; route_status: string }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_EDIT_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (!['published', 'full'].includes(trip.status)) {
      throw new UnprocessableEntityException({
        message: 'TRIP_STOPS_LOCKED_AFTER_START',
        code: 'TRIP_STOPS_LOCKED_AFTER_START',
      });
    }
    const list = stops ?? [];
    if (list.length > getMapsConfig().maxTripStops) {
      throw new UnprocessableEntityException({
        message: 'TOO_MANY_WAYPOINTS',
        code: 'TOO_MANY_WAYPOINTS',
      });
    }
    for (const s of list) {
      for (const key of ['lat', 'lng', 'stop_lat', 'stop_lng', 'latitude', 'longitude'] as const) {
        const v = s[key];
        if (v !== undefined && v !== null && v !== '' && !Number.isFinite(Number(v))) {
          throw validationError('STOP_LATITUDE_MUST_BE_A_DECIMAL', 'STOP_LATITUDE_MUST_BE_A_DECIMAL');
        }
      }
    }
    await this.prisma.tripStop.deleteMany({ where: { tripId } });
    if (list.length > 0) {
      await this.prisma.tripStop.createMany({
        data: list.map((s, i) => {
          const record = buildStopRecord(tripId, s as never, i + 1, 'both');
          return {
            tripId,
            stopOrder: i + 1,
            stopName: record?.stopName as string | null,
            city: record?.city as string | null,
            address: record?.address as string | null,
            lat: record?.lat as never,
            lng: record?.lng as never,
            stopLat: record?.stopLat as never,
            stopLng: record?.stopLng as never,
            stopType: (record?.stopType ?? 'both') as 'pickup' | 'dropoff' | 'both',
          };
        }),
      });
    }

    let routeStatus = 'pending';
    try {
      const out = await this.routeService.computeTripRoute(tripId);
      routeStatus = out.ok ? 'ready' : 'failed';
    } catch {
      routeStatus = 'failed';
    }
    try {
      await this.notifications.notifyConfirmedPassengers([tripId], 'ROUTE_UPDATED', {
        data: { trip_id: tripId },
      });
    } catch {
      // best-effort
    }
    try {
      const updated = await this.prisma.trip.findUnique({
        where: { id: tripId },
        select: { routeVersion: true },
      });
      this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:route_updated', {
        route_version: updated?.routeVersion ?? 0,
      });
    } catch {
      // best-effort
    }
    return { trip_id: tripId, stops: list.length, route_status: routeStatus };
  }

  async getTripRoute(
    requesterId: string,
    requesterRole: string,
    tripId: string,
  ): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: { orderBy: { stopOrder: 'asc' } },
        bookings: {
          where: { status: 'confirmed' },
          orderBy: { pickupOrder: 'asc' },
          include: { passenger: { select: { fullName: true } } },
        },
      },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    const isOwner = trip.driverId === requesterId;
    const isStaff = ['admin', 'support', 'moderator'].includes(requesterRole);
    if (!isOwner && !isStaff) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_ROUTES_ON_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    const stops = (trip.stops as unknown as Record<string, unknown>[]) ?? [];
    const bookings = (trip.bookings as unknown as Record<string, unknown>[]) ?? [];
    const waypoints = this.routeService.buildWaypoints({
      originLat: trip.originLat,
      originLng: trip.originLng,
      destinationLat: trip.destinationLat,
      destinationLng: trip.destinationLng,
      stops: trip.stops as unknown as never,
      bookings: trip.bookings as unknown as never,
    });
    const nav = this.routeService.buildNavigationLinks(waypoints);
    return {
      trip_id: trip.id,
      route_status: trip.routeStatus,
      route_version: trip.routeVersion,
      polyline: trip.routePolyline,
      distance_m: trip.routeDistanceM,
      duration_s: trip.routeDurationS,
      stops: stops.map((s) => ({
        id: s.id,
        stop_order: s.stopOrder,
        stop_name: s.stopName,
        city: s.city,
        lat: toNumber((s.lat ?? s.stopLat) as unknown),
        lng: toNumber((s.lng ?? s.stopLng) as unknown),
        stop_type: s.stopType,
      })),
      pickups: bookings.map((b) => {
        const passenger = b.passenger as Record<string, unknown> | null;
        const fullName = (passenger?.fullName as string) ?? '';
        return {
          booking_id: b.id,
          first_name: fullName.split(/\s+/)[0] ?? '',
          seats: b.seatsBooked,
          lat: toNumber(b.pickupLat as unknown),
          lng: toNumber(b.pickupLng as unknown),
          pickup_order: b.pickupOrder,
          pickup_status: b.pickupStatus,
        };
      }),
      navigation_url: nav.navigation_url,
      navigation_legs: nav.legs,
    };
  }

  async setPickupStatus(
    driverId: string,
    tripId: string,
    bookingId: string,
    status: string,
  ): Promise<{ booking_id: string; pickup_status: string }> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_MANAGE_PICKUPS_ON_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tripId },
      include: { passenger: { select: { id: true, phone: true, fcmToken: true, locale: true } } },
    });
    if (!booking) throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    if (booking.status !== 'confirmed') {
      throw new ConflictException({ message: 'BOOKING_IS_NOT_CONFIRMED', code: 'BOOKING_IS_NOT_CONFIRMED' });
    }
    const now = new Date();
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        pickupStatus: status as 'arrived' | 'picked_up' | 'missed',
        ...(status === 'arrived' ? { arrivedAt: now } : {}),
        ...(status === 'picked_up' ? { pickedUpAt: now } : {}),
      },
    });
    try {
      this.realtime.emitToRoom(`trip:${tripId}`, 'tracking:pickup_status', {
        trip_id: tripId,
        booking_id: bookingId,
        state: status,
      });
    } catch {
      // best-effort
    }
    try {
      if (status === 'arrived' || status === 'missed') {
        await this.notifications.sendToUser(
          booking.passenger as unknown as Parameters<NotificationsService['sendToUser']>[0],
          status === 'arrived' ? 'DRIVER_ARRIVED' : 'PICKUP_MISSED',
          { channels: ['in_app', 'push'], data: { trip_id: tripId, booking_id: bookingId } },
        );
      }
    } catch {
      // best-effort
    }
    return { booking_id: bookingId, pickup_status: status };
  }

  async getBookingRoute(
    requesterId: string,
    requesterRole: string,
    bookingId: string,
  ): Promise<Record<string, unknown>> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });
    if (!booking) throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
    const trip = booking.trip as unknown as Record<string, unknown> | null;
    const isMine = booking.passengerId === requesterId;
    const isOwner = trip !== null && (trip.driverId as string) === requesterId;
    const isStaff = ['admin', 'support', 'moderator'].includes(requesterRole);
    if (!isMine && !isOwner && !isStaff) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_YOUR_OWN_BOOKINGS',
        code: 'FORBIDDEN',
      });
    }
    const done = trip !== null && (trip.status as string) === 'completed';
    return {
      trip_id: booking.tripId,
      booking_id: booking.id,
      route_status: (trip?.routeStatus as string) ?? null,
      route_version: (trip?.routeVersion as number) ?? 0,
      polyline: (trip?.routePolyline as string) ?? null,
      distance_m: trip?.routeDistanceM != null ? Number(trip.routeDistanceM) : null,
      duration_s: trip?.routeDurationS != null ? Number(trip.routeDurationS) : null,
      my_pickup: {
        lat: toNumber(booking.pickupLat as unknown),
        lng: toNumber(booking.pickupLng as unknown),
        label: (booking.pickupLabel as string) ?? (booking.pickupPlace as string) ?? null,
        pickup_status: booking.pickupStatus,
      },
      actual_path_polyline: done || isMine || isOwner ? (trip?.actualPathPolyline as string) ?? null : null,
      actual_distance_m: trip?.actualDistanceM != null ? Number(trip.actualDistanceM) : null,
      actual_duration_s: trip?.actualDurationS != null ? Number(trip.actualDurationS) : null,
    };
  }

  async getTripActual(
    requesterId: string,
    requesterRole: string,
    tripId: string,
  ): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    const isOwner = trip.driverId === requesterId;
    const isStaff = ['admin', 'support', 'moderator'].includes(requesterRole);
    let isPassenger = false;
    if (!isOwner && !isStaff) {
      const booking = await this.prisma.booking.findFirst({
        where: { tripId, passengerId: requesterId },
        select: { id: true },
      });
      isPassenger = booking !== null;
    }
    if (!isOwner && !isPassenger && !isStaff) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_ROUTES_ON_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (isStaff && trip.status !== 'completed') {
      throw new ForbiddenException({
        message: 'ACTUAL_PATH_AVAILABLE_AFTER_COMPLETION',
        code: 'ACTUAL_PATH_AVAILABLE_AFTER_COMPLETION',
      });
    }
    return {
      trip_id: trip.id,
      route_status: trip.routeStatus,
      polyline: trip.routePolyline,
      actual_path_polyline: trip.actualPathPolyline,
      actual_distance_m: trip.actualDistanceM,
      actual_duration_s: trip.actualDurationS,
      started_at: trip.startedAt,
      completed_at: trip.completedAt,
    };
  }

  async getTripAttributes(tripId: string): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    const attributes = await this.prisma.tripAttribute.findMany({ where: { tripId } });
    return {
      trip_id: trip.id,
      attributes: attributes.map((a) => ({ attr_key: a.attrKey, attr_value: a.attrValue })),
    };
  }

  async getTripPassengers(
    driverId: string,
    tripId: string,
    filters: { status?: string } = {},
  ): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        driverId: true,
        originCity: true,
        destinationCity: true,
        departureTime: true,
        status: true,
      },
    });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_PASSENGERS_ON_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    const status = (filters.status as 'confirmed' | 'completed' | 'cancelled' | 'pending' | 'no_show' | undefined) ?? undefined;
    const bookings = await this.prisma.booking.findMany({
      where: { tripId, ...(status ? { status } : { status: { in: ['confirmed', 'completed'] } }) },
      include: {
        passenger: { select: { id: true, fullName: true, avatarUrl: true, avgRating: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return {
      trip_id: trip.id,
      trip_status: trip.status,
      route: `${trip.originCity} - ${trip.destinationCity}`,
      departure_time: trip.departureTime,
      passengers: bookings.map((b) => {
        const passenger = b.passenger as unknown as {
          id: string;
          fullName: string | null;
          avatarUrl: string | null;
          avgRating: unknown;
        } | null;
        return {
          booking_id: b.id,
          passenger: passenger
            ? {
                id: passenger.id,
                full_name: passenger.fullName,
                profile_picture_url: passenger.avatarUrl ?? null,
                rating: Number(passenger.avgRating) || 0,
              }
            : null,
          seats_booked: b.seatsBooked,
          seat_numbers: seatNumbersFor(b as unknown as never),
          booking_status: b.status,
        };
      }),
    };
  }
}
