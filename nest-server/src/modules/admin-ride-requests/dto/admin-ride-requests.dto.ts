import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Figma 10631:10466 (طلبات الرحلات list). Status mapping to the
// RideRequestStatus enum: قيد البحث=open, توجد مطابقة=offered,
// مكتملة=accepted, ملغي=cancelled, منتهي=expired.
export class AdminRideRequestListQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'open', 'offered', 'accepted', 'expired', 'cancelled'])
  status?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

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

export class RideRequestIdParam {
  @IsUUID()
  request_id!: string;
}
