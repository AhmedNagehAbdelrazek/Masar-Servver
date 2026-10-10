import { Transform } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

// Port of verifyOTPValidation (shared by register + forgot-password flows).
export class VerifyOtpDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d+$/)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  otp!: string;
}
