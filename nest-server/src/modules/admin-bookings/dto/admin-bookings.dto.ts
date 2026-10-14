import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Figma 10558:38631 (الحجوزات list). Status chips: الكل / قادمة / قيد التنفيذ /
// المكتملة / الملغاة. upcoming = booked but trip not started, in_progress =
// trip currently running (derived from the linked trip status).
export class AdminBookingListQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'upcoming', 'in_progress', 'completed', 'cancelled'])
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

export class BookingIdParam {
  @IsUUID()
  booking_id!: string;
}

// Figma 10571:41682 (إلغاء الحجز modal): reason chips + ملاحظات إضافية.
// طلب الراكب / مشكلة في بيانات الحجز / مخالفة لسياسات مسار / تعذر التنفيذ / أخرى.
export class AdminCancelBookingDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['passenger_request', 'booking_data_issue', 'policy_violation', 'unfulfillable', 'other'])
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
