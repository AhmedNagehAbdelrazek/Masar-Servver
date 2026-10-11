import { Transform } from 'class-transformer';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

// Port of documentKeyParamValidation (adminDashboardValidator.ts):
// trimmed string, 2-40 chars. Unknown keys pass validation and fail in the
// service with 400 DOCUMENT_KEY_NOT_RECOGNIZED (same as Express).
export class DocumentDecisionParams {
  @IsUUID()
  driver_id!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(2)
  @MaxLength(40)
  document_key!: string;
}
