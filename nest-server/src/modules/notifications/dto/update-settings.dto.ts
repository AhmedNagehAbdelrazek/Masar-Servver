import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ALL_NOTIFICATION_TYPES } from '../notification.constants.js';

// Port of updateNotificationSettingsValidation.
class SettingItemDto {
  @IsNotEmpty()
  @IsIn([...ALL_NOTIFICATION_TYPES])
  type!: string;

  @IsOptional()
  @IsBoolean()
  enabled_in_app?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled_push?: boolean;
}

export class UpdateSettingsDto {
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings!: SettingItemDto[];
}
