import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Ports of adminUserListValidation + updateUserStatusValidation
// (adminModerationValidator.ts), moderateTripValidation, and
// penaltyValidation (penaltyValidator.ts). Cross-field ends_at rules
// (suspension requires / ban forbids / must be future) are enforced in
// PenaltyService.issue as 422 VALIDATION_ERROR — same envelope as Express.
export class AdminUserListQuery {
  @IsOptional()
  @IsIn(['passenger', 'driver', 'admin', 'support', 'moderator'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'warned', 'suspended', 'banned'])
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

export class UserIdParam {
  @IsUUID()
  user_id!: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['active', 'warned', 'suspended', 'banned'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ModerateTripDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['unpublish', 'block', 'restore'])
  action!: 'unpublish' | 'block' | 'restore';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class IssuePenaltyDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['warning', 'suspension', 'ban'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsUUID()
  complaint_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  details?: string;

  @IsOptional()
  @IsDateString()
  ends_at?: string;

  @IsOptional()
  @IsBoolean()
  confirm_reviewed_log?: boolean;
}
