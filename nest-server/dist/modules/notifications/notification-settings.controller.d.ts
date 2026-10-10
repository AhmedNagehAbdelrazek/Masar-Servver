import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { GroupedSettingsDto } from './dto/grouped-settings.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { NotificationSettingsService, type SettingEntry } from './notification-settings.service.js';
export declare class NotificationSettingsController {
    private readonly settings;
    constructor(settings: NotificationSettingsService);
    getNotificationSettings(user?: AuthUser): Promise<{
        settings: SettingEntry[];
    }>;
    updateNotificationSettings(dto: UpdateSettingsDto, user?: AuthUser): Promise<{
        updated_count: number;
    }>;
    getGroupedSettings(user?: AuthUser): Promise<{
        master_switch: boolean;
        categories: unknown[];
    }>;
    updateGroupedSettings(dto: GroupedSettingsDto, user?: AuthUser): Promise<{
        master_switch: boolean;
        categories: unknown[];
    }>;
}
