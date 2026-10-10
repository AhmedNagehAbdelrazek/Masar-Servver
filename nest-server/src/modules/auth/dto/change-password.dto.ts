import { IsDefined, IsNotEmpty, Matches } from 'class-validator';
import { PASSWORD_REGEX } from './password.dto.js';

// Port of changePasswordValidation. The must-differ rule is enforced in
// AuthService (cross-field), matching the validator outcome (422).
export class ChangePasswordDto {
  @IsDefined()
  @IsNotEmpty()
  current_password!: string;

  @IsDefined()
  @IsNotEmpty()
  @Matches(PASSWORD_REGEX)
  new_password!: string;
}
