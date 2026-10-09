import { IsIn, IsString, Length, Matches } from 'class-validator';

// Port of Main Server/utils/validators/authValidator.ts (register/phone subset)
export class RegisterPhoneDto {
  @IsString()
  @Length(2, 5)
  country_code!: string;

  @IsString()
  @Matches(/^[0-9+\s-]{5,20}$/)
  phone!: string;

  @IsIn(['passenger', 'driver'])
  role!: 'passenger' | 'driver';
}
