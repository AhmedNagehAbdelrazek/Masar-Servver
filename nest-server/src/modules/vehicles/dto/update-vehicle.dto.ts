import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsModelYear } from '../../../common/validators/model-year.validator.js';

// Port of vehicleUpdateValidation.
export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  model?: string;

  @IsOptional()
  @IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback'])
  vehicle_type?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @IsModelYear()
  model_year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  plate_number?: string;

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

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  seats?: number;
}
