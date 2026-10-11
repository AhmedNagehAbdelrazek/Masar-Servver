import { Type } from 'class-transformer';
import {
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

// Ports of createTicketValidation / listTicketsValidation /
// updateTicketValidation / updateTicketStatusValidation / addMessageValidation.
// Note: Express GET /:ticket_id skips the validate middleware, so the detail
// route accepts any id string (unknown ids 404); the DTO enforces UUID only
// where Express validated.
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  category!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  subject!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: (typeof TICKET_PRIORITIES)[number];

  @IsOptional()
  @IsUUID()
  booking_id?: string;

  @IsOptional()
  @IsUUID()
  trip_id?: string;
}

export class ListTicketsQuery {
  @IsOptional()
  @IsIn([...TICKET_STATUSES])
  status?: (typeof TICKET_STATUSES)[number];

  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: (typeof TICKET_PRIORITIES)[number];

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

export class TicketIdParam {
  @IsUUID()
  ticket_id!: string;
}

export class UpdateTicketDto {
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsIn([...TICKET_PRIORITIES])
  priority?: (typeof TICKET_PRIORITIES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  resolution_notes?: string;
}

export class UpdateTicketStatusDto {
  @IsNotEmpty()
  @IsIn([...TICKET_STATUSES])
  status!: (typeof TICKET_STATUSES)[number];
}

export class AddTicketMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(4000)
  message!: string;
}
