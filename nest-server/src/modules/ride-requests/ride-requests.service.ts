import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { generateReferenceCode } from '../../common/utils/reference-code.js';
import { parseOptionalTimezoneAware } from '../../common/utils/time.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RedisService } from '../../redis/redis.service.js';
import { NotificationsService, type NotifyUser } from '../notifications/notifications.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { TripsService } from '../trips/trips.service.js';
import { RouteService } from '../maps/route.service.js';
import type { CreateTripDto } from '../trips/dto/create-trip.dto.js';

const MATCH_WINDOW_BEFORE_MS = 24 * 3600 * 1000;
const MATCH_WINDOW_AFTER_MS = 2 * 24 * 3600 * 1000;
const MATCH_LIMIT = 10;
const REQUEST_OFFER_TTL_HOURS = 24;

function genderCompatible(
  trip: { genderPreference?: string | null },
  request: { attributesPreferred?: unknown },
): boolean {
  const pref = (request.attributesPreferred as Record<string, unknown> | null)?.gender_preference;
  if (!pref || pref === 'all') return true;
  if (!trip.genderPreference || trip.genderPreference === 'all') return true;
  return trip.genderPreference === pref;
}

function matchScore(
  trip: { originCity: string; destinationCity: string; departureTime: Date; availableSeats: number; genderPreference: string | null },
  request: {
    originCity: string;
    destinationCity: string;
    originTime: Date | null;
    attributesPreferred?: unknown;
  },
): number {
  let score = 0;
  if (trip.originCity === request.originCity) score += 100;
  if (trip.destinationCity === request.destinationCity) score += 100;
  const requested = request.originTime ? new Date(request.originTime).getTime() : Date.now();
  const actual = new Date(trip.departureTime).getTime();
  const diffMin = Math.round(Math.abs(requested - actual) / 60000);
  score -= Math.min(diffMin, 720) / 12;
  score += Math.min(Number(trip.availableSeats), 4);
  if (genderCompatible(trip, request)) score += 5;
  return score;
}

interface OfferRow {
  id: string;
  requestId: string;
  driverId: string;
  tripId: string | null;
  offeredFare: unknown;
  message: string | null;
  status: string;
  agreedFare: unknown;
  bookingId: string | null;
  createdAt: Date;
  driver?: { fullName: string | null } | null;
}

function serializeOffer(offer: OfferRow): Record<string, unknown> {
  return {
    id: offer.id,
    request_id: offer.requestId,
    driver_id: offer.driverId,
    driver_name: offer.driver?.fullName ?? null,
    trip_id: offer.tripId,
    offered_fare: offer.offeredFare != null ? Number(offer.offeredFare) : null,
    message: offer.message,
    status: offer.status,
    agreed_fare: offer.agreedFare != null ? Number(offer.agreedFare) : null,
    booking_id: offer.bookingId,
    created_at: offer.createdAt,
  };
}

interface RequestRow {
  id: string;
  passengerId: string;
  originPlace: string;
  originCity: string;
  originLat: unknown;
  originLng: unknown;
  originTime: Date | null;
  destinationPlace: string;
  destinationCity: string;
  destinationLat: unknown;
  destinationLng: unknown;
  arrivalDeadline: Date | null;
  seatsNeeded: number;
  maxBudget: unknown;
  currency: string | null;
  attributesPreferred: unknown;
  note: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  passenger?: { fullName: string | null; phone: string | null } | null;
  offers?: OfferRow[];
}

interface AcceptRequestRow {
  id: string;
  passengerId: string;
  originPlace: string;
  originCity: string;
  originLat: unknown;
  originLng: unknown;
  originTime: Date | null;
  destinationPlace: string;
  destinationCity: string;
  destinationLat: unknown;
  destinationLng: unknown;
  seatsNeeded: number;
  maxBudget: unknown;
  currency: string | null;
}

interface AcceptTripRow {
  id: string;
  originCity: string;
  originLat: unknown;
  originLng: unknown;
  destinationCity: string;
  destinationLat: unknown;
  destinationLng: unknown;
  departureTime: Date;
  farePerSeat: unknown;
  availableSeats: number;
  status: string;
}

interface AcceptRideRequestPayload {
  trip_id?: string;
  fare_per_seat?: string | number;
  vehicle_id?: string;
  seats?: Array<{
    seat_number: number | string;
    type: 'driver' | 'available' | 'unavailable';
  }>;
  type_of_trip?: string;
  repeated_days?: number[];
  repeated_end_date?: string;
  allowed_type?: string;
  instructions?: string[];
  additional_instructions?: string;
  pickup_point?: Record<string, unknown>;
  dropoff_point?: Record<string, unknown>;
  waypoints?: Record<string, unknown>[];
  stops?: Record<string, unknown>[];
  origin_time?: string;
}

function serializeRideRequest(
  request: RequestRow,
  { includeOffers = false }: { includeOffers?: boolean } = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: request.id,
    passenger_id: request.passengerId,
    passenger_name: request.passenger?.fullName ?? null,
    passenger_phone_masked: request.passenger ? maskPhone(request.passenger.phone) : null,
    origin_place: request.originPlace,
    origin_city: request.originCity,
    origin_lat: request.originLat != null ? Number(request.originLat) : null,
    origin_lng: request.originLng != null ? Number(request.originLng) : null,
    origin_time: request.originTime,
    destination_place: request.destinationPlace,
    destination_city: request.destinationCity,
    destination_lat: request.destinationLat != null ? Number(request.destinationLat) : null,
    destination_lng: request.destinationLng != null ? Number(request.destinationLng) : null,
    arrival_deadline: request.arrivalDeadline,
    seats_needed: request.seatsNeeded,
    max_budget: request.maxBudget != null ? Number(request.maxBudget) : null,
    currency: request.currency,
    attributes_preferred: request.attributesPreferred,
    note: request.note ?? null,
    status: request.status,
    expires_at: request.expiresAt,
    created_at: request.createdAt,
  };
  if (includeOffers) {
    out.offers = (request.offers ?? []).map(serializeOffer);
  }
  return out;
}

// Port of Main Server/Services/rideRequestService.ts.
@Injectable()
export class RideRequestsService {
  private readonly logger = new Logger(RideRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly home: HomeService,
    private readonly redis: RedisService,
    private readonly realtime: RealtimeGateway,
    private readonly routes: RouteService,
    @Inject(forwardRef(() => TripsService)) private readonly tripsService: TripsService,
  ) {}

  async expireStale(): Promise<void> {
    const now = new Date();
    await this.prisma.rideRequest.updateMany({
      where: {
        status: { in: ['open', 'offered'] },
        OR: [{ arrivalDeadline: { not: null, lt: now } }, { expiresAt: { lt: now } }],
      },
      data: { status: 'expired' },
    });
    const ttlCutoff = new Date(now.getTime() - REQUEST_OFFER_TTL_HOURS * 3600 * 1000);
    await this.prisma.requestOffer.updateMany({
      where: { status: 'sent', createdAt: { lt: ttlCutoff } },
      data: { status: 'expired' },
    });
  }

  private computeExpiresAt(arrivalDeadline?: string | null, originTime?: string | null): Date {
    const deadline = parseOptionalTimezoneAware(arrivalDeadline);
    if (deadline) return deadline;
    const base = parseOptionalTimezoneAware(originTime) ?? new Date();
    return new Date(base.getTime() + REQUEST_OFFER_TTL_HOURS * 3600 * 1000);
  }

  async createRideRequest(
    userId: string,
    payload: {
      origin_city: string;
      destination_city: string;
      origin_place?: string;
      destination_place?: string;
      origin_lat?: string | number;
      origin_lng?: string | number;
      origin_time?: string;
      destination_lat?: string | number;
      destination_lng?: string | number;
      arrival_deadline?: string;
      seats_needed?: number;
      max_budget?: string | number;
      attributes_preferred?: unknown;
      note?: string;
    },
  ): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const request = await this.prisma.rideRequest.create({
      data: {
        passengerId: userId,
        originPlace: payload.origin_place ?? payload.origin_city,
        originCity: payload.origin_city,
        originLat: payload.origin_lat !== undefined ? Number(payload.origin_lat) : null,
        originLng: payload.origin_lng !== undefined ? Number(payload.origin_lng) : null,
        originTime: parseOptionalTimezoneAware(payload.origin_time),
        destinationPlace: payload.destination_place ?? payload.destination_city,
        destinationCity: payload.destination_city,
        destinationLat: payload.destination_lat !== undefined ? Number(payload.destination_lat) : null,
        destinationLng: payload.destination_lng !== undefined ? Number(payload.destination_lng) : null,
        arrivalDeadline: parseOptionalTimezoneAware(payload.arrival_deadline),
        seatsNeeded: payload.seats_needed ?? 1,
        maxBudget: payload.max_budget !== undefined ? Number(payload.max_budget) : null,
        currency: 'JOD',
        attributesPreferred: (payload.attributes_preferred ?? {}) as never,
        note: payload.note ? String(payload.note).trim() : null,
        status: 'open',
        expiresAt: this.computeExpiresAt(payload.arrival_deadline, payload.origin_time),
      },
      include: { passenger: { select: { fullName: true, phone: true } } },
    });
    return serializeRideRequest(request as unknown as RequestRow);
  }

  async listRequests(
    user: { id: string; role: string },
    filters: { status?: string; page?: unknown; limit?: unknown } = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.expireStale();
    const { page, limit, offset } = parsePagination(filters);
    const where: Record<string, unknown> =
      user.role === 'driver'
        ? { passengerId: { not: user.id }, status: filters.status ?? 'open' }
        : { passengerId: user.id, ...(filters.status ? { status: filters.status } : {}) };
    const [rows, count] = await Promise.all([
      this.prisma.rideRequest.findMany({
        where: where as never,
        include: { passenger: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.rideRequest.count({ where: where as never }),
    ]);
    return {
      data: rows.map((r) => serializeRideRequest(r as unknown as RequestRow)),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getRequest(
    user: { id: string; role: string },
    requestId: string,
  ): Promise<{ ride_request: Record<string, unknown> }> {
    await this.expireStale();
    const request = await this.prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: {
        passenger: { select: { id: true, fullName: true, phone: true } },
        offers: { include: { driver: { select: { id: true, fullName: true, phone: true } } } },
      },
    });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    const isOwner = request.passengerId === user.id;
    const isDriver = user.role === 'driver';
    if (!isOwner && !isDriver) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_YOUR_OWN_RIDE_REQUESTS',
        code: 'FORBIDDEN',
      });
    }
    return {
      ride_request: serializeRideRequest(request as unknown as RequestRow, { includeOffers: true }),
    };
  }

  async updateRideRequest(
    userId: string,
    requestId: string,
    payload: {
      action?: string;
      origin_place?: string;
      origin_city?: string;
      origin_time?: string;
      destination_city?: string;
      arrival_deadline?: string;
      seats_needed?: number;
      max_budget?: string | number;
      attributes_preferred?: unknown;
      note?: string;
    },
  ): Promise<{ ride_request: Record<string, unknown> }> {
    await this.expireStale();
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    if (request.passengerId !== userId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_UPDATE_YOUR_OWN_RIDE_REQUESTS',
        code: 'FORBIDDEN',
      });
    }
    if (!['open', 'offered'].includes(request.status)) {
      throw new ConflictException({
        message: 'ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED',
        code: 'ONLY_OPEN_OR_OFFERED_RIDE_REQUESTS_CAN_BE_UPDATED',
      });
    }
    if (payload.action === 'cancel') {
      const updated = await this.prisma.rideRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled' },
      });
      await this.prisma.requestOffer.updateMany({
        where: { requestId, status: 'sent' },
        data: { status: 'declined' },
      });
      return { ride_request: serializeRideRequest(updated as unknown as RequestRow) };
    }
    const data: Record<string, unknown> = {};
    if (payload.origin_place !== undefined) data.originPlace = payload.origin_place;
    if (payload.origin_city !== undefined) data.originCity = payload.origin_city;
    if (payload.origin_time !== undefined) {
      data.originTime = parseOptionalTimezoneAware(payload.origin_time);
    }
    if (payload.destination_city !== undefined) data.destinationCity = payload.destination_city;
    if (payload.arrival_deadline !== undefined) {
      data.arrivalDeadline = parseOptionalTimezoneAware(payload.arrival_deadline);
    }
    if (payload.seats_needed !== undefined) data.seatsNeeded = payload.seats_needed;
    if (payload.max_budget !== undefined) data.maxBudget = Number(payload.max_budget);
    if (payload.attributes_preferred !== undefined) data.attributesPreferred = payload.attributes_preferred as never;
    if (payload.note !== undefined) {
      data.note = payload.note ? String(payload.note).trim() : null;
    }
    const updated = await this.prisma.rideRequest.update({ where: { id: requestId }, data: data as never });
    if (payload.arrival_deadline !== undefined) {
      const expiresAt = this.computeExpiresAt(
        payload.arrival_deadline,
        (payload.origin_time as string | undefined) ?? undefined,
      );
      await this.prisma.rideRequest.update({ where: { id: requestId }, data: { expiresAt } });
      const refetched = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
      return { ride_request: serializeRideRequest(refetched as unknown as RequestRow) };
    }
    return { ride_request: serializeRideRequest(updated as unknown as RequestRow) };
  }

  async submitOffer(
    driverId: string,
    requestId: string,
    payload: { trip_id?: string | null; offered_fare?: string | number | null; message?: string | null },
  ): Promise<Record<string, unknown>> {
    await this.expireStale();
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    if (!['open', 'offered'].includes(request.status)) {
      throw new ConflictException({
        message: 'THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS',
        code: 'THIS_RIDE_REQUEST_IS_NO_LONGER_ACCEPTING_OFFERS',
      });
    }
    const duplicate = await this.prisma.requestOffer.findFirst({
      where: { requestId, driverId, status: 'sent' },
    });
    if (duplicate) {
      throw new ConflictException({
        message: 'YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST',
        code: 'YOU_ALREADY_HAVE_A_PENDING_OFFER_ON_THIS_RIDE_REQUEST',
      });
    }
    const offer = await this.prisma.requestOffer.create({
      data: {
        requestId,
        driverId,
        tripId: payload.trip_id ?? null,
        offeredFare: payload.offered_fare !== undefined && payload.offered_fare !== null ? Number(payload.offered_fare) : null,
        message: payload.message ?? null,
        status: 'sent',
      },
    });
    if (request.status === 'open') {
      await this.prisma.rideRequest.update({ where: { id: requestId }, data: { status: 'offered' } });
    }
    try {
      const passenger = await this.prisma.user.findUnique({ where: { id: request.passengerId } });
      if (passenger) {
        await this.notifications.sendToUser(passenger as unknown as NotifyUser, 'OFFER_RECEIVED', {
          channels: ['in_app', 'push'],
          vars: {
            driver: driver.fullName,
            offered_fare:
              payload.offered_fare !== undefined && payload.offered_fare !== null
                ? String(payload.offered_fare)
                : 'a proposed price',
          },
          data: { request_id: requestId, offer_id: offer.id },
        });
      }
    } catch (err) {
      this.logger.warn(`offer notify failed: ${(err as Error).message}`);
    }
    return serializeOffer(offer as unknown as OfferRow);
  }

  async listOffersForRequest(
    userId: string,
    requestId: string,
  ): Promise<{ data: Record<string, unknown>[] }> {
    await this.expireStale();
    const request = await this.prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { offers: { include: { driver: { select: { id: true, fullName: true, phone: true } } } } },
    });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    const offers = (request.offers ?? []) as unknown as OfferRow[];
    const isOwner = request.passengerId === userId;
    const participates = offers.some((o) => o.driverId === userId);
    if (!isOwner && !participates) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_OFFERS_ON_YOUR_OWN_REQUESTS_OR',
        code: 'FORBIDDEN',
      });
    }
    return { data: offers.map(serializeOffer) };
  }

  async listDriverOffers(
    driverId: string,
    filters: { status?: string; page?: unknown; limit?: unknown } = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    await this.expireStale();
    const { page, limit, offset } = parsePagination(filters);
    const [rows, count] = await Promise.all([
      this.prisma.requestOffer.findMany({
        where: { driverId, ...(filters.status ? { status: filters.status as never } : {}) },
        include: {
          request: {
            select: {
              id: true,
              originCity: true,
              destinationCity: true,
              originTime: true,
              status: true,
              seatsNeeded: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.requestOffer.count({
        where: { driverId, ...(filters.status ? { status: filters.status as never } : {}) },
      }),
    ]);
    return {
      data: rows.map((o) => {
        const request = o.request as unknown as {
          id: string;
          originCity: string;
          destinationCity: string;
          originTime: Date | null;
          status: string;
          seatsNeeded: number;
        } | null;
        return {
          ...serializeOffer(o as unknown as OfferRow),
          request: request
            ? {
                id: request.id,
                origin_city: request.originCity,
                destination_city: request.destinationCity,
                origin_time: request.originTime,
                seats_needed: request.seatsNeeded,
                status: request.status,
              }
            : null,
        };
      }),
      pagination: buildPagination(count, page, limit),
    };
  }

  async decideOffer(
    passengerId: string,
    offerId: string,
    action: string,
  ): Promise<Record<string, unknown>> {
    await this.expireStale();
    const offer = await this.prisma.requestOffer.findUnique({
      where: { id: offerId },
      include: {
        request: true,
        driver: { select: { id: true, fullName: true, phone: true, fcmToken: true, locale: true } },
      },
    });
    if (!offer) throw new NotFoundException({ message: 'OFFER_NOT_FOUND', code: 'OFFER_NOT_FOUND' });
    const request = offer.request as unknown as { id: string; passengerId: string; status: string } | null;
    if (!request || request.passengerId !== passengerId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_DECIDE_ON_OFFERS_TO_YOUR_OWN_RIDE',
        code: 'FORBIDDEN',
      });
    }
    if (offer.status !== 'sent') {
      throw new ConflictException({
        message: 'OFFER_NO_LONGER_DECIDABLE',
        code: 'OFFER_NO_LONGER_DECIDABLE',
        details: { status: offer.status },
      });
    }
    if (action === 'accept') {
      const updated = await this.prisma.requestOffer.update({
        where: { id: offerId },
        data: { status: 'accepted' },
      });
      await this.prisma.rideRequest.update({ where: { id: request.id }, data: { status: 'accepted' } });
      await this.prisma.requestOffer.updateMany({
        where: { requestId: request.id, id: { not: offerId }, status: 'sent' },
        data: { status: 'declined' },
      });
      try {
        const driver = offer.driver as unknown as NotifyUser | null;
        if (driver) {
          await this.notifications.sendToUser(driver, 'OFFER_ACCEPTED', {
            data: { request_id: request.id, offer_id: offerId },
          });
        }
      } catch (err) {
        this.logger.warn(`offer accept notify failed: ${(err as Error).message}`);
      }
      return serializeOffer(updated as unknown as OfferRow);
    }
    const updated = await this.prisma.requestOffer.update({
      where: { id: offerId },
      data: { status: 'declined' },
    });
    const remaining = await this.prisma.requestOffer.count({
      where: { requestId: request.id, status: 'sent' },
    });
    if (remaining === 0) {
      const fresh = await this.prisma.rideRequest.findUnique({ where: { id: request.id } });
      if (fresh && fresh.status === 'offered') {
        await this.prisma.rideRequest.update({ where: { id: request.id }, data: { status: 'open' } });
      }
    }
    try {
      const driver = offer.driver as unknown as NotifyUser | null;
      if (driver) {
        await this.notifications.sendToUser(driver, 'OFFER_DECLINED', {
          data: { request_id: request.id, offer_id: offerId },
        });
      }
    } catch (err) {
      this.logger.warn(`offer decline notify failed: ${(err as Error).message}`);
    }
    return serializeOffer(updated as unknown as OfferRow);
  }

  async agreeOfferPrice(
    passengerId: string,
    offerId: string,
    agreedFare: string | number,
  ): Promise<Record<string, unknown>> {
    await this.expireStale();
    const offer = await this.prisma.requestOffer.findUnique({
      where: { id: offerId },
      include: {
        request: true,
        driver: { select: { id: true, fullName: true, phone: true, fcmToken: true, locale: true } },
      },
    });
    if (!offer) throw new NotFoundException({ message: 'OFFER_NOT_FOUND', code: 'OFFER_NOT_FOUND' });
    const request = offer.request as unknown as { id: string; passengerId: string; status: string } | null;
    if (!request || request.passengerId !== passengerId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_AGREE_PRICES_ON_OFFERS_TO_YOUR_OWN',
        code: 'FORBIDDEN',
      });
    }
    if (offer.status !== 'accepted') {
      throw new ConflictException({
        message: 'ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE',
        code: 'ACCEPT_THE_OFFER_BEFORE_AGREEING_ON_A_FINAL_PRICE',
      });
    }
    if (['cancelled', 'expired'].includes(request.status)) {
      throw new ConflictException({
        message: 'THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE',
        code: 'THE_RIDE_REQUEST_IS_NO_LONGER_ACTIVE',
      });
    }
    const updated = await this.prisma.requestOffer.update({
      where: { id: offerId },
      data: { agreedFare: Number(agreedFare) },
    });
    try {
      const driver = offer.driver as unknown as NotifyUser | null;
      if (driver) {
        await this.notifications.sendToUser(driver, 'OFFER_PRICE_AGREED', {
          vars: { agreed_fare: String(agreedFare) },
          data: { request_id: request.id, offer_id: offerId },
        });
      }
    } catch (err) {
      this.logger.warn(`price agree notify failed: ${(err as Error).message}`);
    }
    return serializeOffer(updated as unknown as OfferRow);
  }

  async attachOfferToTrip(
    driverId: string,
    tripId: string,
    offerId: string,
    payload: { dropoff_place?: string | null; dropoff_deadline?: string | null } = {},
  ): Promise<{ booking: Record<string, unknown>; offer: Record<string, unknown> }> {
    const offer = await this.prisma.requestOffer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });
    if (!offer) throw new NotFoundException({ message: 'OFFER_NOT_FOUND', code: 'OFFER_NOT_FOUND' });
    if (offer.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_ATTACH_YOUR_OWN_OFFERS',
        code: 'FORBIDDEN',
      });
    }
    if (offer.bookingId) {
      throw new ConflictException({
        message: 'OFFER_ALREADY_ATTACHED_TO_A_BOOKING',
        code: 'OFFER_ALREADY_ATTACHED_TO_A_BOOKING',
      });
    }
    if (offer.status !== 'accepted') {
      throw new ConflictException({
        message: 'ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP',
        code: 'ONLY_ACCEPTED_OFFERS_CAN_BE_ATTACHED_TO_A_TRIP',
      });
    }
    const request = offer.request as unknown as {
      id: string;
      passengerId: string;
      seatsNeeded: number;
      currency: string | null;
      status: string;
    } | null;
    if (!request || request.status !== 'accepted') {
      throw new ConflictException({
        message: 'THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE',
        code: 'THE_UNDERLYING_RIDE_REQUEST_IS_NOT_IN_AN_ACCEPTED_STATE',
      });
    }
    if (offer.agreedFare === null || offer.agreedFare === undefined) {
      throw new ConflictException({
        message: 'AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO',
        code: 'AGREE_ON_A_FINAL_PRICE_BEFORE_ATTACHING_THE_OFFER_TO',
      });
    }
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    if (trip.driverId !== driverId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_ATTACH_OFFERS_TO_YOUR_OWN_TRIPS',
        code: 'FORBIDDEN',
      });
    }
    if (!['published', 'full'].includes(trip.status)) {
      throw new ConflictException({
        message: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED',
        code: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED',
      });
    }

    const seatsNeeded = request.seatsNeeded || 1;
    const referenceCode = await this.uniqueBookingCode();
    const booking = await this.prisma.$transaction(async (tx) => {
      const freshTrip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!freshTrip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
      const remaining = Number(freshTrip.availableSeats) - seatsNeeded;
      if (remaining < 0) {
        throw new ConflictException({
          message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
          code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
        });
      }
      const created = await tx.booking.create({
        data: {
          tripId,
          passengerId: request.passengerId,
          seatNumber: null,
          seatsBooked: seatsNeeded,
          agreedFare: Number(offer.agreedFare),
          currency: request.currency ?? 'JOD',
          dropoffPlace: payload.dropoff_place ?? null,
          dropoffDeadline: parseOptionalTimezoneAware(payload.dropoff_deadline),
          status: 'confirmed',
          paymentStatus: 'pending',
          referenceCode,
          cancelledBy: null,
        },
      });
      await tx.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: remaining,
          ...(remaining === 0 && freshTrip.status === 'published' ? { status: 'full' } : {}),
        },
      });
      await tx.requestOffer.update({ where: { id: offerId }, data: { bookingId: created.id } });
      return created;
    });

    try {
      await this.redis.deleteKey(`passenger_home:${request.passengerId}`, `driver_home:${driverId}`);
    } catch {
      // best-effort
    }
    try {
      await this.home.invalidateHomeForTrip(tripId, driverId);
    } catch {
      // best-effort
    }
    try {
      this.realtime.emitToUser(request.passengerId, 'home:invalidate', { trip_id: tripId });
      this.realtime.emitToUser(driverId, 'home:invalidate', { trip_id: tripId });
    } catch {
      // best-effort
    }
    try {
      const passenger = await this.prisma.user.findUnique({ where: { id: request.passengerId } });
      if (passenger) {
        await this.notifications.sendToUser(passenger as unknown as NotifyUser, 'BOOKING_CREATED_FROM_OFFER', {
          vars: { reference_code: booking.referenceCode },
          data: { trip_id: tripId, booking_id: booking.id },
        });
      }
    } catch (err) {
      this.logger.warn(`attach notify failed: ${(err as Error).message}`);
    }

    const refetched = await this.prisma.requestOffer.findUnique({ where: { id: offerId } });
    return {
      booking: {
        id: booking.id,
        reference_code: booking.referenceCode,
        trip_id: booking.tripId,
        passenger_id: booking.passengerId,
        seats_booked: booking.seatsBooked,
        agreed_fare: Number(booking.agreedFare),
        currency: booking.currency,
        status: booking.status,
        payment_status: booking.paymentStatus,
      },
      offer: serializeOffer(refetched as unknown as OfferRow),
    };
  }

    /**
   * Driver accepts a ride request directly without requiring an offer first.
   *
   * The ride is materialized onto the driver's schedule:
   * - `trip_id` attaches to that existing trip;
   * - otherwise the closest matching open trip on the same route is used;
   * - when none matches, a trip is created from the ride request with the
   *   driver's vehicle (all passenger seats available).
   *
   * The booking pickup comes from the request origin, so the route recompute
   * adds that point to the trip route.
   */
  private async resolveAcceptTrip(
    driverId: string,
    request: AcceptRequestRow,
    payload: AcceptRideRequestPayload,
    seatsNeeded: number,
  ): Promise<AcceptTripRow> {
    if (payload.trip_id) {
      const trip = await this.prisma.trip.findUnique({ where: { id: payload.trip_id } });
      if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
      if (trip.driverId !== driverId) {
        throw new ForbiddenException({
          message: 'YOU_CAN_ONLY_ATTACH_RIDES_TO_YOUR_OWN_TRIPS',
          code: 'FORBIDDEN',
        });
      }
      if (!['published', 'full'].includes(trip.status)) {
        throw new ConflictException({
          message: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED',
          code: 'TRIP_IS_ALREADY_ONGOING_OR_COMPLETED',
        });
      }
      if (Number(trip.availableSeats) < seatsNeeded) {
        throw new ConflictException({
          message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
          code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
        });
      }
      return trip as unknown as AcceptTripRow;
    }

    const candidates = await this.prisma.trip.findMany({
      where: {
        driverId,
        status: { in: ['published', 'full'] },
        availableSeats: { gte: seatsNeeded },
        departureTime: { gte: new Date() },
      },
      orderBy: { departureTime: 'asc' },
    });
    const normalize = (value: string | null): string => (value ?? '').trim().toLowerCase();
    const sameRoute = candidates.filter(
      (candidate) =>
        normalize(candidate.originCity) === normalize(request.originCity) &&
        normalize(candidate.destinationCity) === normalize(request.destinationCity),
    );

    if (sameRoute.length > 0) {
      if (!request.originTime) return sameRoute[0] as unknown as AcceptTripRow;
      const wanted = new Date(request.originTime).getTime();
      return sameRoute.sort(
        (a, b) =>
          Math.abs(new Date(a.departureTime).getTime() - wanted) -
          Math.abs(new Date(b.departureTime).getTime() - wanted),
      )[0] as unknown as AcceptTripRow;
    }

    return this.createTripFromRideRequest(driverId, request, payload);
  }

  private async createTripFromRideRequest(
    driverId: string,
    request: AcceptRequestRow,
    payload: AcceptRideRequestPayload,
  ): Promise<AcceptTripRow> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
    if (!vehicle) {
      throw new ForbiddenException({ message: 'DRIVER_HAS_NO_REGISTERED_VEHICLE', code: 'FORBIDDEN' });
    }
    if (!vehicle.isVerified) {
      throw new ForbiddenException({ message: 'DRIVER_VEHICLE_IS_NOT_VERIFIED', code: 'FORBIDDEN' });
    }

    const totalSeats = Number(vehicle.seats) || 0;
    const seatsNeeded = Math.max(1, Number(request.seatsNeeded) || 1);
    if (totalSeats < seatsNeeded + 1) {
      throw new ConflictException({
        message: 'NOT_ENOUGH_SEATS_ON_DRIVER_VEHICLE',
        code: 'NOT_ENOUGH_SEATS_ON_DRIVER_VEHICLE',
      });
    }

    const seats =
      Array.isArray(payload.seats) && payload.seats.length > 0
        ? payload.seats
        : [
            { seat_number: 1, type: 'driver' as const },
            ...Array.from({ length: totalSeats - 1 }, (_, index) => ({
              seat_number: index + 2,
              type: 'available' as const,
            })),
          ];

    let departure = parseOptionalTimezoneAware(payload.origin_time);
    if (!departure && request.originTime) departure = new Date(request.originTime);
    if (!departure || departure.getTime() <= Date.now()) {
      departure = new Date(Date.now() + 60 * 60 * 1000);
    }

    const createTripDto: CreateTripDto = {
      origin_city: request.originCity,
      origin_lat: request.originLat != null ? Number(request.originLat) : undefined,
      origin_lng: request.originLng != null ? Number(request.originLng) : undefined,
      destination_city: request.destinationCity,
      destination_lat: request.destinationLat != null ? Number(request.destinationLat) : undefined,
      destination_lng: request.destinationLng != null ? Number(request.destinationLng) : undefined,
      departure_time: departure.toISOString(),
      fare_per_seat:
        payload.fare_per_seat != null
          ? Number(payload.fare_per_seat)
          : request.maxBudget != null
            ? Number(request.maxBudget)
            : 0,
      seats: seats.map((seat) => ({
        seat_number: Number(seat.seat_number),
        type: seat.type as 'driver' | 'available' | 'unavailable',
      })),
      type_of_trip: payload.type_of_trip === 'repeated' ? 'repeated' : 'one_way',
      repeated_days: payload.repeated_days,
      repeated_end_date: payload.repeated_end_date,
      allowed_type: (payload.allowed_type ?? 'all') as 'all' | 'women_only' | 'men_only',
      instructions: payload.instructions ?? [],
      additional_instructions: payload.additional_instructions,
      pickup_point: payload.pickup_point as never,
      dropoff_point: payload.dropoff_point as never,
      waypoints: payload.waypoints as never,
      stops: payload.stops as never,
    };

    const created = await this.tripsService.createTrip(driverId, createTripDto);
    const trip = await this.prisma.trip.findUnique({ where: { id: created.trip_id } });
    if (!trip) throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    return trip as unknown as AcceptTripRow;
  }

  private async createDirectAcceptBooking(
    trip: AcceptTripRow,
    request: AcceptRequestRow,
    fare: number,
    seatsNeeded: number,
  ): Promise<Record<string, unknown>> {
    const availableSeats = await this.prisma.tripSeat.findMany({
      where: { tripId: trip.id, seatType: 'available' },
      orderBy: { seatNumber: 'asc' },
      take: seatsNeeded,
    });
    if (availableSeats.length < seatsNeeded) {
      throw new ConflictException({
        message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
        code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
      });
    }

    const seatNumbers = availableSeats.map((seat) => Number(seat.seatNumber));
    const referenceCode = await this.uniqueBookingCode();
    const pickupLat =
      request.originLat != null
        ? Number(request.originLat)
        : trip.originLat != null
          ? Number(trip.originLat)
          : null;
    const pickupLng =
      request.originLng != null
        ? Number(request.originLng)
        : trip.originLng != null
          ? Number(trip.originLng)
          : null;
    const pickupLabel = request.originPlace || request.originCity || null;
    const dropoffLat =
      request.destinationLat != null
        ? Number(request.destinationLat)
        : trip.destinationLat != null
          ? Number(trip.destinationLat)
          : null;
    const dropoffLng =
      request.destinationLng != null
        ? Number(request.destinationLng)
        : trip.destinationLng != null
          ? Number(trip.destinationLng)
          : null;

    const booking = await this.prisma.$transaction(async (tx) => {
      const freshTrip = await tx.trip.findUnique({ where: { id: trip.id } });
      if (!freshTrip || !['published', 'full'].includes(freshTrip.status)) {
        throw new ConflictException({ message: 'TRIP_NOT_BOOKABLE', code: 'TRIP_NOT_BOOKABLE' });
      }

      const remainingSeats = Number(freshTrip.availableSeats) - seatsNeeded;
      if (remainingSeats < 0) {
        throw new ConflictException({
          message: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
          code: 'NOT_ENOUGH_AVAILABLE_SEATS_ON_THE_SELECTED_TRIP',
        });
      }

      const claimed = await tx.tripSeat.updateMany({
        where: {
          tripId: trip.id,
          seatNumber: { in: seatNumbers },
          seatType: 'available',
        },
        data: { seatType: 'unavailable' },
      });
      if (claimed.count !== seatsNeeded) {
        throw new ConflictException({ message: 'SEAT_ALREADY_BOOKED', code: 'SEAT_ALREADY_BOOKED' });
      }

      const created = await tx.booking.create({
        data: {
          tripId: trip.id,
          passengerId: request.passengerId,
          seatNumber: seatNumbers[0],
          seatNumbers,
          seatsBooked: seatsNeeded,
          agreedFare: fare,
          currency: request.currency ?? 'JOD',
          pickupPlace: pickupLabel,
          pickupLat,
          pickupLng,
          pickupOrder: null,
          pickupType: 'custom',
          pickupStopId: null,
          pickupLabel,
          pickupCity: request.originCity ?? null,
          pickupArea: null,
          detourSeconds: 0,
          pickupStatus: 'pending',
          dropoffPlace: request.destinationPlace || request.destinationCity || null,
          dropoffLat,
          dropoffLng,
          dropoffDeadline: null,
          status: 'confirmed',
          paymentStatus: 'pending',
          referenceCode,
          cancelledBy: null,
        },
      });

      await tx.trip.update({
        where: { id: trip.id },
        data: {
          availableSeats: remainingSeats,
          ...(remainingSeats === 0 && freshTrip.status === 'published' ? { status: 'full' } : {}),
        },
      });

      return created;
    });

    // Best-effort route recompute after the booking exists: this is what adds
    // the ride request's point to the trip route.
    try {
      const recomputed = await this.routes.computeTripRoute(trip.id);
      if (recomputed.ok) {
        try {
          this.realtime.emitToRoom(`trip:${trip.id}`, 'tracking:route_updated', {
            route_version: recomputed.routeVersion,
          });
        } catch {
          // socket offline
        }
      }
    } catch (err) {
      this.logger.warn(`post-accept route recompute failed: ${(err as Error).message}`);
    }

    return booking as unknown as Record<string, unknown>;
  }

  private async upsertAcceptedOffer(
    driverId: string,
    requestId: string,
    trip: AcceptTripRow,
    fare: number,
    bookingId: string,
  ): Promise<Record<string, unknown>> {
    const existing = await this.prisma.requestOffer.findFirst({
      where: { requestId, driverId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      if (existing.status === 'accepted' && existing.bookingId) {
        throw new ConflictException({
          message: 'YOU_HAVE_ALREADY_ACCEPTED_THIS_RIDE_REQUEST',
          code: 'YOU_HAVE_ALREADY_ACCEPTED_THIS_RIDE_REQUEST',
        });
      }
      return (await this.prisma.requestOffer.update({
        where: { id: existing.id },
        data: {
          tripId: trip.id,
          agreedFare: fare,
          offeredFare: existing.offeredFare != null ? existing.offeredFare : fare,
          status: 'accepted',
          bookingId,
          ...(existing.message ? {} : { message: 'Direct acceptance by driver' }),
        },
      })) as unknown as Record<string, unknown>;
    }

    return (await this.prisma.requestOffer.create({
      data: {
        requestId,
        driverId,
        tripId: trip.id,
        offeredFare: fare,
        agreedFare: fare,
        message: 'Direct acceptance by driver',
        status: 'accepted',
        bookingId,
      },
    })) as unknown as Record<string, unknown>;
  }

  async acceptRideRequest(
    driverId: string,
    requestId: string,
    payload: AcceptRideRequestPayload = {},
  ): Promise<{
    trip: Record<string, unknown>;
    booking: Record<string, unknown>;
    offer: Record<string, unknown>;
  }> {
    await this.expireStale();

    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    if (driver.role !== 'driver') {
      throw new ForbiddenException({ message: 'ONLY_DRIVERS_CAN_ACCEPT_RIDE_REQUESTS', code: 'FORBIDDEN' });
    }
    if (!driver.isVerified) {
      throw new ForbiddenException({ message: 'DRIVER_NOT_VERIFIED', code: 'FORBIDDEN' });
    }

    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    if (!['open', 'offered'].includes(request.status)) {
      throw new ConflictException({
        message: 'RIDE_REQUEST_NO_LONGER_ACCEPTING',
        code: 'RIDE_REQUEST_NO_LONGER_ACCEPTING',
      });
    }

    const requestRow = request as unknown as AcceptRequestRow;
    const seatsNeeded = Math.max(1, Number(request.seatsNeeded) || 1);
    const trip = await this.resolveAcceptTrip(driverId, requestRow, payload, seatsNeeded);
    const fare =
      payload.fare_per_seat != null
        ? Number(payload.fare_per_seat)
        : trip.farePerSeat != null
          ? Number(trip.farePerSeat)
          : request.maxBudget != null
            ? Number(request.maxBudget)
            : 0;

    const booking = await this.createDirectAcceptBooking(trip, requestRow, fare, seatsNeeded);
    const offer = await this.upsertAcceptedOffer(
      driverId,
      requestId,
      trip,
      fare,
      String(booking.id),
    );

    await this.prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    await this.prisma.requestOffer.updateMany({
      where: { requestId, id: { not: String(offer.id) }, status: 'sent' },
      data: { status: 'declined' },
    });

    try {
      await this.redis.deleteKey(`passenger_home:${request.passengerId}`, `driver_home:${driverId}`);
    } catch {
      // best-effort
    }
    try {
      await this.home.invalidateHomeForTrip(trip.id, driverId);
    } catch {
      // best-effort
    }
    try {
      this.realtime.emitToUser(request.passengerId, 'home:invalidate', { trip_id: trip.id });
      this.realtime.emitToUser(driverId, 'home:invalidate', { trip_id: trip.id });
    } catch {
      // socket offline
    }
    try {
      const passenger = await this.prisma.user.findUnique({ where: { id: request.passengerId } });
      if (passenger) {
        await this.notifications.sendToUser(passenger as unknown as NotifyUser, 'RIDE_REQUEST_ACCEPTED', {
          vars: {
            driver: driver.fullName,
            trip_id: trip.id,
            booking_reference: String(booking.referenceCode),
          },
          data: { trip_id: trip.id, booking_id: String(booking.id) },
        });
      }
    } catch (err) {
      this.logger.warn(`accept ride request notify failed: ${(err as Error).message}`);
    }

    return {
      trip: {
        id: trip.id,
        origin_city: trip.originCity,
        destination_city: trip.destinationCity,
        departure_time: trip.departureTime,
        fare_per_seat: Number(trip.farePerSeat),
        available_seats: Number(trip.availableSeats),
        status: trip.status,
      },
      booking: {
        id: booking.id,
        reference_code: booking.referenceCode,
        trip_id: booking.tripId,
        passenger_id: booking.passengerId,
        seats_booked: booking.seatsBooked,
        seat_numbers: booking.seatNumbers ?? [],
        agreed_fare: Number(booking.agreedFare),
        currency: booking.currency,
        pickup_place: booking.pickupPlace,
        pickup_lat: booking.pickupLat != null ? Number(booking.pickupLat) : null,
        pickup_lng: booking.pickupLng != null ? Number(booking.pickupLng) : null,
        status: booking.status,
        payment_status: booking.paymentStatus,
      },
      offer,
    };
  }

  private async uniqueBookingCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferenceCode('MSR');
      const existing = await this.prisma.booking.findFirst({ where: { referenceCode: code } });
      if (!existing) return code;
    }
    throw new UnprocessableEntityException({
      message: 'COULD_NOT_GENERATE_A_UNIQUE_REFERENCE_CODE',
      code: 'INTERNAL_ERROR',
    });
  }

  async getMatches(
    user: { id: string; role: string },
    requestId: string,
  ): Promise<{ ride_request_id: string; matches: Record<string, unknown>[] }> {
    await this.expireStale();
    const request = await this.prisma.rideRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException({ message: 'RIDE_REQUEST_NOT_FOUND', code: 'RIDE_REQUEST_NOT_FOUND' });
    }
    if (request.passengerId !== user.id) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS',
        code: 'YOU_CAN_ONLY_VIEW_MATCHES_FOR_YOUR_OWN_RIDE_REQUESTS',
      });
    }
    const seatsNeeded = Math.max(1, request.seatsNeeded || 1);
    const requestedMs = request.originTime ? new Date(request.originTime).getTime() : Date.now();
    const windowStart = new Date(requestedMs - MATCH_WINDOW_BEFORE_MS);
    const windowEnd = new Date(requestedMs + MATCH_WINDOW_AFTER_MS);

    const trips = await this.prisma.trip.findMany({
      where: {
        status: { in: ['published', 'full'] },
        availableSeats: { gte: seatsNeeded },
        departureTime: { gte: windowStart, lte: windowEnd },
      },
      include: {
        driver: { select: { id: true, fullName: true, avgRating: true } },
      },
      orderBy: { departureTime: 'asc' },
    });

    const scored = trips.map((t) => ({
      trip: t,
      score: matchScore(
        {
          originCity: t.originCity,
          destinationCity: t.destinationCity,
          departureTime: t.departureTime,
          availableSeats: t.availableSeats,
          genderPreference: t.genderPreference,
        },
        {
          originCity: request.originCity,
          destinationCity: request.destinationCity,
          originTime: request.originTime,
          attributesPreferred: request.attributesPreferred,
        },
      ),
    }));
    scored.sort((a, b) => b.score - a.score);
    return {
      ride_request_id: request.id,
      matches: scored.slice(0, MATCH_LIMIT).map((s, idx) => {
        const t = s.trip;
        const driver = t.driver as unknown as { id: string; fullName: string | null; avgRating: unknown } | null;
        return {
          trip_id: t.id,
          score_rank: idx + 1,
          origin: {
            city: t.originCity,
            lat: t.originLat != null ? Number(t.originLat) : null,
            lng: t.originLng != null ? Number(t.originLng) : null,
          },
          destination: { city: t.destinationCity },
          departure_time: t.departureTime,
          available_seats: Number(t.availableSeats),
          fare_per_seat: Number(t.farePerSeat),
          currency: t.currency ?? 'JOD',
          gender_preference: t.genderPreference ?? 'all',
          driver: driver
            ? {
                id: driver.id,
                full_name: driver.fullName,
                rating: Number(driver.avgRating) || 0,
              }
            : null,
        };
      }),
    };
  }
}