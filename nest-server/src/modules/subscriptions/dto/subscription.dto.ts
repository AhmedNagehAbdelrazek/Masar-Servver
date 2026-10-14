import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

// Port of createSubscriptionValidation.
export class CreateSubscriptionDto {
  @IsDefined()
  @IsUUID()
  plan_id!: string;

  @IsDefined()
  @IsUUID()
  payment_method_id!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  screenshot_id!: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return value;
  })
  resubmit?: boolean;
}

// Port of rejectSubscriptionValidation (admin).
export class RejectSubscriptionDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  reason!: string;
}

export class SubscriptionIdParam {
  @IsUUID()
  subscription_id!: string;
}

// Admin payment-review queue filters (Figma 10840:37484): search by driver
// name/phone (subscription ids are UUIDs — equals only), plan, submission
// date range. PAY- order numbers have no backing column (raw ids, same as
// the bookings/ride-requests patches).
export class AdminSubscriptionListQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['pending_approval', 'active', 'rejected', 'cancelled', 'expired', 'all'])
  status?: string;

  @IsOptional()
  @IsUUID()
  plan_id?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort?: string;

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
