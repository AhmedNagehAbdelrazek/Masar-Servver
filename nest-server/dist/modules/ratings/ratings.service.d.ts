import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateRatingDto } from './dto/create-rating.dto.js';
import type { RatingListQuery } from './dto/rating-list.query.js';
export declare class RatingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private updateDriverAvg;
    create(raterId: string, data: CreateRatingDto): Promise<{
        rating: Record<string, unknown>;
        already_rated: boolean;
    }>;
    listReceived(rateeId: string, filters?: RatingListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    listWithDistribution(rateeId: string, filters?: RatingListQuery & {
        sort?: string;
    }): Promise<{
        summary: Record<string, unknown>;
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
