import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsFreeOffer } from './free-offer.validator.js';

// Port of updatePlanValidation: every field optional.
export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  period_days?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentage_cut?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost?: number;

  @IsOptional()
  @IsIn(['most_requested', 'frequent', 'popular', null] as unknown as string[])
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  status?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value.map((f) => (typeof f === 'string' ? f.trim() : f)) : value,
  )
  features?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return value;
  })
  is_free?: boolean;

  @IsOptional()
  @IsFreeOffer()
  free_offer?: { type: string; value: number } | null;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return value;
  })
  is_active?: boolean;
}
