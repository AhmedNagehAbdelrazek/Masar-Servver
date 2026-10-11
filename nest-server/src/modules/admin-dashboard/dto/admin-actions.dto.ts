import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// Port of statusBodyValidation: must be one of the four derived statuses.
export class SetDriverStatusDto {
  @IsString()
  @IsIn(['active', 'suspended', 'pending', 'blocked'])
  status!: 'active' | 'suspended' | 'pending' | 'blocked';
}

// Port of accountActionBodyValidation: reason optional (nullable), max 500.
export class AccountActionDto {
  @IsString()
  @IsIn(['suspend', 'reactivate', 'unblock'])
  action!: 'suspend' | 'reactivate' | 'unblock';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(500)
  reason?: string | null;
}

// Port of rejectReasonBodyValidation: reason optional (nullable), max 2000.
export class RejectDocumentDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(2000)
  reason?: string | null;
}
