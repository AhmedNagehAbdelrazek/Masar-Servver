import { IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  phone!: string;

  @IsString()
  @Matches(/^[0-9]{6}$/)
  otp!: string;
}
