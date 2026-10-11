import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsLat, IsLng, TrimString } from '../../../common/validators/geo.validators.js';

// Port of rideRequestValidator.ts.
export class CreateRideRequestDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @TrimString()
  origin_city!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @TrimString()
  destination_city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  origin_place?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  destination_place?: string;

  @IsOptional()
  @IsLat()
  origin_lat?: string | number;

  @IsOptional()
  @IsLng()
  origin_lng?: string | number;

  @IsOptional()
  @IsString()
  @IsISO8601()
  origin_time?: string;

  @IsOptional()
  @IsLat()
  destination_lat?: string | number;

  @IsOptional()
  @IsLng()
  destination_lng?: string | number;

  @IsOptional()
  @IsString()
  @IsISO8601()
  arrival_deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  @Type(() => Number)
  seats_needed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_budget?: number;

  @IsOptional()
  @IsObject()
  attributes_preferred?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @TrimString()
  note?: string;
}

export class ListRideRequestsQuery {
  @IsOptional()
  @IsIn(['open', 'offered', 'accepted', 'expired', 'cancelled'])
  status?: string;

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

export class RequestIdParam {
  @IsUUID()
  request_id!: string;
}

export class UpdateRideRequestDto {
  @IsOptional()
  @IsIn(['cancel'])
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  origin_city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  destination_city?: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  origin_time?: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  arrival_deadline?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  @Type(() => Number)
  seats_needed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_budget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @TrimString()
  note?: string;
}

export class CreateOfferDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offered_fare?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @TrimString()
  message?: string;

  @IsOptional()
  @IsUUID()
  trip_id?: string;
}

export class DecideOfferDto {
  @IsDefined()
  @IsNotEmpty()
  @IsIn(['accept', 'decline'])
  action!: string;
}

export class AgreePriceDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  agreed_fare!: number;
}

export class OfferIdParam {
  @IsUUID()
  offer_id!: string;
}

export class DriverOffersQuery {
  @IsOptional()
  @IsIn(['sent', 'accepted', 'declined', 'expired'])
  status?: string;

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

export class AttachOfferBody {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dropoff_place?: string;

  @IsOptional()
  @IsString()
  dropoff_deadline?: string;
}
