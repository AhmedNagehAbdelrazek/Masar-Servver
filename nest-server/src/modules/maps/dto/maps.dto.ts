import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { IsLat, IsLng } from '../../../common/validators/geo.validators.js';

// Port of routePreviewValidation: flat lat/lng pairs or nested origin/
// destination (or a mix); stops must be an array when present.
export class RoutePreviewDto {
  @IsOptional()
  @IsLat()
  origin_lat?: string | number;

  @IsOptional()
  @IsLng()
  origin_lng?: string | number;

  @IsOptional()
  @IsLat()
  destination_lat?: string | number;

  @IsOptional()
  @IsLng()
  destination_lng?: string | number;

  @IsOptional()
  @IsObject()
  origin?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  destination?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  stops?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  departure_time?: string;
}

// Port of reverseGeocodeBodyValidation.
export class ReverseGeocodeDto {
  @IsDefined()
  @IsNumber()
  @IsLat()
  @Type(() => Number)
  lat!: number;

  @IsDefined()
  @IsNumber()
  @IsLng()
  @Type(() => Number)
  lng!: number;
}

// Port of pickupPreviewValidation (all optional; service defaults apply).
export class PickupPreviewDto {
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
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  pickup_label?: string;
}

export class TripIdParam {
  @IsUUID()
  trip_id!: string;
}
