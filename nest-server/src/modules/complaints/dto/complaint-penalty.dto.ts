import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

// Figma 10681:19490 (إجراءات العقوبة): optional admin action against the
// accused after reviewing the complaint. Kind selects which modal shape
// applies — the reason/duration/notes enums mirror the passenger-patch
// modals (10683:11753/11689/11615).
export const COMPLAINT_WARNING_REASONS = [
  'misbehavior',
  'late',
  'repeat_cancel',
  'driver_complaint',
  'rules_violation',
  'other',
] as const;

export const COMPLAINT_BAN_REASONS = [
  'dangerous_behavior',
  'severe_repeat',
  'repeat_cancel',
  'tos_violation',
  'rules_violation',
  'other',
] as const;

export class ComplaintPenaltyDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['warning', 'temporary', 'permanent'])
  kind!: 'warning' | 'temporary' | 'permanent';

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @ValidateIf((o: ComplaintPenaltyDto) => o.kind === 'temporary')
  @IsString()
  @IsNotEmpty()
  @IsIn(['1d', '3d', '7d', 'custom'])
  duration?: string;

  @ValidateIf((o: ComplaintPenaltyDto) => o.kind === 'temporary' && o.duration === 'custom')
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ValidateIf((o: ComplaintPenaltyDto) => o.kind === 'permanent')
  @IsBoolean()
  @Equals(true)
  confirmReviewedLog?: boolean;
}
