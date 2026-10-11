import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsLat, IsLng, TrimString } from '../../../common/validators/geo.validators.js';

// Port of createBookingValidation. Seat-content rules (integers, dedupe,
// count match) plus seat_number deprecation live in BookingsService, mirroring
// the validator/service split in Express.
export class CreateBookingDto {
  @IsDefined()
  @IsUUID()
  trip_id!: string;

  @IsOptional()
  seat_number?: number | string;

  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  seat_numbers!: (number | string)[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  seats?: number;

  @IsDefined()
  @IsNotEmpty()
  agreed_fare!: string | number;

  @IsOptional()
  pickup_point?: unknown;

  @IsOptional()
  pick_up_point?: unknown;

  @IsOptional()
  pickup?: unknown;

  @IsOptional()
  drop_off_point?: unknown;

  @IsOptional()
  dropoff_point?: unknown;

  @IsOptional()
  dropoff?: unknown;

  @IsOptional()
  dropOffPoint?: unknown;

  @IsOptional()
  @IsIn(['stop', 'custom'])
  pickup_type?: string;

  @IsOptional()
  @IsUUID()
  pickup_stop_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  dropoff_place?: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  dropoff_deadline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  pickup_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  label?: string;
}

// Port of passengerBookingListValidation.
export class PassengerBookingListQuery {
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
  status?: string;

  @IsOptional()
  @IsUUID()
  trip_id?: string;

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

// Port of bookingListValidation (driver list: status/date/page/limit).
export class DriverBookingListQuery {
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
  status?: string;

  @IsOptional()
  @IsISO8601()
  date_from?: string;

  @IsOptional()
  @IsISO8601()
  date_to?: string;

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

// Port of pickupPreviewValidation for PATCH pickup.
export class EditPickupDto {
  @IsOptional()
  @IsIn(['stop', 'custom'])
  pickup_type?: string;

  @IsOptional()
  @IsUUID()
  pickup_stop_id?: string;

  @IsOptional()
  @IsLat()
  lat?: string | number;

  @IsOptional()
  @IsLng()
  lng?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  pickup_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  label?: string;
}

// Port of reportDelayValidation / delayListValidation.
export class ReportDelayDto {
  @IsDefined()
  @IsNotEmpty()
  @IsIn(['driver', 'passenger'])
  party!: string;

  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(720)
  @Type(() => Number)
  delay_minutes!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @TrimString()
  reason?: string;
}

export class DelayListQuery {
  @IsOptional()
  @IsIn(['driver', 'passenger'])
  party?: string;

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


