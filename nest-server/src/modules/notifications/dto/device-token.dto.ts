import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Port of registerDeviceValidation (POST /api/notifications/device).
export class RegisterDeviceDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  fcm_token!: string;
}

// Port of unregisterDeviceValidation (DELETE /api/notifications/device).
// The token is optional so a bodyless logout call clears the current token.
export class UnregisterDeviceDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  fcm_token?: string;
}
