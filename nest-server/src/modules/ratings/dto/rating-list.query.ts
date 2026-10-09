import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

// Port of ratingListValidation. Query strings are coerced via @Type.
export class RatingListQuery {
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

  @IsOptional()
  @IsIn(['recent', 'highest', 'lowest'])
  sort?: 'recent' | 'highest' | 'lowest';
}
