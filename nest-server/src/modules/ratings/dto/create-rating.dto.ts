import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

// Port of ratingValidation (utils/validators/ratingValidator.ts).
@ValidatorConstraint({ name: 'nonEmptyTags', async: false })
class NonEmptyTagsRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string' && item.trim().length > 0)
    );
  }

  defaultMessage(): string {
    return 'each tag must be a non-empty string';
  }
}

export class CreateRatingDto {
  @IsUUID()
  booking_id!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  stars!: number;

  @IsOptional()
  @IsBoolean()
  was_late?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  late_minutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  review?: string;

  @IsOptional()
  @IsArray()
  @Validate(NonEmptyTagsRule)
  tags?: string[];
}
