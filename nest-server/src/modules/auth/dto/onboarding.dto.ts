import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsModelYear } from '../../../common/validators/model-year.validator.js';

// Port of onboardingProfileValidation (driver).
export class OnboardingProfileDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  fullName!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  age!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsIn(['male', 'female'])
  gender!: 'male' | 'female';

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  userIdentificationFront!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  userIdentificationBack!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  linceseFront!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  linceseBack!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  personalImageWithId!: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  nationalID!: string;
}

// Port of onboardingPassengerProfileValidation.
export class OnboardingPassengerProfileDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  fullname!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  national_id!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Min(18)
  @Max(100)
  @Type(() => Number)
  age!: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  home_address!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsIn(['male', 'female'])
  gender!: 'male' | 'female';
}

// Port of onboardingVehicleValidation.
export class OnboardingVehicleDto {
  @IsDefined()
  @IsNotEmpty()
  @IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback'])
  vehicleType!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  manufacturer!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  model!: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsModelYear()
  modelYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  color?: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  plateNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  codeNumber?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  seats!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  registrationDocFront!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  registrationDocBack!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  vehiclePhotoFront!: number;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  vehiclePhotoBack!: number;
}

