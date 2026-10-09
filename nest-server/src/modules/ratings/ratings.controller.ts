import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CreateRatingDto } from './dto/create-rating.dto.js';
import { RatingsService } from './ratings.service.js';

// Express parity: Routes/ratingRoutes.ts POST /api/ratings (any authenticated user).
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  @HttpCode(200)
  createRating(
    @Body() dto: CreateRatingDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ rating: Record<string, unknown>; already_rated: boolean }> {
    return this.ratings.create(user?.id ?? '', dto);
  }
}
