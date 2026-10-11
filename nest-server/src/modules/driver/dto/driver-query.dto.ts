import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

// Port of penaltyListValidation (driver list only).
export class PenaltyListQuery {
  @IsOptional()
  @IsIn(['true', 'false', true, false])
  active?: string | boolean;

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

// Port of earningsQueryValidation.
export class EarningsQuery {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  period?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
