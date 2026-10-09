import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RatingListQuery } from './dto/rating-list.query.js';
import { RatingsService } from './ratings.service.js';
export declare class DriverRatingsController {
    private readonly ratings;
    constructor(ratings: RatingsService);
    getRatings(query: RatingListQuery, user?: AuthUser): Promise<{
        summary: Record<string, unknown>;
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
}
