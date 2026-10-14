import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Figma: 10062:4551 (الركاب list + stat cards). Header/sidebar ignored.
// accountStatus buckets mirror the cards: نشط / موقوف مؤقتاً / موقوف (نهائي) / لديهم مخالفات.
export class PassengerListQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['active', 'suspended_temporary', 'suspended_permanent', 'with_violations'])
  accountStatus?: string;

  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year', 'any'])
  registeredAt?: string;

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

export class PassengerIdParam {
  @IsUUID()
  passenger_id!: string;
}

class DateRangeQuery {
  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year', 'any'])
  date?: string;

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

// Figma 10064:22193 filter row: الكل / قيد التنفيذ / قادمة / المكتملة / الملغاة.
// in_progress -> confirmed (en route now), upcoming -> pending (booked, not started).
export class PassengerBookingsQuery extends DateRangeQuery {
  @IsOptional()
  @IsIn(['all', 'pending', 'confirmed', 'in_progress', 'upcoming', 'completed', 'cancelled', 'canceled', 'no_show'])
  status?: string;
}

// Figma 10064:23604 filter row. upcoming -> open (no offer yet).
export class PassengerRideRequestsQuery extends DateRangeQuery {
  @IsOptional()
  @IsIn(['all', 'open', 'offered', 'accepted', 'expired', 'cancelled', 'canceled', 'upcoming'])
  status?: string;
}

// Figma 10069:27574 (filed, ضد) / 10069:28429 (against, مقدم الشكوى).
export class PassengerComplaintsQuery {
  @IsOptional()
  @IsIn(['filed', 'against'])
  direction?: string;

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

// Figma 10069:30620 shows التي قدمها; received supported for parity.
export class PassengerRatingsQuery {
  @IsOptional()
  @IsIn(['given', 'received'])
  direction?: string;

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

// Figma 10063:18885 إرسال إشعار: title + body + type chips
// (متعلق بالرحلة / عام / متعلق بالحساب / متعلق بالتوثيق / متعلق بالباقة).
export class SendPassengerNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['trip', 'general', 'account', 'verification', 'package'])
  type!: string;
}

const WARNING_REASONS = [
  'misbehavior',
  'late',
  'repeat_cancel',
  'driver_complaint',
  'rules_violation',
  'other',
] as const;

// Figma 10063:19165 إرسال إنذار: reason chips + ملاحظات إضافية.
export class SendPassengerWarningDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([...WARNING_REASONS])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// Figma 10063:18592 إيقاف مؤقت: reason + مدة (يوم / 3 / 7 / مخصصة).
export class TemporarySuspensionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([...WARNING_REASONS])
  reason!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['1d', '3d', '7d', 'custom'])
  duration!: string;

  @ValidateIf((o: TemporarySuspensionDto) => o.duration === 'custom')
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

const BAN_REASONS = [
  'dangerous_behavior',
  'severe_repeat',
  'repeat_cancel',
  'tos_violation',
  'rules_violation',
  'other',
] as const;

// Figma 10063:19348 إيقاف نهائي: reason + notes + أؤكد مراجعة سجل الحساب checkbox.
export class PermanentSuspensionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([...BAN_REASONS])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @Equals(true)
  confirmReviewedLog!: boolean;
}
