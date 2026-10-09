import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateRatingDto } from './dto/create-rating.dto.js';
import type { RatingListQuery } from './dto/rating-list.query.js';

type TxClient = Pick<PrismaClient, 'rating' | 'user'>;

interface RatingWithRater {
  id: string;
  bookingId: string;
  stars: number;
  wasLate: boolean | null;
  lateMinutes: number | null;
  review: string | null;
  tags: string[];
  createdAt: Date;
  rater?: { fullName: string | null } | null;
}

function serializeRating(r: {
  id: string;
  bookingId: string;
  stars: number;
  wasLate: boolean | null;
  lateMinutes: number | null;
  review: string | null;
  tags: string[];
  createdAt: Date;
}): Record<string, unknown> {
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

function serializeReceived(r: RatingWithRater): Record<string, unknown> {
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

// Port of Main Server/Services/ratingService.ts
@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async updateDriverAvg(rateeId: string, tx: TxClient): Promise<number> {
    const ratings = await tx.rating.findMany({
      where: { rateeId, isVisible: true },
      select: { stars: true },
    });
    const avg =
      ratings.length === 0
        ? 0
        : Math.round((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10) / 10;
    await tx.user.update({ where: { id: rateeId }, data: { avgRating: avg } });
    return avg;
  }

  async create(
    raterId: string,
    data: CreateRatingDto,
  ): Promise<{ rating: Record<string, unknown>; already_rated: boolean }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.booking_id },
      include: { trip: { select: { id: true, driverId: true } } },
    });
    if (!booking) {
      throw new NotFoundException({ message: 'Booking not found', code: 'BOOKING_NOT_FOUND' });
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
        rating: serializeRating(existing as unknown as Parameters<typeof serializeRating>[0]),
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
      await this.updateDriverAvg(rateeId, t as unknown as TxClient);
      return created;
    });

    return {
      rating: serializeRating(rating as unknown as Parameters<typeof serializeRating>[0]),
      already_rated: false,
    };
  }

  async listReceived(
    rateeId: string,
    filters: RatingListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
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
      data: rows.map((r) => serializeReceived(r as unknown as RatingWithRater)),
      pagination: buildPagination(count, page, limit),
    };
  }

  async listWithDistribution(
    rateeId: string,
    filters: RatingListQuery & { sort?: string } = {},
  ): Promise<{
    summary: Record<string, unknown>;
    data: Record<string, unknown>[];
    pagination: Record<string, unknown>;
  }> {
    const page = Math.max(1, Math.floor(Number(filters.page) || 1));
    const limit = Math.min(50, Math.max(1, Math.floor(Number(filters.limit) || 10)));
    const offset = (page - 1) * limit;
    const sort = filters.sort === 'highest' || filters.sort === 'lowest' ? filters.sort : 'recent';
    const orderBy: Prisma.RatingOrderByWithRelationInput[] =
      sort === 'highest'
        ? [{ stars: 'desc' }, { createdAt: 'desc' }]
        : sort === 'lowest'
          ? [{ stars: 'asc' }, { createdAt: 'desc' }]
          : [{ createdAt: 'desc' }];

    const visibleWhere: Prisma.RatingWhereInput = { rateeId, isVisible: { not: false } };
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
      this.prisma.rating.count({ where: { ...visibleWhere, wasLate: false } }),
      this.prisma.user.findUnique({ where: { id: rateeId }, select: { avgRating: true } }),
    ]);

    const distMap: Record<number, number> = {};
    for (const row of distributionRows) distMap[row.stars] = row._count.stars;
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
      data: rows.map((r) => serializeReceived(r as unknown as RatingWithRater)),
      pagination: buildPagination(total, page, limit),
    };
  }
}
