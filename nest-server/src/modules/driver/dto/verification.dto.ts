import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidatorConstraint,
  ValidateNested,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

// Port of driverVerificationValidator.ts. `phone` must be ABSENT (Express
// `.not().exists()`); nested `vehicle.*` paths surface as `vehicle.<field>`
// via the pipe's nested-error flattening.
@ValidatorConstraint({ name: 'absentField', async: false })
class AbsentFieldRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return value === undefined;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${String(args.property)} cannot be changed during verification`;
  }
}

function DocumentId(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    IsOptional()(target, propertyKey);
    IsInt()(target, propertyKey);
    Min(1)(target, propertyKey);
    Type(() => Number)(target, propertyKey);
  };
}

class VerificationVehicleDto {
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

  @IsDefined()
  @IsNotEmpty()
  @IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback'])
  vehicle_type!: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  model_year?: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  plate_number!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  code_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  color?: string;

  @IsDefined()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  seats!: number;

  @DocumentId()
  registration_doc_front?: number;

  @DocumentId()
  registration_doc_back?: number;

  @DocumentId()
  vehicle_photo_front?: number;

  @DocumentId()
  vehicle_photo_back?: number;
}

export class SubmitVerificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  national_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  license_number?: string;

  @IsOptional()
  @IsDateString()
  license_expiry?: string;

  @Validate(AbsentFieldRule)
  phone?: unknown;

  @DocumentId()
  user_identification_front?: number;

  @DocumentId()
  user_identification_back?: number;

  @DocumentId()
  lincese_front?: number;

  @DocumentId()
  lincese_back?: number;

  @DocumentId()
  personal_image_with_id?: number;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => VerificationVehicleDto)
  vehicle!: VerificationVehicleDto;
}

// Port of verificationQueueValidation.
export class VerificationQueueQuery {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'unverified'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

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

export const VERIFICATION_FIELD_KEYS = [
  'national_id',
  'license',
  'personal_photo',
  'vehicle_registration',
  'vehicle_photo',
  'vehicle_details',
  'personal_details',
] as const;

// Port of rejectValidation.
export class RejectVerificationDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  reason!: string;

  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn([...VERIFICATION_FIELD_KEYS], { each: true })
  fields_to_fix!: string[];
}

export class DriverIdParam {
  @IsUUID()
  driver_id!: string;
}

export class VehicleIdParam {
  @IsUUID()
  vehicle_id!: string;
}
