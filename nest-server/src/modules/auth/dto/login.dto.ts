import { IsIn, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  phone!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsIn(['passenger', 'driver', 'admin'])
  role?: string;
}
