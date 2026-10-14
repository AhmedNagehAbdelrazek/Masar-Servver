import { PrismaService } from '../../prisma/prisma.service.js';
import type { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { InAppChannel } from './channels/in-app.channel.js';
import { PushChannel } from './channels/push.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
export type NotifyChannel = 'in_app' | 'push' | 'sms';
export interface NotifyUser {
    id: string;
    phone?: string | null;
    fcmToken?: string | null;
    locale?: string | null;
}
export interface SendOptions {
    channels?: NotifyChannel[];
    vars?: Record<string, unknown>;
    data?: Record<string, unknown>;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly realtime;
    private readonly sms;
    private readonly push;
    private readonly inApp;
    private readonly logger;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, sms: SmsChannel, push: PushChannel, inApp: InAppChannel);
    sendToUser(user: NotifyUser, type: string, { channels, vars, data }?: SendOptions): Promise<Record<string, unknown> | null>;
    notifyBookedPassengers(tripIds: string[], type: string, { vars, data, channels }?: SendOptions & {
        channels?: NotifyChannel[];
    }): Promise<void>;
    notifyConfirmedPassengers(tripIds: string | string[], type: string, { vars, data, channels }?: SendOptions & {
        channels?: NotifyChannel[];
    }): Promise<number>;
    listForUser(userId: string, { unread, page, limit }?: {
        unread?: boolean | null | undefined;
        page?: number | undefined;
        limit?: number | undefined;
    }): Promise<{
        rows: Record<string, unknown>[];
        count: number;
    }>;
    markRead(userId: string, notificationId: string): Promise<{
        id: string;
        isRead: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        marked: number;
    }>;
    countUnread(userId: string): Promise<number>;
    private emitCount;
}
