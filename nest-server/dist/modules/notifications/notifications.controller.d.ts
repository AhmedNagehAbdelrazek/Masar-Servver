import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { NotificationsService } from './notifications.service.js';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    listNotifications(query: Record<string, string>, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    markRead(notificationId: string, user?: AuthUser): Promise<{
        notification: {
            id: string;
            is_read: boolean;
        };
    }>;
}
