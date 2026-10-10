import { Transform } from 'class-transformer';
import { IsDefined, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Ports of forgotPasswordValidation / resendOTPValidation / refreshValidation.
export class PhoneDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;
}

export class ResendOtpDto extends PhoneDto {
  @IsDefined()
  @IsNotEmpty()
  @IsIn(['register', 'forgot_password'])
  purpose!: 'register' | 'forgot_password';
}

export class RefreshDto {
  @IsDefined()
  @IsNotEmpty()
  refresh_token!: string;
}

export class LogoutDto {
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
