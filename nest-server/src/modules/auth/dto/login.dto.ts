import { Transform } from 'class-transformer';
import { IsDefined, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Port of loginValidation. NOTE: Express applies bare isIn() to `role`
// (skipped when absent), so role is optional here despite no .optional().
export class LoginDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  phone!: string;

  @IsDefined()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsIn(['passenger', 'driver', 'admin'])
  role?: string;
}
