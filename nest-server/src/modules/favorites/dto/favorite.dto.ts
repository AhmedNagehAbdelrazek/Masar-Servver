import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Ports of favoriteValidator.ts chains. @IsDefined() pins required fields to
// 422 even when the key is absent from the JSON body.
export class AddFavoriteDriverDto {
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  driver_id!: string;
}

export class FavoriteDriversListQuery {
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

export class AddFavoriteRouteDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  origin_city!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  destination_city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  label?: string;
}
