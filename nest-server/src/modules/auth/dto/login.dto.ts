import { Transform } from 'class-transformer';
import { IsDefined, IsIn, IsNotEmpty, IsString } from 'class-validator';

// Port of loginValidation. Role is now mandatory.
export class LoginDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @IsDefined()
  @IsNotEmpty()
  password!: string;

  @IsDefined()
  @IsNotEmpty()
  @IsIn(['passenger', 'driver', 'admin'])
  role!: 'passenger' | 'driver' | 'admin';
}
