import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

// Ports of sosListValidation / sosIdParamValidation / resolveSosValidation.
export class SosListQuery {
  @IsOptional()
  @IsString()
  status?: string;

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

export class SosIdParam {
  @IsUUID()
  id!: string;
}

export class ResolveSosDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolution_note?: string;
}
