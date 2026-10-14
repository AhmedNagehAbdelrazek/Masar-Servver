import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

// Figma 10757:13462 (المحادثات list). type selects the conversation family:
// trip = driver<->passenger chats grouped by booking, admin = support tickets.
export class AdminConversationListQuery {
  @IsOptional()
  @IsIn(['trip', 'admin'])
  type?: 'trip' | 'admin';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['today', 'week', 'month', 'year', 'any'])
  date?: string;

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

export class ConversationBookingParam {
  @IsUUID()
  booking_id!: string;
}

export class AdminThreadQuery {
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

  @IsOptional()
  @IsUUID()
  before_id?: string;
}

// Figma 10785:17149 (إجراءات العقوبة) + 10791:31478/31414/31340 modals.
// target_user_id must be a party of the booking (driver or passenger).
export class ConversationPenaltyDto {
  @IsUUID()
  target_user_id!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['warning', 'temporary', 'permanent'])
  kind!: 'warning' | 'temporary' | 'permanent';

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @ValidateIf((o: ConversationPenaltyDto) => o.kind === 'temporary')
  @IsString()
  @IsNotEmpty()
  @IsIn(['1d', '3d', '7d', 'custom'])
  duration?: string;

  @ValidateIf((o: ConversationPenaltyDto) => o.kind === 'temporary' && o.duration === 'custom')
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  durationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ValidateIf((o: ConversationPenaltyDto) => o.kind === 'permanent')
  @IsBoolean()
  @Equals(true)
  confirmReviewedLog?: boolean;
}
