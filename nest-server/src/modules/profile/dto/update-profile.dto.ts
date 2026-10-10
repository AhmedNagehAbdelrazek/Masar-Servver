import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Port of updatePassengerProfileValidation. NOTE: "at least one field"
// is enforced in ProfileService (422), mirroring the Express service error.
export class UpdatePassengerProfileDto {
  @IsOptional()
  @IsIn(['male', 'female', 'any'])
  preferred_gender?: string;

  @IsOptional()
  @IsIn(['no_preference', 'non_smoking', 'smoking_allowed'])
  smoking_preference?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  national_id?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  home_address?: string;

  @IsOptional()
  @IsArray()
  saved_routes?: unknown[];

  @IsOptional()
  @IsArray()
  emergency_contacts?: unknown[];
}
