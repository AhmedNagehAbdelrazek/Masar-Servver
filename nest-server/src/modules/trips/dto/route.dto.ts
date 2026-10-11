import { IsArray, IsDefined, IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
  @IsIn(['arrived', 'picked_up', 'missed'])
  pickup_status!: string;
}
