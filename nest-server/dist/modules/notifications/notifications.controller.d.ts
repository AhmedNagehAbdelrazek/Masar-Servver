import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/device-token.dto.js';
import { NotificationsService } from './notifications.service.js';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    listNotifications(query: Record<string, string>, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    markAllRead(user?: AuthUser): Promise<{
        marked: number;
    }>;
    markRead(notificationId: string, user?: AuthUser): Promise<{
        notification: {
            id: string;
            is_read: boolean;
        };
    }>;
    deleteAll(user?: AuthUser): Promise<{
        deleted: number;
    }>;
    registerDevice(dto: RegisterDeviceDto, user?: AuthUser): Promise<{
        device: {
            registered: boolean;
        };
    }>;
    unregisterDevice(dto: UnregisterDeviceDto, user?: AuthUser): Promise<{
        device: {
            registered: boolean;
        };
    }>;
}
