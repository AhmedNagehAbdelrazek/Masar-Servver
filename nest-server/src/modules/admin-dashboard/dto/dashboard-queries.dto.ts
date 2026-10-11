import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

// Shared page/limit pair (paginationQueryValidation: page >= 1, limit 1-100).
class PaginationQuery {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// Port of recentTripsQueryValidation. Reused by recent-trips,
// pending-requests, latest-complaints AND driver evaluations (Express reuses
// the same chain there; the service ignores status for those endpoints).
export class RecentTripsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn(['published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled', 'canceled'])
  status?: string;
}

// Port of driversListValidation.
export class DriversListQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['active', 'suspended', 'pending', 'blocked'])
  status?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  registration_from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  registration_to?: string;

  @IsOptional()
  @IsIn(['created_at', 'full_name', 'avg_rating'])
  sort_by?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: string;
}

// Port of driverTripsQueryValidation.
export class DriverTripsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn(['all', 'pending', 'completed', 'canceled', 'cancelled', 'active'])
  status?: string;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;
}

// Port of reservationsQueryValidation.
export class ReservationsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled', 'canceled', 'completed', 'no_show'])
  status?: string;
}
