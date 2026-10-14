import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { COMPLAINT_CATEGORIES } from './create-complaint.dto.js';

// Ports of driverComplaintListValidation + adminComplaintListValidation.
export const COMPLAINT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const;

export class DriverComplaintListQuery {
  @IsOptional()
  @IsIn(['filed', 'against'])
  direction?: 'filed' | 'against';

  @IsOptional()
  @IsIn([...COMPLAINT_STATUSES])
  status?: (typeof COMPLAINT_STATUSES)[number];

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

export class AdminComplaintListQuery {
  @IsOptional()
  @IsIn([...COMPLAINT_STATUSES])
  status?: (typeof COMPLAINT_STATUSES)[number];

  @IsOptional()
  @IsIn([...COMPLAINT_CATEGORIES])
  category?: (typeof COMPLAINT_CATEGORIES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

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
