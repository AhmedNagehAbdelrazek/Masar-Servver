import { IsDefined, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

// Shared password rule: 8+ chars with upper, lower, digit, special.
// Port of passwordRegex in authValidator.ts. confirmPassword equality is
// enforced in AuthService (cross-field), matching the validator outcome (422).
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export class PasswordDto {
  @IsDefined()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX)
  password!: string;

  // Declared so whitelist-transform keeps it for the service equality check.
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}
