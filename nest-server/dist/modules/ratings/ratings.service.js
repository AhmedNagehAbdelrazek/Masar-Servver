var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
function serializeRating(r) {
    return {
        id: r.id,
        booking_id: r.bookingId,
        stars: r.stars,
        was_late: r.wasLate,
        late_minutes: r.lateMinutes,
        review: r.review,
        tags: r.tags,
        created_at: r.createdAt,
    };
}
function serializeReceived(r) {
    return {
        id: r.id,
        stars: r.stars,
        was_late: r.wasLate,
        late_minutes: r.lateMinutes,
        review: r.review,
        tags: r.tags,
        rater_name: r.rater ? r.rater.fullName : null,
        booking_id: r.bookingId,
        created_at: r.createdAt,
    };
}
let RatingsService = class RatingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateDriverAvg(rateeId, tx) {
        const ratings = await tx.rating.findMany({
            where: { rateeId, isVisible: true },
            select: { stars: true },
        });
        const avg = ratings.length === 0
            ? 0
            : Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10;
        await tx.user.update({ where: { id: rateeId }, data: { avgRating: avg } });
        return avg;
    }
    async create(raterId, data) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: data.booking_id },
            include: { trip: { select: { id: true, driverId: true } } },
        });
        if (!booking) {
            throw new NotFoundException({ message: 'BOOKING_NOT_FOUND', code: 'BOOKING_NOT_FOUND' });
        }
        const isPassenger = booking.passengerId === raterId;
        const isDriver = booking.trip.driverId === raterId;
        if (!isPassenger && !isDriver) {
            throw new ForbiddenException({
                message: 'Only the passenger or the driver of a booking may rate it',
                code: 'FORBIDDEN',
            });
        }
        const rateeId = isPassenger ? booking.trip.driverId : booking.passengerId;
        const existing = await this.prisma.rating.findFirst({
            where: { bookingId: booking.id, raterId },
        });
        if (existing) {
            return {
                rating: serializeRating(existing),
                already_rated: true,
            };
        }
        const rating = await this.prisma.$transaction(async (t) => {
            const created = await t.rating.create({
                data: {
                    bookingId: booking.id,
                    raterId,
                    rateeId,
                    stars: data.stars,
                    wasLate: data.was_late ?? false,
                    lateMinutes: data.was_late ? (data.late_minutes ?? 0) : 0,
                    review: data.review ?? null,
                    tags: data.tags ?? [],
                },
            });
            await this.updateDriverAvg(rateeId, t);
            return created;
        });
        return {
            rating: serializeRating(rating),
            already_rated: false,
        };
    }
    async listReceived(rateeId, filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const [rows, count] = await Promise.all([
            this.prisma.rating.findMany({
                where: { rateeId },
                include: { rater: { select: { fullName: true } } },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.rating.count({ where: { rateeId } }),
        ]);
        return {
            data: rows.map((r) => serializeReceived(r)),
            pagination: buildPagination(count, page, limit),
        };
    }
    async listWithDistribution(rateeId, filters = {}) {
        const page = Math.max(1, Math.floor(Number(filters.page) || 1));
        const limit = Math.min(50, Math.max(1, Math.floor(Number(filters.limit) || 10)));
        const offset = (page - 1) * limit;
        const sort = filters.sort === 'highest' || filters.sort === 'lowest' ? filters.sort : 'recent';
        const orderBy = sort === 'highest'
            ? [{ stars: 'desc' }, { createdAt: 'desc' }]
            : sort === 'lowest'
                ? [{ stars: 'asc' }, { createdAt: 'desc' }]
                : [{ createdAt: 'desc' }];
        const visibleWhere = { rateeId, isVisible: { not: false } };
        const [rows, total, distributionRows, onTimeCount, user] = await Promise.all([
            this.prisma.rating.findMany({
                where: visibleWhere,
                include: { rater: { select: { fullName: true } } },
                orderBy,
                skip: offset,
                take: limit,
            }),
            this.prisma.rating.count({ where: visibleWhere }),
            this.prisma.rating.groupBy({
                by: ['stars'],
                where: visibleWhere,
                _count: { stars: true },
            }),
            this.prisma.rating.count({ where: { ...visibleWhere, NOT: { wasLate: true } } }),
            this.prisma.user.findUnique({ where: { id: rateeId }, select: { avgRating: true } }),
        ]);
        const distMap = {};
        for (const row of distributionRows)
            distMap[row.stars] = row._count.stars;
        const distribution = [5, 4, 3, 2, 1].map((stars) => ({
            stars,
            count: distMap[stars] ?? 0,
            percentage: total ? Math.round(((distMap[stars] ?? 0) / total) * 100) : 0,
        }));
        return {
            summary: {
                average_rating: Number(user?.avgRating ?? 0),
                total_ratings: total,
                punctuality_rate: total ? Math.round((onTimeCount / total) * 100) : 0,
                distribution,
            },
            data: rows.map((r) => serializeReceived(r)),
            pagination: buildPagination(total, page, limit),
        };
    }
};
RatingsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], RatingsService);
export { RatingsService };
//# sourceMappingURL=ratings.service.js.map