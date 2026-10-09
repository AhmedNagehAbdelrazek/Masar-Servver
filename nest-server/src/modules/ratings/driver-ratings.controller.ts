import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RatingListQuery } from './dto/rating-list.query.js';
import { RatingsService } from './ratings.service.js';

// Express parity: Routes/driverRoutes.ts GET /api/driver/ratings
// (protect + driver + ratingListValidation). Pulled into the ratings module
// now; Wave 3 driver module must NOT re-register this path.
@Controller('driver/ratings')
@Roles('driver')
export class DriverRatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Get()
  getRatings(@Query() query: RatingListQuery, @CurrentUser() user?: AuthUser): Promise<{
    summary: Record<string, unknown>;
    data: Record<string, unknown>[];
    pagination: Record<string, unknown>;
  }> {
    return this.ratings.listWithDistribution(user?.id ?? '', query);
  }
}
