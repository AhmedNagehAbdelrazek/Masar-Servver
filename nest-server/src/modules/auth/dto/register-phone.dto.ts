import { Transform } from 'class-transformer';
import { IsAlpha, IsDefined, IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

// Port of registerPhoneValidation. Phone-format validation (per-country
// length/digits) runs in AuthService via validatePhone, mirroring the
// validator's custom check (422 on failure).
export class RegisterPhoneDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @IsAlpha()
  @Length(2, 2)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  country_code!: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsIn(['passenger', 'driver'])
  role!: 'passenger' | 'driver';
}
