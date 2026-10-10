import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { GroupedSettingsDto } from './dto/grouped-settings.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { NotificationSettingsService, type SettingEntry } from './notification-settings.service.js';

// Express parity: Routes/notificationSettingRoutes.ts mounted at
// /api/settings/notifications (+ driver-only grouped screen).
@Controller('settings/notifications')
export class NotificationSettingsController {
  constructor(private readonly settings: NotificationSettingsService) {}

  @Get()
  getNotificationSettings(
    @CurrentUser() user?: AuthUser,
  ): Promise<{ settings: SettingEntry[] }> {
    return this.settings.getSettings(user?.id ?? '').then((settings) => ({ settings }));
  }

  @Put()
  updateNotificationSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ updated_count: number }> {
    return this.settings.updateSettings(user?.id ?? '', dto.settings);
  }

  @Get('grouped')
  @Roles('driver')
  getGroupedSettings(@CurrentUser() user?: AuthUser): Promise<{
    master_switch: boolean;
    categories: unknown[];
  }> {
    return this.settings.getGroupedSettings(user?.id ?? '');
  }

  @Put('grouped')
  @Roles('driver')
  updateGroupedSettings(
    @Body() dto: GroupedSettingsDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ master_switch: boolean; categories: unknown[] }> {
    return this.settings.updateGroupedSettings(user?.id ?? '', dto);
  }
}
