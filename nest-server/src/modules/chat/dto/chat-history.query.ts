import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

// Ports of bookingMessagesValidation / ticketMessagesValidation: UUID route
// params + page/limit/before_id cursor query.
export class BookingMessagesParam {
  @IsUUID()
  bookingId!: string;
}

export class TicketMessagesParam {
  @IsUUID()
  ticketId!: string;
}

export class ChatHistoryQuery {
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
