import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Port of complaintValidation (utils/validators/complaintValidator.ts).
// NOTE: the "no self-complaint" rule needs the request user, so it is
// enforced in ComplaintsService (422 VALIDATION_ERROR with details, matching
// the contract test) rather than here.
export const COMPLAINT_CATEGORIES = [
  'no_show',
  'lateness',
  'misconduct',
  'fraud',
  'safety',
  'overcharging',
  'other',
] as const;

export class CreateComplaintDto {
  @IsUUID()
  accused_id!: string;

  @IsOptional()
  @IsUUID()
  booking_id?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([...COMPLAINT_CATEGORIES])
  category!: (typeof COMPLAINT_CATEGORIES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  description!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, { each: true })
  evidence_urls?: string[];
}
