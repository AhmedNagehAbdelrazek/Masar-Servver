import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Port of replaceStopsValidation (count cap enforced in service).
export class ReplaceStopsDto {
  @IsDefined()
  @IsArray()
  stops!: Record<string, unknown>[];
}

// Port of pickupStatusValidation (pending is NOT settable via API).
export class TripPickupParams {
  @IsUUID()
  trip_id!: string;

  @IsUUID()
  booking_id!: string;
}

export class SetPickupStatusDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsIn(['arrived', 'picked_up', 'dropped_off', 'missed'])
  pickup_status!: string;
}

export class ConfirmPassengerDto {
  @IsUUID()
  booking_id!: string;

  @IsBoolean()
  was_on_trip!: boolean;
}

export class ConfirmPassengersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfirmPassengerDto)
  passengers!: ConfirmPassengerDto[];
}
