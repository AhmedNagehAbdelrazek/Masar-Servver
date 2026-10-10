import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// Port of updateDriverPersonalDataValidation.
class PersonalDataVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2100)
  @Type(() => Number)
  model_year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  color?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  plate_number?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(15)
  @Type(() => Number)
  total_seats?: number;
}

export class UpdatePersonalDataDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  display_name?: string | null;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  email?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  age?: number | null;

  @IsOptional()
  @IsString()
  avatar_url?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  national_id?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonalDataVehicleDto)
  vehicle?: PersonalDataVehicleDto;
}
