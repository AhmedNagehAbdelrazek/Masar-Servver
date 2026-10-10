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
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

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

@ValidatorConstraint({ name: 'modelYearRange', async: false })
class ModelYearRangeRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    const currentYear = new Date().getFullYear();
    const num = Number(value);
    return Number.isInteger(num) && num >= currentYear - 10 && num <= currentYear;
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    return `Model year must be between ${currentYear - 10} and ${currentYear} (within the last 10 years)`;
  }
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
  @Validate(ModelYearRangeRule)
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

