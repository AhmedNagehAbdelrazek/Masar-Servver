import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { RatingsService } from './ratings.service.js';
export declare class RatingsController {
    private readonly ratings;
    constructor(ratings: RatingsService);
    createRating(dto: CreateRatingDto, user?: AuthUser): Promise<{
        rating: Record<string, unknown>;
        already_rated: boolean;
    }>;
}
