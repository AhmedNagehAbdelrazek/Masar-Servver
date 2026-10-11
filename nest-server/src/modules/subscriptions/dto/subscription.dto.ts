import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

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
