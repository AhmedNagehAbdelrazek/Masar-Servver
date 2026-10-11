import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsLat, IsLng, IsMoney, TrimString } from '../../../common/validators/geo.validators.js';

// Port of createTripValidation. Nested waypoint/stop/point fields are all
// optional (the service skips coordinates-less waypoints); lat/lng accept
// strings or numbers.
class WaypointDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  stop_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  name?: string;

  @IsOptional()
  @IsLat()
  stop_lat?: string | number;

  @IsOptional()
  @IsLat()
  lat?: string | number;

  @IsOptional()
  @IsLng()
  stop_lng?: string | number;

  @IsOptional()
  @IsLng()
  lng?: string | number;
}

class TripPointDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  stop_name?: string;

  @IsOptional()
  @IsLat()
  lat?: string | number;

  @IsOptional()
  @IsLat()
  stop_lat?: string | number;

  @IsOptional()
  @IsLng()
  lng?: string | number;

  @IsOptional()
  @IsLng()
  stop_lng?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @TrimString()
  city?: string;
}

class StopInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  stop_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @TrimString()
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  address?: string;

  @IsOptional()
  @IsLat()
  lat?: string | number;

  @IsOptional()
  @IsLng()
  lng?: string | number;

  @IsOptional()
  @IsLat()
  stop_lat?: string | number;

  @IsOptional()
  @IsLng()
  stop_lng?: string | number;

  @IsOptional()
  @IsIn(['pickup', 'dropoff', 'both'])
  stop_type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  stop_order?: number;
}

class SeatInputDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  seat_number!: number;

  @IsDefined()
  @IsIn(['driver', 'available', 'unavailable'])
  type!: string;
}

export class CreateTripDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @TrimString()
  origin_city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  origin_area?: string;

  @IsOptional()
  @IsLat()
  origin_lat?: string | number;

  @IsOptional()
  @IsLng()
  origin_lng?: string | number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @TrimString()
  destination_city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @TrimString()
  destination_area?: string;

  @IsOptional()
  @IsLat()
  destination_lat?: string | number;

  @IsOptional()
  @IsLng()
  destination_lng?: string | number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints?: WaypointDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TripPointDto)
  pickup_point?: TripPointDto;

  @IsOptional()
  @IsObject()
  pickup?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  pickup_location?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TripPointDto)
  dropoff_point?: TripPointDto;

  @IsOptional()
  @IsObject()
  dropoff?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  dropoff_location?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  drop_off_point?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopInputDto)
  stops?: StopInputDto[];

  @IsDefined()
  @IsNotEmpty()
  @IsISO8601()
  departure_time!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsIn(['once', 'repeated'])
  type_of_trip!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  repeated_days?: number[];

  @IsOptional()
  @IsString()
  repeated_end_date?: string;

  @IsOptional()
  @IsIn(['all', 'women_only', 'men_only'])
  allowed_type?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsMoney()
  fare_per_seat!: string | number;

  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SeatInputDto)
  seats!: SeatInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  instructions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @TrimString()
  additional_instructions?: string;
}

class TripAttributeDto {
  @IsOptional()
  @IsIn(['smoking_allowed', 'women_only', 'ac', 'pets', 'luggage', 'music'])
  attr_key?: string;

  @IsOptional()
  @IsIn(['true', 'false', 'yes', 'no'])
  attr_value?: string;
}

class TripStopUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @TrimString()
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @TrimString()
  address?: string;

  @IsOptional()
  @IsLat()
  lat?: string | number;

  @IsOptional()
  @IsLng()
  lng?: string | number;

  @IsOptional()
  @IsIn(['pickup', 'dropoff', 'both'])
  stop_type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  stop_order?: number;

  @IsOptional()
  @IsISO8601()
  estimated_arrival?: string;
}

export class UpdateTripDto {
  @IsOptional()
  @IsMoney()
  fare_per_seat?: string | number;

  @IsOptional()
  @IsString()
  @IsISO8601()
  departure_time?: string;

  @IsOptional()
  @IsString()
  @IsISO8601()
  arrival_time?: string;

  @IsOptional()
  @IsIn(['all', 'women_only', 'men_only'])
  gender_preference?: string;

  @IsOptional()
  @IsArray()
  driver_instructions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @TrimString()
  additional_instructions?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripAttributeDto)
  attributes?: TripAttributeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripStopUpdateDto)
  stops?: TripStopUpdateDto[];
}


export class TripIdParam {
  @IsUUID()
  trip_id!: string;
}

export class TripPassengersQuery {
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
  status?: string;
}

export class TripSearchQuery {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @TrimString()
  origin_city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @TrimString()
  destination_city?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  return_date?: string;

  @IsOptional()
  @IsIn(['all', 'women_only', 'men_only'])
  gender_preference?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time_from?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  time_to?: string;

  @IsOptional()
  @IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback'])
  vehicle_type?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  seats?: number;
}

export class CancelTripDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @TrimString()
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @TrimString()
  note?: string;
}

export class LockSeatDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  seat_number?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  seat_numbers?: (number | string)[];
}
