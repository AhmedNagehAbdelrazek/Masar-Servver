var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
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
};
const ALL_DOCUMENT_KEYS = Object.values(DOCUMENT_KEYS).flat();
const DRIVER_STATUSES = ['active', 'suspended', 'pending', 'blocked'];
const STANDING_ACTIONS = ['suspend', 'reactivate', 'unblock'];
const TRIP_ACTIVE_STATUSES = ['published', 'full', 'in_progress', 'ongoing'];
const ACTIVE_BUCKET = {
    role: 'driver',
    status: { in: ['active', 'warned'] },
    verificationStatus: 'approved',
};
const PENDING_BUCKET = {
    role: 'driver',
    status: { in: ['active', 'warned'] },
    verificationStatus: { in: ['unverified', 'pending', 'rejected'] },
};
const SUSPENDED_BUCKET = { role: 'driver', status: 'suspended' };
const BLOCKED_BUCKET = { role: 'driver', status: 'banned' };
export function deriveAccountStatus(user) {
    if (user.status === 'banned')
        return 'blocked';
    if (user.status === 'suspended')
        return 'suspended';
    if (['unverified', 'pending', 'rejected', 'approved'].includes(user.verificationStatus)
        && user.verificationStatus !== 'approved')
        return 'pending';
    return 'active';
}
function bucketWhereFor(statusFilter) {
    switch (statusFilter) {
        case 'active': return ACTIVE_BUCKET;
        case 'pending': return PENDING_BUCKET;
        case 'suspended': return SUSPENDED_BUCKET;
        case 'blocked': return BLOCKED_BUCKET;
        default: return null;
    }
}
function mapTripStatusFilter(status) {
    switch (status) {
        case 'pending': return ['published', 'full'];
        case 'active': return ['in_progress', 'ongoing'];
        case 'completed': return 'completed';
        case 'canceled':
        case 'cancelled': return 'cancelled';
        default: return null;
    }
}
function tripStatusWhere(status) {
    const mapped = mapTripStatusFilter(status);
    if (Array.isArray(mapped))
        return { in: mapped };
    if (mapped)
        return mapped;
    if (status === 'canceled')
        return 'cancelled';
    return status;
}
export function maskPhone(phone) {
    if (!phone)
        return null;
    const str = String(phone).trim();
    if (str.length <= 7)
        return '***';
    return `${str.slice(0, str.length - 7)}***${str.slice(-4)}`;
}
function recentTripShape(trip, driver, agg) {
    return {
        trip_id: trip.id,
        driver: driver ? { id: driver.id, name: driver.fullName } : null,
        route: { origin: trip.originCity, destination: trip.destinationCity },
        departure_time: trip.departureTime,
        status: trip.status,
        passengers_count: agg?.passengers_count ?? 0,
        reservations_count: agg?.reservations_count ?? 0,
    };
}
let AdminDashboardService = class AdminDashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDriverOrThrow(driverId) {
        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!driver || driver.role !== 'driver') {
            throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
        }
        return driver;
    }
    tripPassengerAggregates(tripIds) {
        if (tripIds.length === 0)
            return Promise.resolve(new Map());
        return this.prisma.booking.groupBy({
            by: ['tripId'],
            where: { tripId: { in: tripIds }, status: { not: 'cancelled' } },
            _count: { id: true },
            _sum: { seatsBooked: true },
        }).then((rows) => new Map(rows.map((r) => [
            r.tripId,
            {
                reservations_count: r._count.id,
                passengers_count: r._sum.seatsBooked ?? 0,
            },
        ])));
    }
    async pendingDocumentKeysFor(driverIds) {
        const result = new Map();
        if (driverIds.length === 0)
            return result;
        const [profiles, vehicles, reviews] = await Promise.all([
            this.prisma.driverProfile.findMany({ where: { driverId: { in: driverIds } } }),
            this.prisma.vehicle.findMany({ where: { driverId: { in: driverIds } } }),
            this.prisma.documentReview.findMany({ where: { driverId: { in: driverIds } } }),
        ]);
        const profileByDriver = new Map(profiles.map((p) => [p.driverId, p]));
        const vehicleByDriver = new Map(vehicles.map((v) => [v.driverId, v]));
        const decidedByDriver = new Map();
        for (const r of reviews) {
            if (!decidedByDriver.has(r.driverId))
                decidedByDriver.set(r.driverId, new Set());
            decidedByDriver.get(r.driverId)?.add(r.documentKey);
        }
        for (const id of driverIds) {
            const profile = profileByDriver.get(id);
            const vehicle = vehicleByDriver.get(id);
            const decided = decidedByDriver.get(id) ?? new Set();
            const keys = [];
            for (const def of ALL_DOCUMENT_KEYS) {
                const value = def.source === 'profile'
                    ? profile?.[def.column]
                    : def.source === 'vehicle' ? vehicle?.[def.column] : null;
                if (value != null && !decided.has(def.key))
                    keys.push(def.key);
            }
            result.set(id, keys);
        }
        return result;
    }
    async countPendingDocuments() {
        const profileColumns = [
            'userIdentificationFront', 'userIdentificationBack', 'personalImageWithId',
            'linceseFront', 'linceseBack',
        ];
        const vehicleColumns = ['registrationDocFront', 'registrationDocBack'];
        const counts = await Promise.all([
            ...profileColumns.map((col) => this.prisma.driverProfile.count({
                where: { [col]: { not: null }, driver: { role: 'driver' } },
            })),
            ...vehicleColumns.map((col) => this.prisma.vehicle.count({
                where: { [col]: { not: null }, driver: { role: 'driver' } },
            })),
        ]);
        const uploadedTotal = counts.reduce((sum, n) => sum + n, 0);
        const decided = await this.prisma.documentReview.count();
        return Math.max(0, uploadedTotal - decided);
    }
    async resolveImages(imageIds) {
        const ids = [...new Set(imageIds.filter((v) => v != null))];
        if (ids.length === 0)
            return new Map();
        const rows = await this.prisma.uploadedImage.findMany({ where: { id: { in: ids } } });
        return new Map(rows.map((r) => [r.id, r]));
    }
    documentEntry(def, profile, vehicle, reviewByKey, imageMap) {
        const imageId = (def.source === 'profile'
            ? profile?.[def.column]
            : def.source === 'vehicle' ? vehicle?.[def.column] : null);
        const image = imageId != null ? imageMap.get(imageId) : null;
        const review = reviewByKey.get(def.key);
        let status;
        if (review)
            status = review.decision;
        else if (image)
            status = 'pending';
        else
            status = 'missing';
        return {
            key: def.key,
            document_url: image ? image.url : null,
            upload_date: image ? image.createdAt : null,
            status,
            ...(status === 'rejected' && review?.reason ? { reason: review.reason } : {}),
            ...(def.source == null ? { note: 'not_tracked_yet' } : {}),
        };
    }
    async loadDossierContext(driverId) {
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
            profile: profile,
            vehicle: vehicle,
            reviewByKey,
        };
    }
    async getSummary() {
        const [totalDrivers, activeDrivers, totalTrips, activeTrips, totalVehicles, pendingDocsCount, pendingDriversRows, unresolvedComplaints, topRouteRows, recentTripRows, latestComplaints,] = await Promise.all([
            this.prisma.user.count({ where: { role: 'driver' } }),
            this.prisma.user.count({ where: ACTIVE_BUCKET }),
            this.prisma.trip.count(),
            this.prisma.trip.count({ where: { status: { in: [...TRIP_ACTIVE_STATUSES] } } }),
            this.prisma.vehicle.count(),
            this.countPendingDocuments(),
            this.prisma.user.findMany({
                where: PENDING_BUCKET,
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
        ]);
        const aggs = await this.tripPassengerAggregates(recentTripRows.map((t) => t.id));
        const pendingDocKeys = await this.pendingDocumentKeysFor(pendingDriversRows.map((u) => u.id));
        return {
            kpis: {
                total_drivers: totalDrivers,
                active_drivers: activeDrivers,
                total_trips: totalTrips,
                active_trips: activeTrips,
                total_vehicles: totalVehicles,
                pending_documents: pendingDocsCount,
            },
            alerts: [
                { type: 'pending_verification_documents', message: 'ALERT_PENDING_VERIFICATION_DOCUMENTS', count: pendingDocsCount },
                { type: 'pending_review_drivers', message: 'ALERT_PENDING_REVIEW_DRIVERS', count: pendingDriversRows.length >= 10 ? `${pendingDriversRows.length}+` : pendingDriversRows.length },
                { type: 'unresolved_complaints', message: 'ALERT_UNRESOLVED_COMPLAINTS', count: unresolvedComplaints },
            ],
            top_routes: topRouteRows.map((r) => ({
                origin: r.originCity,
                destination: r.destinationCity,
                trips_count: r._count.id,
            })),
            recent_trips: recentTripRows.map((t) => recentTripShape(t, t.driver, aggs.get(t.id))),
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
    async getRecentTrips(query) {
        const { page, limit, offset } = parsePagination(query);
        const where = {};
        if (query.status)
            where.status = tripStatusWhere(query.status);
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
            data: rows.map((t) => recentTripShape(t, t.driver, aggs.get(t.id))),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getTopRoutes() {
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
    async getPendingRequests(query) {
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
    async getLatestComplaints(query) {
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
    async listDrivers(query) {
        const { page, limit, offset } = parsePagination(query);
        const where = { ...(bucketWhereFor(query.status) || { role: 'driver' }) };
        if (query.search) {
            const term = query.search;
            where.OR = [
                { fullName: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term, mode: 'insensitive' } },
            ];
        }
        if (query.registration_from || query.registration_to) {
            const createdAt = {};
            if (query.registration_from)
                createdAt.gte = new Date(`${query.registration_from}T00:00:00.000Z`);
            if (query.registration_to)
                createdAt.lte = new Date(`${query.registration_to}T23:59:59.999Z`);
            where.createdAt = createdAt;
        }
        const sortColumns = {
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
                },
                orderBy: { [sortColumn]: sortOrder },
                skip: offset,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: rows.map((u) => ({
                id: u.id,
                name: u.fullName,
                phone: maskPhone(u.phone),
                registration_date: u.createdAt,
                avg_rating: Number(u.avgRating || 0),
                total_trips: u.driverProfile?.totalTrips ?? 0,
                balance: Number(u.totalBalance || 0),
                account_status: deriveAccountStatus({ status: u.status, verificationStatus: u.verificationStatus }),
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getDriverStats() {
        const [total, active, suspended, pending] = await Promise.all([
            this.prisma.user.count({ where: { role: 'driver' } }),
            this.prisma.user.count({ where: ACTIVE_BUCKET }),
            this.prisma.user.count({ where: SUSPENDED_BUCKET }),
            this.prisma.user.count({ where: PENDING_BUCKET }),
        ]);
        return { total_drivers: total, active_drivers: active, suspended_drivers: suspended, pending_drivers: pending };
    }
    async getDriverHeader(driverId) {
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
            age: driver.age != null ? Number(driver.age) : null,
            city: null,
            avatar_url: driver.avatarUrl,
            account_status: deriveAccountStatus(driver),
            trip_stats: { total_trips: totalTrips, completed_trips: completedTrips, canceled_trips: canceledTrips },
            balance: Number(driver.totalBalance || 0),
            avg_rating: computedAvg ?? Number(driver.avgRating || 0),
            reviews_count: reviewsCount,
        };
    }
    async getDriverOverview(driverId) {
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
    async listDriverTrips(driverId, query) {
        await this.getDriverOrThrow(driverId);
        const { page, limit, offset } = parsePagination(query);
        const where = { driverId };
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
                route: { origin: t.originCity, destination: t.destinationCity },
                date_time: t.departureTime,
                passengers_count: aggs.get(t.id)?.passengers_count ?? 0,
                reservations_count: aggs.get(t.id)?.reservations_count ?? 0,
                price: Number(t.farePerSeat),
                status: t.status,
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getDriverEvaluations(driverId, query) {
        await this.getDriverOrThrow(driverId);
        const { page, limit, offset } = parsePagination(query);
        const [summary, distRows, tagRows, rows, count] = await Promise.all([
            this.prisma.rating.aggregate({
                where: { rateeId: driverId },
                _avg: { stars: true },
                _count: { id: true },
            }),
            this.prisma.rating.groupBy({
                by: ['stars'],
                where: { rateeId: driverId },
                _count: { id: true },
            }),
            this.prisma.rating.findMany({
                where: { rateeId: driverId, tags: { isEmpty: false } },
                select: { tags: true },
            }),
            this.prisma.rating.findMany({
                where: { rateeId: driverId },
                include: { rater: { select: { id: true, fullName: true, avatarUrl: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.rating.count({ where: { rateeId: driverId } }),
        ]);
        const countsByStar = new Map(distRows.map((r) => [r.stars, r._count.id]));
        const tagCounts = new Map();
        for (const row of tagRows) {
            for (const tag of row.tags || [])
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
        const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
        return {
            summary: {
                average_rating: summary._avg.stars != null ? Number(summary._avg.stars) : 0,
                total_reviews: summary._count.id,
            },
            distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: countsByStar.get(rating) || 0 })),
            top_tags: topTags,
            reviews: rows.map((r) => ({
                passenger_name: r.rater?.fullName || 'Unknown',
                passenger_avatar: r.rater?.avatarUrl || null,
                rating: r.stars,
                comment: r.review,
                was_late: r.wasLate,
                date: r.createdAt,
            })),
            pagination: buildPagination(count, page, limit),
        };
    }
    async getAccountLog(driverId) {
        await this.getDriverOrThrow(driverId);
        const now = new Date();
        const [penalties, complaints] = await Promise.all([
            this.prisma.penalty.findMany({ where: { userId: driverId }, orderBy: { startsAt: 'desc' } }),
            this.prisma.complaint.findMany({
                where: { OR: [{ reporterId: driverId }, { accusedId: driverId }] },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const log = [
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
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return {
            summary: {
                violations: penalties.length,
                warnings: penalties.filter((p) => p.type === 'warning').length,
                suspensions: penalties.filter((p) => p.type !== 'warning').length,
                complaints_against: complaints.filter((c) => c.accusedId === driverId).length,
                complaints_by: complaints.filter((c) => c.reporterId === driverId).length,
            },
            log,
        };
    }
    async getCarDetails(driverId) {
        const { vehicle, reviewByKey } = await this.loadDossierContext(driverId);
        if (!vehicle) {
            return { car_info: null, car_photos: { front: null, rear: null }, document_status: [], vehicle_verified: false };
        }
        const imageMap = await this.resolveImages([
            vehicle.vehiclePhotoFront,
            vehicle.vehiclePhotoBack,
            vehicle.registrationDocFront,
            vehicle.registrationDocBack,
        ]);
        const front = vehicle.vehiclePhotoFront != null ? imageMap.get(vehicle.vehiclePhotoFront) : null;
        const rear = vehicle.vehiclePhotoBack != null ? imageMap.get(vehicle.vehiclePhotoBack) : null;
        const defs = DOCUMENT_KEYS.vehicle_documents.filter((d) => d.key.startsWith('registration'));
        const entries = defs.map((d) => this.documentEntry(d, null, vehicle, reviewByKey, imageMap));
        return {
            car_info: {
                make: vehicle.manufacturer,
                model: vehicle.model,
                year: vehicle.modelYear,
                color: vehicle.color,
                plate_number: vehicle.plateNumber,
                seats: vehicle.seats,
            },
            car_photos: { front: front ? front.url : null, rear: rear ? rear.url : null },
            document_status: entries.map(({ key, status }) => ({ key, status })),
            vehicle_verified: vehicle.isVerified,
        };
    }
    async getDocuments(driverId) {
        const { profile, vehicle, reviewByKey } = await this.loadDossierContext(driverId);
        const imageIds = ALL_DOCUMENT_KEYS.map((d) => (d.source === 'profile'
            ? profile?.[d.column]
            : d.source === 'vehicle' ? vehicle?.[d.column] : null)).filter((v) => v != null);
        const imageMap = await this.resolveImages(imageIds);
        return {
            personal_documents: DOCUMENT_KEYS.personal_documents
                .map((d) => this.documentEntry(d, profile, vehicle, reviewByKey, imageMap)),
            vehicle_documents: DOCUMENT_KEYS.vehicle_documents
                .map((d) => this.documentEntry(d, profile, vehicle, reviewByKey, imageMap)),
        };
    }
    async setDriverStatus(adminId, driverId, requestedStatus) {
        const driver = await this.getDriverOrThrow(driverId);
        if (!DRIVER_STATUSES.includes(requestedStatus)) {
            throw new UnprocessableEntityException({ message: 'INVALID_DRIVER_STATUS_VALUE', code: 'VALIDATION_FAILED' });
        }
        const currentDerived = deriveAccountStatus(driver);
        if (currentDerived === requestedStatus) {
            throw new ConflictException({ message: 'DRIVER_ALREADY_IN_STATE', code: 'DRIVER_ALREADY_IN_STATE' });
        }
        const originalVerification = driver.verificationStatus;
        const updates = {};
        if (requestedStatus === 'active')
            updates.status = 'active';
        if (requestedStatus === 'suspended')
            updates.status = 'suspended';
        if (requestedStatus === 'blocked')
            updates.status = 'banned';
        if (requestedStatus === 'pending') {
            updates.status = 'active';
            updates.verificationStatus = 'pending';
        }
        await this.prisma.user.update({ where: { id: driverId }, data: updates });
        if (updates.verificationStatus && originalVerification !== updates.verificationStatus) {
            await this.prisma.verificationStatusChange.create({
                data: {
                    driverId,
                    fromStatus: originalVerification,
                    toStatus: updates.verificationStatus,
                    changedBy: adminId,
                    reason: 'Set to pending via admin dashboard',
                },
            });
        }
        const reloaded = await this.prisma.user.findUnique({ where: { id: driverId } });
        return { driver: { id: driverId, account_status: deriveAccountStatus(reloaded) } };
    }
    async applyStandingAction(adminId, driverId, action, reason) {
        if (!STANDING_ACTIONS.includes(action)) {
            throw new UnprocessableEntityException({ message: 'INVALID_ACCOUNT_ACTION', code: 'VALIDATION_FAILED' });
        }
        const driver = await this.getDriverOrThrow(driverId);
        const currentDerived = deriveAccountStatus(driver);
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
        }
        else {
            if (currentDerived === 'active') {
                throw new ConflictException({ message: 'DRIVER_ALREADY_IN_STATE', code: 'DRIVER_ALREADY_IN_STATE' });
            }
            await this.prisma.user.update({ where: { id: driverId }, data: { status: 'active' } });
            await this.prisma.penalty.updateMany({
                where: { userId: driverId, type: 'suspension', endsAt: null },
                data: { endsAt: new Date() },
            });
        }
        const reloaded = await this.prisma.user.findUnique({ where: { id: driverId } });
        return { driver: { id: driverId, account_status: deriveAccountStatus(reloaded) } };
    }
    async decideDocument(adminId, driverId, documentKey, decision, reason) {
        const def = ALL_DOCUMENT_KEYS.find((d) => d.key === documentKey);
        if (!def) {
            throw new BadRequestException({ message: 'DOCUMENT_KEY_NOT_RECOGNIZED', code: 'BAD_REQUEST' });
        }
        await this.getDriverOrThrow(driverId);
        if (!def.source) {
            throw new BadRequestException({ message: 'DOCUMENT_HAS_NO_BACKING_FILE', code: 'BAD_REQUEST' });
        }
        const { profile, vehicle } = await this.loadDossierContext(driverId);
        const imageId = def.source === 'profile' ? profile?.[def.column] : vehicle?.[def.column];
        if (imageId == null) {
            throw new BadRequestException({ message: 'DOCUMENT_HAS_NO_BACKING_FILE', code: 'BAD_REQUEST' });
        }
        const decidedAt = new Date();
        const existing = await this.prisma.documentReview.findUnique({
            where: { driverId_documentKey: { driverId, documentKey } },
        });
        let review;
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
        }
        else {
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
        return {
            document: {
                key: documentKey,
                status: decision,
                decided_by: adminId,
                decided_at: review.decidedAt,
                ...(reason ? { reason } : {}),
            },
        };
    }
    async listReservations(query) {
        const { page, limit, offset } = parsePagination(query);
        const where = {};
        if (query.status && ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].includes(query.status)) {
            where.status = query.status;
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
};
AdminDashboardService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], AdminDashboardService);
export { AdminDashboardService };
//# sourceMappingURL=admin-dashboard.service.js.map