import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ALL_NOTIFICATION_TYPES } from '../notification.constants.js';

// Port of updateGroupedNotificationValidation: master_switch and updates are
// mutually exclusive; per-update type/channel/enabled rules apply only when
// `updates` is present (nested validation naturally scopes this).
@ValidatorConstraint({ name: 'exclusiveMasterSwitch', async: false })
class ExclusiveMasterSwitchRule implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as Record<string, unknown>;
    if (value !== undefined && obj.updates !== undefined) return false;
    return true;
  }

  defaultMessage(): string {
    return 'send either master_switch or updates, not both';
  }
}

class GroupedUpdateItemDto {
  @IsNotEmpty()
  @IsIn([...ALL_NOTIFICATION_TYPES])
  type!: string;

  @IsOptional()
  @IsIn(['in_app', 'push'])
  channel?: 'in_app' | 'push';

  @IsDefined()
  @IsBoolean()
  enabled!: boolean;
}

export class GroupedSettingsDto {
  @IsOptional()
  @IsBoolean()
  @Validate(ExclusiveMasterSwitchRule)
  master_switch?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupedUpdateItemDto)
  updates?: GroupedUpdateItemDto[];
}
