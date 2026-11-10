import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { daysAgo, percentChange } from '../../common/utils/stat-change.js';
import { toAbsoluteMediaUrl } from '../../common/utils/media-url.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService, type NotifyUser } from '../notifications/notifications.service.js';
import type { DriverEvaluationsQuery, DriversListQuery, DriverTripsQuery, RecentTripsQuery, ReservationsQuery } from './dto/dashboard-queries.dto.js';

// Port of main-server/Services/adminDashboardService.ts (Sequelize -> Prisma).
// Response shapes are kept 1:1 with the Express service; auditService.track
// calls are intentionally skipped (global AuditInterceptor covers Nest-side).

// ===== Canonical document registry (data-model.md) =====
const DOCUMENT_KEYS = {
  personal_documents: [
    { key: 'id_front', source: 'profile', column: 'userIdentificationFront' },
    { key: 'id_back', source: 'profile', column: 'userIdentificationBack' },
    { key: 'face_photo', source: 'profile', column: 'personalImageWithId' },
    { key: 'license_front', source: 'profile', column: 'linceseFront' },
    { key: 'license_back', source: 'profile', column: 'linceseBack' },
  ],
  vehicle_documents: [
    { key: 'registration_front', source: 'vehicle', column: 'registrationDocFront' },
    { key: 'registration_back', source: 'vehicle', column: 'registrationDocBack' },
    { key: 'insurance', source: null, column: null },
  ],
} as const;

type DocumentDef = { key: string; source: string | null; column: string | null };

const ALL_DOCUMENT_KEYS: DocumentDef[] = (Object.values(DOCUMENT_KEYS).flat() as unknown as DocumentDef[]);

const DRIVER_STATUSES = ['active', 'suspended', 'pending', 'blocked'];
const STANDING_ACTIONS = ['suspend', 'reactivate', 'unblock'];

const TRIP_ACTIVE_STATUSES = ['published', 'full', 'in_progress', 'ongoing'] as const;

// Derived dashboard status buckets (Express ACTIVE_BUCKET / PENDING_BUCKET /
// SUSPENDED_BUCKET / BLOCKED_BUCKET).
const ACTIVE_BUCKET: Prisma.UserWhereInput = {
  role: 'driver',
  status: { in: ['active', 'warned'] },
  verificationStatus: 'approved',
};
const PENDING_BUCKET: Prisma.UserWhereInput = {
  role: 'driver',
  status: { in: ['active', 'warned'] },
  verificationStatus: { in: ['unverified', 'pending', 'rejected'] },
};
const SUSPENDED_BUCKET: Prisma.UserWhereInput = { role: 'driver', status: 'suspended' };
const BLOCKED_BUCKET: Prisma.UserWhereInput = { role: 'driver', status: 'banned' };

interface BucketUser {
  status: string;
  verificationStatus: string;
}

export function deriveAccountStatus(user: BucketUser): string {
  if (user.status === 'banned') return 'blocked';
  if (user.status === 'suspended') return 'suspended';
  if (['unverified', 'pending', 'rejected', 'approved'].includes(user.verificationStatus)
    && user.verificationStatus !== 'approved') return 'pending';
  return 'active';
}

function bucketWhereFor(statusFilter: string | undefined): Prisma.UserWhereInput | null {
  switch (statusFilter) {
    case 'active': return ACTIVE_BUCKET;
    case 'pending': return PENDING_BUCKET;
    case 'suspended': return SUSPENDED_BUCKET;
    case 'blocked': return BLOCKED_BUCKET;
    default: return null;
  }
}

// Maps the dossier/listing "pending | active | completed | canceled" buckets
// onto canonical trip statuses. Returns null when no mapping applies (caller
// falls back to the raw value, mirroring `mapTripStatusFilter(s) || s`).
function mapTripStatusFilter(status: string): string | string[] | null {
  switch (status) {
    case 'pending': return ['published', 'full'];
    case 'active': return ['in_progress', 'ongoing'];
    case 'completed': return 'completed';
    case 'abandoned': return 'abandoned';
    case 'canceled':
    case 'cancelled': return 'cancelled';
    default: return null;
  }
}

function tripStatusWhere(status: string): Prisma.TripWhereInput['status'] {
  const mapped = mapTripStatusFilter(status);
  if (Array.isArray(mapped)) return { in: mapped as ('published' | 'full' | 'in_progress' | 'ongoing' | 'completed' | 'abandoned' | 'cancelled')[] };
  if (mapped) return mapped as 'completed' | 'abandoned' | 'cancelled';
  // 'canceled' (one L) is accepted by validators but stored as 'cancelled'.
  if (status === 'canceled') return 'cancelled';
  return status as 'published' | 'full' | 'in_progress' | 'ongoing' | 'completed' | 'abandoned' | 'cancelled';
}

export function maskPhone(phone: string | number | null | undefined): string | null {
  if (!phone) return null;
  const str: string = String(phone).trim();
  if (str.length <= 7) return '***';
  return `${str.slice(0, str.length - 7)}***${str.slice(-4)}`;
}

interface DossierDriver {
  id: string;
  fullName: string | null;
  phone: string;
  status: string;
  verificationStatus: string;
  age: unknown;
  avatarUrl: string | null;
  avgRating: unknown;
  totalBalance: unknown;
  createdAt: Date;
  lastLoginAt: Date | null;
}

interface TripRow {
  id: string;
  originCity: string;
  destinationCity: string;
  departureTime: Date;
  totalSeats: number;
  availableSeats: number;
  farePerSeat: unknown;
  isRecurring: boolean;
  status: string;
}

interface TripAgg {
  reservations_count: number;
  passengers_count: number;
  total_booking_value: number;
}

function recentTripShape(
  trip: TripRow,
  driver: { id: string; fullName: string | null } | null,
  agg?: TripAgg,
): Record<string, unknown> {
  return {
    trip_id: trip.id,
    driver: driver ? { id: driver.id, name: driver.fullName } : null,
    route: { origin: trip.originCity, destination: trip.destinationCity },
    departure_time: trip.departureTime,
    status: trip.status,
    total_seats: Number(trip.totalSeats),
    available_seats: Number(trip.availableSeats),
    seat_price: Number(trip.farePerSeat),
    trip_type: trip.isRecurring ? 'متكرر' : 'فردية',
    total_booking_value: agg?.total_booking_value ?? 0,
    passengers_count: agg?.passengers_count ?? 0,
    reservations_count: agg?.reservations_count ?? 0,
  };
}

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getDriverOrThrow(driverId: string): Promise<DossierDriver> {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver || driver.role !== 'driver') {
      throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
    }
    return driver as unknown as DossierDriver;
  }

  private tripPassengerAggregates(tripIds: string[]): Promise<Map<string, TripAgg>> {
    if (tripIds.length === 0) return Promise.resolve(new Map());
    return this.prisma.booking.findMany({
      where: { tripId: { in: tripIds }, status: { not: 'cancelled' } },
      select: { tripId: true, seatsBooked: true, agreedFare: true },
    }).then((rows) => {
      const aggregates = new Map<string, TripAgg>();
      for (const row of rows) {
        const current = aggregates.get(row.tripId) ?? {
          reservations_count: 0,
          passengers_count: 0,
          total_booking_value: 0,
        };
        current.reservations_count += 1;
        current.passengers_count += row.seatsBooked;
        current.total_booking_value += Number(row.agreedFare) * row.seatsBooked;
        aggregates.set(row.tripId, current);
      }
      return aggregates;
    });
  }

  private async pendingDocumentKeysFor(driverIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (driverIds.length === 0) return result;
    const [profiles, vehicles, reviews] = await Promise.all([
      this.prisma.driverProfile.findMany({ where: { driverId: { in: driverIds } } }),
      this.prisma.vehicle.findMany({ where: { driverId: { in: driverIds } } }),
      this.prisma.documentReview.findMany({ where: { driverId: { in: driverIds } } }),
    ]);
    const profileByDriver = new Map(profiles.map((p) => [p.driverId, p as unknown as Record<string, unknown>]));
    const vehicleByDriver = new Map(vehicles.map((v) => [v.driverId, v as unknown as Record<string, unknown>]));
    const decidedByDriver = new Map<string, Set<string>>();
    for (const r of reviews) {
      if (!decidedByDriver.has(r.driverId)) decidedByDriver.set(r.driverId, new Set());
      decidedByDriver.get(r.driverId)?.add(r.documentKey);
    }
    for (const id of driverIds) {
      const profile = profileByDriver.get(id);
      const vehicle = vehicleByDriver.get(id);
      const decided = decidedByDriver.get(id) ?? new Set<string>();
      const keys: string[] = [];
      for (const def of ALL_DOCUMENT_KEYS) {
        const value = def.source === 'profile'
          ? profile?.[def.column as string]
          : def.source === 'vehicle' ? vehicle?.[def.column as string] : null;
        if (value != null && !decided.has(def.key)) keys.push(def.key);
      }
      result.set(id, keys);
    }
    return result;
  }

  private async countPendingDocuments(): Promise<number> {
    const documentSources = [
      { table: 'driver_profiles', alias: 'dp', column: 'user_identification_front', key: 'id_front' },
      { table: 'driver_profiles', alias: 'dp', column: 'user_identification_back', key: 'id_back' },
      { table: 'driver_profiles', alias: 'dp', column: 'personal_image_with_id', key: 'face_photo' },
      { table: 'driver_profiles', alias: 'dp', column: 'lincese_front', key: 'license_front' },
      { table: 'driver_profiles', alias: 'dp', column: 'lincese_back', key: 'license_back' },
      { table: 'vehicles', alias: 'v', column: 'registration_doc_front', key: 'registration_front' },
      { table: 'vehicles', alias: 'v', column: 'registration_doc_back', key: 'registration_back' },
    ];
    const selects = documentSources.map(({ table, alias, column, key }) => (
      `SELECT COUNT(*)::int AS cnt
         FROM ${table} ${alias}
         JOIN users u ON u.id = ${alias}.driver_id AND u.role = 'driver'
         LEFT JOIN document_reviews dr
           ON dr.driver_id = ${alias}.driver_id AND dr.document_key = '${key}'
        WHERE ${alias}.${column} IS NOT NULL AND dr.id IS NULL`
    )).join(' UNION ALL ');
    const rows = await this.prisma.$queryRawUnsafe<Array<{ total: number }>>(
      `SELECT COALESCE(SUM(cnt), 0)::int AS total FROM (${selects}) s`,
    );
    return Number(rows[0]?.total || 0);
  }

  private async resolveImages(imageIds: (number | null | undefined)[]): Promise<Map<number, { id: number; url: string; createdAt: Date }>> {
    const ids = [...new Set(imageIds.filter((v): v is number => v != null))];
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.uploadedImage.findMany({ where: { id: { in: ids } } });
    return new Map(rows.map((r) => [r.id, r]));
  }

  private documentEntry(
    def: DocumentDef,
    profile: Record<string, unknown> | null,
    vehicle: Record<string, unknown> | null,
    reviewByKey: Map<string, { decision: string; reason: string | null }>,
    imageMap: Map<number, { id: number; url: string; createdAt: Date }>,
  ): Record<string, unknown> {
    const imageId = (def.source === 'profile'
      ? profile?.[def.column as string]
      : def.source === 'vehicle' ? vehicle?.[def.column as string] : null) as number | null | undefined;
    const image = imageId != null ? imageMap.get(imageId) : null;
    const review = reviewByKey.get(def.key);
    let status: string;
    if (review) status = review.decision;
    else if (image) status = 'pending';
    else status = 'missing';
    return {
      key: def.key,
      document_url: image ? toAbsoluteMediaUrl(image.url) : null,
      upload_date: image ? image.createdAt : null,
      status,
      ...(status === 'rejected' && review?.reason ? { reason: review.reason } : {}),
      ...(def.source == null ? { note: 'not_tracked_yet' } : {}),
    };
  }

  private async loadDossierContext(driverId: string): Promise<{
    profile: Record<string, unknown> | null;
    vehicle: Record<string, unknown> | null;
    reviewByKey: Map<string, { decision: string; reason: string | null }>;
  }> {
    const [driver, profile, vehicle] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: driverId } }),
      this.prisma.driverProfile.findUnique({ where: { driverId } }),
      this.prisma.vehicle.findUnique({ where: { driverId } }),
    ]);
    if (!driver || driver.role !== 'driver') {
      throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
    }
    const reviews = await this.prisma.documentReview.findMany({ where: { driverId } });
    const reviewByKey = new Map(reviews.map((r) => [r.documentKey, { decision: r.decision, reason: r.reason }]));
    return {
      profile: profile as unknown as Record<string, unknown> | null,
      vehicle: vehicle as unknown as Record<string, unknown> | null,
      reviewByKey,
    };
  }

  // ===== US1: Global dashboard =====

  async getSummary(): Promise<Record<string, unknown>> {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 3600 * 1000);
    const deletionIds = await this.pendingDeletionDriverIds();
    const excludeDeletion = AdminDashboardService.notPendingDeletion(deletionIds);
    const [
      totalDrivers, activeDrivers, totalTrips, activeTrips, totalVehicles,
      pendingDocsCount, pendingDriversCount, pendingDriversRows, unresolvedComplaints,
      topRouteRows, recentTripRows, latestComplaints,
      bookingsToday, tripsToday, totalPassengers, pendingPayments, newRideRequests,
      completedTrips, cancelledTrips, upcomingTrips, inProgressTrips, abandonedTrips,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'driver', ...excludeDeletion } }),
      this.prisma.user.count({ where: { ...ACTIVE_BUCKET, ...excludeDeletion } }),
      this.prisma.trip.count(),
      this.prisma.trip.count({ where: { status: { in: [...TRIP_ACTIVE_STATUSES] } } }),
      this.prisma.vehicle.count(),
      this.countPendingDocuments(),
      this.prisma.user.count({ where: { ...PENDING_BUCKET, ...excludeDeletion } }),
      this.prisma.user.findMany({
        where: { ...PENDING_BUCKET, ...excludeDeletion },
        select: { id: true, fullName: true, phone: true, verificationSubmittedAt: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
      this.prisma.complaint.count({ where: { status: { in: ['open', 'reviewing'] } } }),
      this.prisma.trip.groupBy({
        by: ['originCity', 'destinationCity'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      this.prisma.trip.findMany({
        include: { driver: { select: { id: true, fullName: true } } },
        orderBy: { departureTime: 'desc' },
        take: 5,
      }),
      this.prisma.complaint.findMany({
        include: {
          reporter: { select: { id: true, fullName: true } },
          accused: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Figma 9524:10053 home cards (counts only — deltas are follow-up).
      this.prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.trip.count({
        where: { departureTime: { gte: todayStart, lt: tomorrowStart } },
      }),
      this.prisma.user.count({ where: { role: 'passenger' } }),
      this.prisma.driverSubscription.count({ where: { status: 'pending_approval' } }),
      this.prisma.rideRequest.count({ where: { status: 'open' } }),
      this.prisma.trip.count({ where: { status: 'completed' } }),
      this.prisma.trip.count({ where: { status: 'cancelled' } }),
      this.prisma.trip.count({ where: { status: { in: ['published', 'full'] } } }),
      this.prisma.trip.count({ where: { status: { in: ['in_progress', 'ongoing'] } } }),
      this.prisma.trip.count({ where: { status: 'abandoned' } }),
    ]);

    const aggs = await this.tripPassengerAggregates(recentTripRows.map((t) => t.id));
    const pendingDocKeys = await this.pendingDocumentKeysFor(pendingDriversRows.map((u) => u.id));

    const cutoff = daysAgo(7);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 3600 * 1000);
    const [
      driversBefore, passengersBefore, tripsYesterday, bookingsYesterday,
      totalTripsBefore, completedTripsBefore,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'driver', createdAt: { lte: cutoff }, ...excludeDeletion } }),
      this.prisma.user.count({ where: { role: 'passenger', createdAt: { lte: cutoff } } }),
      this.prisma.trip.count({
        where: { departureTime: { gte: yesterdayStart, lt: todayStart } },
      }),
      this.prisma.booking.count({
        where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      this.prisma.trip.count({ where: { createdAt: { lte: cutoff } } }),
      this.prisma.trip.count({
        where: { status: 'completed', completedAt: { lte: cutoff } },
      }),
    ]);
    const kpiChanges = {
      total_drivers: percentChange(totalDrivers, driversBefore),
      total_passengers: percentChange(totalPassengers, passengersBefore),
      trips_today: percentChange(tripsToday, tripsYesterday),
      bookings_today: percentChange(bookingsToday, bookingsYesterday),
      total_trips: percentChange(totalTrips, totalTripsBefore),
      completed_trips: percentChange(completedTrips, completedTripsBefore),
    };

    return {
      kpis: {
        total_drivers: totalDrivers,
        active_drivers: activeDrivers,
        total_trips: totalTrips,
        active_trips: activeTrips,
        total_vehicles: totalVehicles,
        pending_documents: pendingDocsCount,
        pending_drivers: pendingDriversCount,
        bookings_today: bookingsToday,
        trips_today: tripsToday,
        total_passengers: totalPassengers,
        pending_payments: pendingPayments,
        new_ride_requests: newRideRequests,
        completed_trips: completedTrips,
        cancelled_trips: cancelledTrips,
        upcoming_trips: upcomingTrips,
        in_progress_trips: inProgressTrips,
        abandoned_trips: abandonedTrips,
      },
      kpi_changes: kpiChanges,
      alerts: [
        { type: 'pending_verification_documents', message: 'ALERT_PENDING_VERIFICATION_DOCUMENTS', count: pendingDocsCount },
        { type: 'pending_review_drivers', message: 'ALERT_PENDING_REVIEW_DRIVERS', count: pendingDriversCount },
        { type: 'unresolved_complaints', message: 'ALERT_UNRESOLVED_COMPLAINTS', count: unresolvedComplaints },
      ],
      top_routes: topRouteRows.map((r) => ({
        origin: r.originCity,
        destination: r.destinationCity,
        trips_count: r._count.id,
      })),
      recent_trips: recentTripRows.map((t) => recentTripShape(
        t as unknown as TripRow,
        t.driver,
        aggs.get(t.id),
      )),
      pending_requests: pendingDriversRows.map((u) => ({
        driver_id: u.id,
        name: u.fullName,
        phone: maskPhone(u.phone),
        submitted_at: u.verificationSubmittedAt || u.createdAt,
        pending_documents: pendingDocKeys.get(u.id) || [],
      })),
      latest_complaints: latestComplaints.map((c) => ({
        id: c.id,
        complainant: c.reporter ? { id: c.reporter.id, name: c.reporter.fullName } : null,
        accused: c.accused ? { id: c.accused.id, name: c.accused.fullName } : null,
        date: c.createdAt,
        subject: c.category,
        status: c.status,
      })),
    };
  }

  async getRecentTrips(query: RecentTripsQuery): Promise<Record<string, unknown>> {
    const { page, limit, offset } = parsePagination(query);
    const where: Prisma.TripWhereInput = {};
    if (query.status) where.status = tripStatusWhere(query.status);
    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { originCity: { contains: term, mode: 'insensitive' } },
        { destinationCity: { contains: term, mode: 'insensitive' } },
        { driver: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }
    const [rows, count] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        include: { driver: { select: { id: true, fullName: true } } },
        orderBy: { departureTime: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);
    const aggs = await this.tripPassengerAggregates(rows.map((t) => t.id));
    return {
      data: rows.map((t) => recentTripShape(t as unknown as TripRow, t.driver, aggs.get(t.id))),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getTopRoutes(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.trip.groupBy({
      by: ['originCity', 'destinationCity'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });
    return {
      top_routes: rows.map((r) => ({
        origin: r.originCity,
        destination: r.destinationCity,
        trips_count: r._count.id,
      })),
    };
  }

  async getPendingRequests(query: RecentTripsQuery): Promise<Record<string, unknown>> {
    const { page, limit, offset } = parsePagination(query);
    const [rows, count] = await Promise.all([
      this.prisma.user.findMany({
        where: PENDING_BUCKET,
        select: { id: true, fullName: true, phone: true, verificationSubmittedAt: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where: PENDING_BUCKET }),
    ]);
    const pendingDocKeys = await this.pendingDocumentKeysFor(rows.map((u) => u.id));
    return {
      data: rows.map((u) => ({
        driver_id: u.id,
        name: u.fullName,
        phone: maskPhone(u.phone),
        submitted_at: u.verificationSubmittedAt || u.createdAt,
        pending_documents: pendingDocKeys.get(u.id) || [],
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getLatestComplaints(query: RecentTripsQuery): Promise<Record<string, unknown>> {
    const { page, limit, offset } = parsePagination(query);
    const [rows, count] = await Promise.all([
      this.prisma.complaint.findMany({
        include: {
          reporter: { select: { id: true, fullName: true } },
          accused: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.complaint.count(),
    ]);
    return {
      data: rows.map((c) => ({
        id: c.id,
        complainant: c.reporter ? { id: c.reporter.id, name: c.reporter.fullName } : null,
        accused: c.accused ? { id: c.accused.id, name: c.accused.fullName } : null,
        date: c.createdAt,
        subject: c.category,
        status: c.status,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  // ===== US2: Drivers directory =====

  private async pendingDeletionDriverIds(): Promise<string[]> {
    const rows = await this.prisma.deletionRequest.findMany({
      where: { status: { in: ['pending', 'approved'] } },
      select: { userId: true },
    });
    return rows.map((row) => row.userId).filter(Boolean);
  }

  private static notPendingDeletion(ids: string[]): Prisma.UserWhereInput {
    return ids.length ? { id: { notIn: ids } } : {};
  }

  async listDrivers(query: DriversListQuery): Promise<Record<string, unknown>> {
    const { page, limit, offset } = parsePagination(query);
    const deletionIds = await this.pendingDeletionDriverIds();
    const where: Prisma.UserWhereInput = {
      ...(bucketWhereFor(query.status) || { role: 'driver' }),
      ...AdminDashboardService.notPendingDeletion(deletionIds),
    };

    if (query.search) {
      const term = query.search;
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.registration_from || query.registration_to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.registration_from) createdAt.gte = new Date(`${query.registration_from}T00:00:00.000Z`);
      if (query.registration_to) createdAt.lte = new Date(`${query.registration_to}T23:59:59.999Z`);
      where.createdAt = createdAt;
    }

    const sortColumns: Record<string, 'createdAt' | 'fullName' | 'avgRating'> = {
      created_at: 'createdAt',
      full_name: 'fullName',
      avg_rating: 'avgRating',
    };
    const sortColumn = sortColumns[query.sort_by ?? ''] || 'createdAt';
    const sortOrder = (query.sort_order || 'desc').toUpperCase() === 'ASC' ? 'asc' : 'desc';

    const [rows, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phone: true,
          avgRating: true,
          totalBalance: true,
          status: true,
          verificationStatus: true,
          createdAt: true,
          driverProfile: { select: { totalTrips: true } },
          driverSubscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { planName: true },
          },
        },
        orderBy: { [sortColumn]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const tripCounts = await this.prisma.trip.groupBy({
      by: ['driverId'],
      where: { driverId: { in: rows.map((row) => row.id) } },
      _count: { id: true },
    });
    const tripCountByDriver = new Map(tripCounts.map((row) => [row.driverId, row._count.id]));
    const completedTripCounts = await this.prisma.trip.groupBy({
      by: ['driverId'],
      where: { driverId: { in: rows.map((row) => row.id) }, status: 'completed' },
      _count: { id: true },
    });
    const completedTripCountByDriver = new Map(
      completedTripCounts.map((row) => [row.driverId, row._count.id]),
    );

    return {
      data: rows.map((u) => ({
        id: u.id,
        name: u.fullName,
        phone: maskPhone(u.phone),
        phone_full: u.phone,
        registration_date: u.createdAt,
        avg_rating: Number(u.avgRating || 0),
        total_trips: tripCountByDriver.get(u.id) ?? 0,
        completed_trips: completedTripCountByDriver.get(u.id) ?? 0,
        plan_name: u.driverSubscriptions[0]?.planName ?? null,
        balance: Number(u.totalBalance || 0),
        account_status: deriveAccountStatus({ status: u.status, verificationStatus: u.verificationStatus }),
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getDriverStats(): Promise<Record<string, unknown>> {
    const deletionIds = await this.pendingDeletionDriverIds();
    const exclude = AdminDashboardService.notPendingDeletion(deletionIds);
    const [total, active, suspended, pending] = await Promise.all([
      this.prisma.user.count({ where: { role: 'driver', ...exclude } }),
      this.prisma.user.count({ where: { ...ACTIVE_BUCKET, ...exclude } }),
      this.prisma.user.count({ where: { ...SUSPENDED_BUCKET, ...exclude } }),
      this.prisma.user.count({ where: { ...PENDING_BUCKET, ...exclude } }),
    ]);
    return { total_drivers: total, active_drivers: active, suspended_drivers: suspended, pending_drivers: pending };
  }

  // Figma 9695:33146 (تحميل التقرير): same filters as listDrivers, CSV with
  // masked phones, capped at 5000 rows.
  async exportDrivers(query: DriversListQuery): Promise<string> {
    const deletionIds = await this.pendingDeletionDriverIds();
    const where: Prisma.UserWhereInput = {
      ...(bucketWhereFor(query.status) || { role: 'driver' }),
      ...AdminDashboardService.notPendingDeletion(deletionIds),
    };
    if (query.search) {
      const term = query.search;
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (query.registration_from || query.registration_to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.registration_from) createdAt.gte = new Date(`${query.registration_from}T00:00:00.000Z`);
      if (query.registration_to) createdAt.lte = new Date(`${query.registration_to}T23:59:59.999Z`);
      where.createdAt = createdAt;
    }
    const rows = await this.prisma.user.findMany({
      where,
      select: { id: true, fullName: true, phone: true, status: true, verificationStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
    const esc = (v: unknown): string => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['id,full_name,phone,account_status,created_at'];
    for (const u of rows) {
      lines.push(
        [u.id, esc(u.fullName), esc(maskPhone(u.phone)), deriveAccountStatus({ status: u.status, verificationStatus: u.verificationStatus }), u.createdAt.toISOString()].join(','),
      );
    }
    return lines.join('\n');
  }

  async getTripDetail(tripId: string): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          select: { id: true, fullName: true, phone: true, avgRating: true, avatarUrl: true },
        },
        stops: { orderBy: { stopOrder: 'asc' } },
        bookings: {
          include: {
            passenger: {
              select: { id: true, fullName: true, phone: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!trip) {
      throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    }
    const activeBookings = trip.bookings.filter((booking) => booking.status !== 'cancelled');
    const totalBookingValue = activeBookings.reduce(
      (sum, booking) => sum + Number(booking.agreedFare) * Number(booking.seatsBooked),
      0,
    );
    return {
      trip: {
        id: trip.id,
        status: trip.status,
        abandoned_at: trip.abandonedAt,
        abandon_reason: trip.abandonReason,
        route: { origin: trip.originCity, destination: trip.destinationCity },
        origin_city: trip.originCity,
        origin_area: trip.originArea,
        destination_city: trip.destinationCity,
        destination_area: trip.destinationArea,
        departure_time: trip.departureTime,
        arrival_time: trip.arrivalTime,
        total_seats: Number(trip.totalSeats),
        available_seats: Number(trip.availableSeats),
        seat_price: Number(trip.farePerSeat),
        trip_type: trip.isRecurring ? 'متكرر' : 'فردية',
        gender_preference: trip.genderPreference,
        reservations_count: activeBookings.length,
        passengers_count: activeBookings.reduce((sum, booking) => sum + Number(booking.seatsBooked), 0),
        total_booking_value: totalBookingValue,
        stops: trip.stops.map((stop) => ({
          id: stop.id,
          stop_order: stop.stopOrder,
          stop_name: stop.stopName,
          city: stop.city,
          address: stop.address,
          stop_type: stop.stopType,
          lat: stop.lat != null ? Number(stop.lat) : stop.stopLat != null ? Number(stop.stopLat) : null,
          lng: stop.lng != null ? Number(stop.lng) : stop.stopLng != null ? Number(stop.stopLng) : null,
        })),
      },
      driver: trip.driver
        ? {
            id: trip.driver.id,
            name: trip.driver.fullName,
            phone: maskPhone(trip.driver.phone),
            avatar_url: toAbsoluteMediaUrl(trip.driver.avatarUrl),
            avg_rating: Number(trip.driver.avgRating || 0),
          }
        : null,
      bookings: trip.bookings.map((booking) => ({
        id: booking.id,
        booking_no: booking.referenceCode,
        status: booking.status,
        seats_booked: Number(booking.seatsBooked),
        seat_numbers: booking.seatNumbers,
        seat_price: Number(booking.agreedFare),
        total_price: Number(booking.agreedFare) * Number(booking.seatsBooked),
        payment_status: booking.paymentStatus,
        created_at: booking.createdAt,
        pickup: {
          place: booking.pickupPlace,
          label: booking.pickupLabel,
          city: booking.pickupCity,
          area: booking.pickupArea,
          lat: booking.pickupLat != null ? Number(booking.pickupLat) : null,
          lng: booking.pickupLng != null ? Number(booking.pickupLng) : null,
          order: booking.pickupOrder != null ? Number(booking.pickupOrder) : null,
          status: booking.pickupStatus,
        },
        dropoff: {
          place: booking.dropoffPlace,
          lat: booking.dropoffLat != null ? Number(booking.dropoffLat) : null,
          lng: booking.dropoffLng != null ? Number(booking.dropoffLng) : null,
          deadline: booking.dropoffDeadline,
          dropped_off_at: booking.droppedOffAt,
        },
        passenger: booking.passenger
          ? {
              id: booking.passenger.id,
              name: booking.passenger.fullName,
              phone: maskPhone(booking.passenger.phone),
              avatar_url: toAbsoluteMediaUrl(booking.passenger.avatarUrl),
            }
          : null,
      })),
    };
  }

  async cancelTrip(tripId: string, reason: string | null, adminId: string): Promise<Record<string, unknown>> {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException({ message: 'TRIP_NOT_FOUND', code: 'TRIP_NOT_FOUND' });
    }
    if (['completed', 'cancelled'].includes(trip.status)) {
      throw new ConflictException({
        message: 'TRIP_ALREADY_COMPLETED_OR_CANCELLED',
        code: 'TRIP_ALREADY_COMPLETED_OR_CANCELLED',
      });
    }

    const cancellationReason = reason || 'Cancelled by administrator';
    const result = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.trip.updateMany({
        where: { id: tripId, status: { notIn: ['completed', 'cancelled'] } },
        data: {
          status: 'cancelled',
          isModerated: true,
          moderationReason: cancellationReason,
          moderatedBy: adminId,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException({
          message: 'TRIP_ALREADY_COMPLETED_OR_CANCELLED',
          code: 'TRIP_ALREADY_COMPLETED_OR_CANCELLED',
        });
      }
      const bookings = await tx.booking.findMany({
        where: { tripId, status: { in: ['pending', 'confirmed'] } },
        select: { id: true, passengerId: true, seatNumbers: true, seatNumber: true },
      });
      if (bookings.length > 0) {
        await tx.booking.updateMany({
          where: { id: { in: bookings.map((booking) => booking.id) } },
          data: {
            status: 'cancelled',
            cancellationReason,
            cancelledBy: adminId,
            cancelledAt: new Date(),
          },
        });
        const seatNumbers = bookings.flatMap((booking) =>
          booking.seatNumbers.length > 0
            ? booking.seatNumbers
            : booking.seatNumber != null
              ? [booking.seatNumber]
              : [],
        );
        if (seatNumbers.length > 0) {
          await tx.tripSeat.updateMany({
            where: { tripId, seatNumber: { in: seatNumbers } },
            data: { seatType: 'available' },
          });
        }
      }
      return {
        bookings: bookings.length,
        passengerIds: [...new Set(bookings.map((booking) => booking.passengerId))],
      };
    });

    const route = `${trip.originCity} ← ${trip.destinationCity}`;
    for (const passengerId of result.passengerIds) {
      try {
        await this.prisma.notification.create({
          data: {
            userId: passengerId,
            type: 'TRIP_CANCELLED',
            title: 'Trip cancelled',
            body: `The trip ${route} was cancelled by support.${reason ? ` Reason: ${reason}` : ''}`,
            data: { trip_id: tripId, reason: reason ?? null },
            sentVia: ['in_app'],
          },
        });
      } catch (err) {
        this.logger.warn(`trip cancellation notification failed: ${(err as Error).message}`);
      }
    }

    const driver = await this.prisma.user.findUnique({ where: { id: trip.driverId } });
    if (driver) {
      try {
        await this.notifications.sendToUser(driver as unknown as NotifyUser, 'TRIP_CANCELLED', {
          channels: ['in_app', 'push'],
          vars: { route, reason: reason ?? '' },
          data: { trip_id: tripId, reason: reason ?? null },
        });
      } catch (err) {
        this.logger.warn(`driver trip cancellation notification failed: ${(err as Error).message}`);
      }
    }

    return {
      trip: { id: tripId, status: 'cancelled', cancellation_reason: reason ?? null },
      cancelled_bookings: result.bookings,
    };
  }

  // ===== US3: Dossier tabs =====

  async getDriverHeader(driverId: string): Promise<Record<string, unknown>> {
    const driver = await this.getDriverOrThrow(driverId);
    const [totalTrips, completedTrips, canceledTrips, reviewsCount, ratingAgg] = await Promise.all([
      this.prisma.trip.count({ where: { driverId } }),
      this.prisma.trip.count({ where: { driverId, status: 'completed' } }),
      this.prisma.trip.count({ where: { driverId, status: 'cancelled' } }),
      this.prisma.rating.count({ where: { rateeId: driverId } }),
      this.prisma.rating.aggregate({ where: { rateeId: driverId }, _avg: { stars: true } }),
    ]);
    const computedAvg = ratingAgg._avg.stars != null ? Number(ratingAgg._avg.stars) : null;
    return {
      id: driver.id,
      name: driver.fullName,
      phone: maskPhone(driver.phone),
      phone_full: driver.phone,
      age: driver.age != null ? Number(driver.age) : null,
      city: null,
      avatar_url: toAbsoluteMediaUrl(driver.avatarUrl),
      account_status: deriveAccountStatus(driver),
      trip_stats: { total_trips: totalTrips, completed_trips: completedTrips, canceled_trips: canceledTrips },
      balance: Number(driver.totalBalance || 0),
      avg_rating: computedAvg ?? Number(driver.avgRating || 0),
      reviews_count: reviewsCount,
    };
  }

  async getDriverOverview(driverId: string): Promise<Record<string, unknown>> {
    const driver = await this.getDriverOrThrow(driverId);
    const [totalTrips, completedTrips, canceledTrips, ratingAgg, subscription] = await Promise.all([
      this.prisma.trip.count({ where: { driverId } }),
      this.prisma.trip.count({ where: { driverId, status: 'completed' } }),
      this.prisma.trip.count({ where: { driverId, status: 'cancelled' } }),
      this.prisma.rating.aggregate({ where: { rateeId: driverId }, _avg: { stars: true } }),
      this.prisma.driverSubscription.findFirst({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const avg = ratingAgg._avg.stars != null ? Number(ratingAgg._avg.stars) : Number(driver.avgRating || 0);
    return {
      personal_info: {
        name: driver.fullName,
        phone: maskPhone(driver.phone),
        phone_full: driver.phone,
        registration_date: driver.createdAt,
        last_login: driver.lastLoginAt,
        city: null,
      },
      trip_statistics: { total_trips: totalTrips, completed_trips: completedTrips, canceled_trips: canceledTrips, avg_rating: avg },
      balance_details: subscription
        ? {
          price_per_month: Number(subscription.planCost),
          duration_days: subscription.planPeriodDays,
          interest_rate: Number(subscription.planPercentageCut),
          start_date: subscription.activatedAt || subscription.createdAt,
          end_date: subscription.expiresAt,
        }
        : null,
    };
  }

  async listDriverTrips(driverId: string, query: DriverTripsQuery): Promise<Record<string, unknown>> {
    await this.getDriverOrThrow(driverId);
    const { page, limit, offset } = parsePagination(query);
    const where: Prisma.TripWhereInput = { driverId };
    if (query.status && query.status !== 'all') {
      where.status = tripStatusWhere(query.status);
    }
    if (query.month) {
      const [y, m] = String(query.month).split('-').map(Number);
      where.departureTime = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
    }
    const [rows, count] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        orderBy: { departureTime: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);
    const aggs = await this.tripPassengerAggregates(rows.map((t) => t.id));
    return {
      data: rows.map((t) => ({
        trip_id: t.id,
        code: t.id,
        route: { origin: t.originCity, destination: t.destinationCity },
        from: t.originCity,
        to: t.destinationCity,
        datetime: t.departureTime,
        date_time: t.departureTime,
        total_seats: Number(t.totalSeats),
        available_seats: Number(t.availableSeats),
        passengers_count: aggs.get(t.id)?.passengers_count ?? 0,
        reservations_count: aggs.get(t.id)?.reservations_count ?? 0,
        bookings: aggs.get(t.id)?.reservations_count ?? 0,
        seat_price: Number(t.farePerSeat),
        price: Number(t.farePerSeat),
        status: t.status,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }

  async getDriverEvaluations(driverId: string, query: DriverEvaluationsQuery): Promise<Record<string, unknown>> {
    await this.getDriverOrThrow(driverId);
    const { page, limit, offset } = parsePagination(query);
    const direction = query.direction === 'given' ? 'given' : 'received';
    const where: Prisma.RatingWhereInput = direction === 'given'
      ? { raterId: driverId }
      : { rateeId: driverId };
    const [summary, distRows, tagRows, rows, count] = await Promise.all([
      this.prisma.rating.aggregate({
        where,
        _avg: { stars: true },
        _count: { id: true },
      }),
      this.prisma.rating.groupBy({
        by: ['stars'],
        where,
        _count: { id: true },
      }),
      this.prisma.rating.findMany({
        where: { ...where, tags: { isEmpty: false } },
        select: { tags: true },
      }),
      this.prisma.rating.findMany({
        where,
        include: {
          rater: { select: { id: true, fullName: true, avatarUrl: true } },
          ratee: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.rating.count({ where }),
    ]);
    const countsByStar = new Map(distRows.map((r) => [r.stars, r._count.id]));
    const tagCounts = new Map<string, number>();
    for (const row of tagRows) {
      for (const tag of row.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
    const reviews = rows.map((r) => {
      const counterpart = direction === 'received' ? r.rater : r.ratee;
      return {
        id: r.id,
        direction,
        passenger_name: counterpart?.fullName || 'Unknown',
        passenger_avatar: toAbsoluteMediaUrl(counterpart?.avatarUrl),
        rating: r.stars,
        stars: r.stars,
        comment: r.review,
        text: r.review,
        tags: r.tags ?? [],
        was_late: r.wasLate,
        date: r.createdAt,
        created_at: r.createdAt,
      };
    });
    return {
      direction,
      summary: {
        average_rating: summary._avg.stars != null ? Number(summary._avg.stars) : 0,
        total_reviews: summary._count.id,
      },
      distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: countsByStar.get(rating) || 0 })),
      top_tags: topTags,
      data: reviews,
      reviews,
      pagination: buildPagination(count, page, limit),
    };
  }

  async getAccountLog(driverId: string): Promise<Record<string, unknown>> {
    await this.getDriverOrThrow(driverId);
    const now = new Date();
    const [penalties, complaints, profile, vehicle, reviews] = await Promise.all([
      this.prisma.penalty.findMany({ where: { userId: driverId }, orderBy: { startsAt: 'desc' } }),
      this.prisma.complaint.findMany({
        where: { OR: [{ reporterId: driverId }, { accusedId: driverId }] },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.driverProfile.findUnique({ where: { driverId } }),
      this.prisma.vehicle.findUnique({ where: { driverId } }),
      this.prisma.documentReview.findMany({ where: { driverId } }),
    ]);
    const uploadedDocuments = (ALL_DOCUMENT_KEYS as DocumentDef[]).filter((def) => {
      const imageId = def.source === 'profile'
        ? (profile as unknown as Record<string, unknown> | null)?.[def.column as string]
        : def.source === 'vehicle'
          ? (vehicle as unknown as Record<string, unknown> | null)?.[def.column as string]
          : null;
      return imageId != null;
    });
    const decidedKeys = new Set(reviews.map((review) => review.documentKey));
    const pendingDocuments = uploadedDocuments.filter((def) => !decidedKeys.has(def.key)).length;
    const log: Record<string, unknown>[] = [
      ...penalties.map((p) => {
        const open = !p.endsAt && new Date(p.startsAt) <= now;
        return {
          title: p.penaltyType || p.type,
          reason: p.reason,
          related_trip_id: p.tripId || null,
          date: p.startsAt,
          type: p.type,
          status: open ? 'pending' : 'resolved',
        };
      }),
      ...complaints.map((c) => ({
        title: c.category,
        reason: c.description,
        related_trip_id: null,
        date: c.createdAt,
        type: 'enquiry',
        status: ['open', 'reviewing'].includes(c.status) ? 'pending' : 'resolved',
        direction: c.reporterId === driverId ? 'by_driver' : 'against_driver',
      })),
    ].sort((a, b) => new Date(b.date as unknown as string).getTime() - new Date(a.date as unknown as string).getTime());

    return {
      summary: {
        violations: penalties.length,
        warnings: penalties.filter((p) => p.type === 'warning').length,
        suspensions: penalties.filter((p) => p.type !== 'warning').length,
        complaints_against: complaints.filter((c) => c.accusedId === driverId).length,
        complaints_by: complaints.filter((c) => c.reporterId === driverId).length,
        pending_documents: pendingDocuments,
      },
      log,
    };
  }

  async getCarDetails(driverId: string): Promise<Record<string, unknown>> {
    const { vehicle, reviewByKey } = await this.loadDossierContext(driverId);
    if (!vehicle) {
      return { car_info: null, car_photos: { front: null, rear: null }, document_status: [], vehicle_verified: false };
    }
    const imageMap = await this.resolveImages([
      vehicle.vehiclePhotoFront as number | null,
      vehicle.vehiclePhotoBack as number | null,
      vehicle.registrationDocFront as number | null,
      vehicle.registrationDocBack as number | null,
    ]);
    const front = vehicle.vehiclePhotoFront != null ? imageMap.get(vehicle.vehiclePhotoFront as number) : null;
    const rear = vehicle.vehiclePhotoBack != null ? imageMap.get(vehicle.vehiclePhotoBack as number) : null;
    const defs = (DOCUMENT_KEYS.vehicle_documents as unknown as DocumentDef[]).filter((d) => d.key.startsWith('registration'));
    const entries = defs.map((d) => this.documentEntry(d, null, vehicle, reviewByKey, imageMap));
    return {
      car_info: {
        type: vehicle.vehicleType,
        make: vehicle.manufacturer,
        model: vehicle.model,
        year: vehicle.modelYear,
        color: vehicle.color,
        plate_number: vehicle.plateNumber,
        seats: vehicle.seats,
      },
      car_photos: { front: toAbsoluteMediaUrl(front ? front.url : null), rear: toAbsoluteMediaUrl(rear ? rear.url : null) },
      document_status: entries.map(({ key, status }) => ({ key, status })),
      vehicle_verified: vehicle.isVerified,
    };
  }

  async getDocuments(driverId: string): Promise<Record<string, unknown>> {
    const { profile, vehicle, reviewByKey } = await this.loadDossierContext(driverId);
    const imageIds = ALL_DOCUMENT_KEYS.map((d) => (d.source === 'profile'
      ? profile?.[d.column as string]
      : d.source === 'vehicle' ? vehicle?.[d.column as string] : null)).filter((v): v is number => v != null);
    const imageMap = await this.resolveImages(imageIds);
    return {
      personal_documents: (DOCUMENT_KEYS.personal_documents as unknown as DocumentDef[])
        .map((d) => this.documentEntry(d, profile, vehicle, reviewByKey, imageMap)),
      vehicle_documents: (DOCUMENT_KEYS.vehicle_documents as unknown as DocumentDef[])
        .map((d) => this.documentEntry(d, profile, vehicle, reviewByKey, imageMap)),
    };
  }

  // ===== US4: Actions =====

  async setDriverStatus(adminId: string, driverId: string, requestedStatus: string): Promise<Record<string, unknown>> {
    const driver = await this.getDriverOrThrow(driverId);
    if (!DRIVER_STATUSES.includes(requestedStatus)) {
      throw new UnprocessableEntityException({ message: 'INVALID_DRIVER_STATUS_VALUE', code: 'VALIDATION_FAILED' });
    }

    const currentDerived = deriveAccountStatus(driver as unknown as BucketUser);
    if (currentDerived === requestedStatus) {
      throw new ConflictException({ message: 'DRIVER_ALREADY_IN_STATE', code: 'DRIVER_ALREADY_IN_STATE' });
    }

    const originalVerification = driver.verificationStatus;
    const updates: Prisma.UserUpdateInput = {};
    if (requestedStatus === 'active') updates.status = 'active';
    if (requestedStatus === 'suspended') updates.status = 'suspended';
    if (requestedStatus === 'blocked') updates.status = 'banned';
    if (requestedStatus === 'pending') {
      updates.status = 'active';
      updates.verificationStatus = 'pending';
    }

    await this.prisma.user.update({ where: { id: driverId }, data: updates });

    if (updates.verificationStatus && originalVerification !== updates.verificationStatus) {
      await this.prisma.verificationStatusChange.create({
        data: {
          driverId,
          fromStatus: originalVerification as 'unverified' | 'pending' | 'rejected' | 'approved',
          toStatus: updates.verificationStatus as 'unverified' | 'pending' | 'rejected' | 'approved',
          changedBy: adminId,
          reason: 'Set to pending via admin dashboard',
        },
      });
    }

    const reloaded = await this.prisma.user.findUnique({ where: { id: driverId } });
    return { driver: { id: driverId, account_status: deriveAccountStatus(reloaded as unknown as BucketUser) } };
  }

  async applyStandingAction(
    adminId: string,
    driverId: string,
    action: string,
    reason?: string | null,
  ): Promise<Record<string, unknown>> {
    if (!STANDING_ACTIONS.includes(action)) {
      throw new UnprocessableEntityException({ message: 'INVALID_ACCOUNT_ACTION', code: 'VALIDATION_FAILED' });
    }
    const driver = await this.getDriverOrThrow(driverId);
    const currentDerived = deriveAccountStatus(driver as unknown as BucketUser);

    if (action === 'suspend') {
      if (currentDerived === 'suspended') {
        throw new ConflictException({ message: 'DRIVER_ALREADY_IN_STATE', code: 'DRIVER_ALREADY_IN_STATE' });
      }
      await this.prisma.user.update({ where: { id: driverId }, data: { status: 'suspended' } });
      await this.prisma.penalty.create({
        data: {
          userId: driverId,
          type: 'suspension',
          penaltyType: 'general',
          severity: 'moderate',
          reason: reason || 'Suspended by administrator from the dashboard',
          issuedBy: adminId,
          startsAt: new Date(),
        },
      });
    } else {
      if (currentDerived === 'active') {
        throw new ConflictException({ message: 'DRIVER_ALREADY_IN_STATE', code: 'DRIVER_ALREADY_IN_STATE' });
      }
      await this.prisma.user.update({ where: { id: driverId }, data: { status: 'active' } });
      // Lifting (رفع إيقاف) closes every open enforcement — suspensions and
      // bans alike (Figma 10004:22773 / 10012:23988). Previously only
      // suspensions were closed, leaving the ban row open.
      await this.prisma.penalty.updateMany({
        where: { userId: driverId, type: { in: ['suspension', 'ban'] }, endsAt: null },
        data: { endsAt: new Date() },
      });
    }

    const reloaded = await this.prisma.user.findUnique({ where: { id: driverId } });
    return { driver: { id: driverId, account_status: deriveAccountStatus(reloaded as unknown as BucketUser) } };
  }

  async decideDocument(
    adminId: string,
    driverId: string,
    documentKey: string,
    decision: 'approved' | 'rejected',
    reason?: string | null,
  ): Promise<Record<string, unknown>> {
    const def = ALL_DOCUMENT_KEYS.find((d) => d.key === documentKey);
    if (!def) {
      throw new BadRequestException({ message: 'DOCUMENT_KEY_NOT_RECOGNIZED', code: 'BAD_REQUEST' });
    }
    await this.getDriverOrThrow(driverId);

    if (!def.source) {
      throw new BadRequestException({ message: 'DOCUMENT_HAS_NO_BACKING_FILE', code: 'BAD_REQUEST' });
    }

    const { profile, vehicle } = await this.loadDossierContext(driverId);
    const imageId = def.source === 'profile' ? profile?.[def.column as string] : vehicle?.[def.column as string];
    if (imageId == null) {
      throw new BadRequestException({ message: 'DOCUMENT_HAS_NO_BACKING_FILE', code: 'BAD_REQUEST' });
    }

    const decidedAt = new Date();
    const existing = await this.prisma.documentReview.findUnique({
      where: { driverId_documentKey: { driverId, documentKey } },
    });
    let review: { decidedAt: Date };
    if (!existing) {
      review = await this.prisma.documentReview.create({
        data: {
          driverId,
          documentKey,
          decision,
          reason: reason || null,
          decidedBy: adminId,
          decidedAt,
        },
      });
    } else {
      review = await this.prisma.documentReview.update({
        where: { driverId_documentKey: { driverId, documentKey } },
        data: {
          decision,
          reason: reason || null,
          decidedBy: adminId,
          decidedAt,
        },
      });
    }

    // Approving every uploaded document must actually verify the driver and
    // notify them; rejecting one must mark the driver rejected and send the
    // reason. The per-document review alone left drivers pending forever.
    const verification = await this.syncVerificationFromDocuments(
      driverId,
      adminId,
      documentKey,
      decision,
      reason,
    );

    return {
      document: {
        key: documentKey,
        status: decision,
        decided_by: adminId,
        decided_at: review.decidedAt,
        ...(reason ? { reason } : {}),
      },
      ...(verification ? { verification } : {}),
    };
  }

  private async syncVerificationFromDocuments(
    driverId: string,
    adminId: string,
    documentKey: string,
    decision: 'approved' | 'rejected',
    reason?: string | null,
  ): Promise<Record<string, unknown> | null> {
    const required = ALL_DOCUMENT_KEYS.filter((d) => d.source != null);
    const [driver, profile, vehicle, reviews] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: driverId } }),
      this.prisma.driverProfile.findUnique({ where: { driverId } }),
      this.prisma.vehicle.findUnique({ where: { driverId } }),
      this.prisma.documentReview.findMany({ where: { driverId } }),
    ]);
    if (!driver) return null;

    const profileRow = profile as unknown as Record<string, unknown> | null;
    const vehicleRow = vehicle as unknown as Record<string, unknown> | null;
    const reviewByKey = new Map(reviews.map((r) => [r.documentKey, r]));
    const rejectedKeys = required
      .filter((d) => reviewByKey.get(d.key)?.decision === 'rejected')
      .map((d) => d.key);
    const hasRejected = rejectedKeys.length > 0 || decision === 'rejected';
    const allUploaded = required.every((d) => {
      const value = d.source === 'profile'
        ? profileRow?.[d.column as string]
        : vehicleRow?.[d.column as string];
      return value != null;
    });
    const allApproved = allUploaded
      && required.every((d) => reviewByKey.get(d.key)?.decision === 'approved');

    if (hasRejected) {
      const rejectionReason = reason
        || reviewByKey.get(documentKey)?.reason
        || 'One or more documents were rejected';
      const fields = rejectedKeys.length > 0 ? rejectedKeys : [documentKey];
      const alreadyRejected = driver.verificationStatus === 'rejected'
        && driver.isVerified === false
        && driver.verificationRejectionReason === rejectionReason;

      if (profile) {
        await this.prisma.driverProfile.update({ where: { id: profile.id }, data: { idVerified: false } });
      }
      if (vehicle) {
        await this.prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            isVerified: false,
            verificationNotes: rejectionReason,
            verificationRejectionReason: rejectionReason,
            verificationRejectedAt: new Date(),
          },
        });
      }
      if (!alreadyRejected) {
        const fromStatus = driver.verificationStatus;
        await this.prisma.user.update({
          where: { id: driverId },
          data: {
            isVerified: false,
            verificationStatus: 'rejected',
            verificationRejectedAt: new Date(),
            verificationRejectionReason: rejectionReason,
            verificationRejectionFields: fields as never,
          },
        });
        await this.prisma.verificationStatusChange.create({
          data: {
            driverId,
            fromStatus: fromStatus as never,
            toStatus: 'rejected',
            reason: rejectionReason,
            markedFields: fields as never,
            changedBy: adminId,
          },
        });
        try {
          await this.notifications.sendToUser(
            driver as unknown as NotifyUser,
            'VERIFICATION_REJECTED',
            {
              channels: ['in_app', 'push'],
              vars: { subject: 'identity documents', reason: rejectionReason },
              data: { driver_id: driverId, reason: rejectionReason, fields_to_fix: fields },
            },
          );
        } catch (err) {
          this.logger.warn(`verification rejection notification failed: ${(err as Error).message}`);
        }
      }
      return { status: 'rejected', reason: rejectionReason, fields_to_fix: fields, notified: !alreadyRejected };
    }

    if (!allApproved) {
      return { status: driver.verificationStatus, complete: false };
    }

    const alreadyApproved = driver.verificationStatus === 'approved'
      && driver.isVerified === true
      && Boolean(profile?.idVerified)
      && Boolean(vehicle?.isVerified);
    if (alreadyApproved) {
      return { status: 'approved', complete: true, notified: false };
    }

    const fromStatus = driver.verificationStatus;
    if (profile) {
      await this.prisma.driverProfile.update({ where: { id: profile.id }, data: { idVerified: true } });
    }
    if (vehicle) {
      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          isVerified: true,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          verificationRejectionReason: null,
          verificationNotes: null,
        },
      });
    }
    await this.prisma.user.update({
      where: { id: driverId },
      data: {
        isVerified: true,
        verificationStatus: 'approved',
        verificationRejectedAt: null,
        verificationRejectionReason: null,
        verificationRejectionFields: [] as never,
      },
    });
    await this.prisma.verificationStatusChange.create({
      data: {
        driverId,
        fromStatus: fromStatus as never,
        toStatus: 'approved',
        changedBy: adminId,
      },
    });
    try {
      await this.notifications.sendToUser(
        driver as unknown as NotifyUser,
        'VERIFICATION_APPROVED',
        {
          channels: ['in_app', 'push'],
          vars: { subject: 'identity documents' },
          data: { driver_id: driverId },
        },
      );
    } catch (err) {
      this.logger.warn(`verification approval notification failed: ${(err as Error).message}`);
    }
    return { status: 'approved', complete: true, notified: true };
  }

  // Figma 9928:23297 (إرسال إشعار للسائق): custom title/body + category chips.
  // Stored as ADMIN_NOTICE (same pattern as the passenger notify endpoint) so
  // template lookups are unaffected.
  async sendDriverNotification(
    adminId: string,
    driverId: string,
    dto: { title: string; body: string; type: string },
  ): Promise<Record<string, unknown>> {
    await this.getDriverOrThrow(driverId);
    const notification = await this.prisma.notification.create({
      data: {
        userId: driverId,
        type: 'ADMIN_NOTICE',
        title: dto.title,
        body: dto.body,
        data: { category: dto.type, sent_by: adminId },
        sentVia: ['in_app'],
      },
    });
    return {
      notification: {
        id: notification.id,
        user_id: notification.userId,
        title: notification.title,
        category: dto.type,
        created_at: notification.createdAt,
      },
    };
  }

  // ===== US5: Shared listings =====

  async listReservations(query: ReservationsQuery): Promise<Record<string, unknown>> {
    const { page, limit, offset } = parsePagination(query);
    const where: Prisma.BookingWhereInput = {};
    if (query.status && ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].includes(query.status)) {
      where.status = query.status as 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    }

    const [rows, count] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          trip: {
            select: {
              id: true,
              originCity: true,
              destinationCity: true,
              departureTime: true,
              driver: { select: { id: true, fullName: true } },
            },
          },
          passenger: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: rows.map((b) => ({
        reservation_id: b.id,
        reference_code: b.referenceCode,
        driver: b.trip?.driver ? { id: b.trip.driver.id, name: b.trip.driver.fullName } : null,
        passenger: b.passenger ? { id: b.passenger.id, name: b.passenger.fullName } : null,
        trip: b.trip ? {
          id: b.trip.id,
          origin: b.trip.originCity,
          destination: b.trip.destinationCity,
          departure_time: b.trip.departureTime,
        } : null,
        seats_booked: b.seatsBooked,
        price: Number(b.agreedFare),
        currency: b.currency,
        status: b.status,
      })),
      pagination: buildPagination(count, page, limit),
    };
  }
}
