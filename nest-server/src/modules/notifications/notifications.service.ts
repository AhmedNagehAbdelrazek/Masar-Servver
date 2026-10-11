import { ForbiddenException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeGateway as RealtimeGatewayToken } from '../../realtime/realtime.gateway.js';
import { InAppChannel } from './channels/in-app.channel.js';
import { PushChannel } from './channels/push.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
import { interpolate, TEMPLATES } from './templates.js';

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

// Port of Main Server/Services/notificationService/index.ts.
// Delivery is best-effort and never throws (except the notFound/forbidden
// read guards, which mirror the Express API errors).
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGatewayToken))
    private readonly realtime: RealtimeGateway,
    private readonly sms: SmsChannel,
    private readonly push: PushChannel,
    private readonly inApp: InAppChannel,
  ) {}

  async sendToUser(
    user: NotifyUser,
    type: string,
    { channels = ['in_app'], vars = {}, data = {} }: SendOptions = {},
  ): Promise<Record<string, unknown> | null> {
    const template = TEMPLATES[type];
    if (!template) {
      this.logger.warn(`[notification] unknown type: ${type}`);
      return null;
    }
    const locale = user?.locale ?? 'ar';
    const entry = (template[locale as 'ar' | 'en'] ?? template.en) as { title: string; body: string };
    const message = {
      type,
      title: interpolate(entry.title, vars),
      body: interpolate(entry.body, vars),
    };

    let allowedChannels = [...channels];
    try {
      // Template keys are UPPER_SNAKE while stored settings values are
      // lowercase — check both instead of migrating data (Express parity).
      const setting = await this.prisma.notificationSetting.findFirst({
        where: { userId: user.id, notificationType: { in: [type, String(type).toLowerCase()] } },
      });
      if (setting) {
        if (!setting.enabledInApp) allowedChannels = allowedChannels.filter((c) => c !== 'in_app');
        if (!setting.enabledPush) allowedChannels = allowedChannels.filter((c) => c !== 'push');
      }
    } catch (err) {
      this.logger.warn(`[notification] settings check failed: ${(err as Error).message}`);
    }

    const results: Record<string, unknown> = {};
    if (allowedChannels.includes('sms')) {
      try {
        await this.sms.send(user, message);
        results.sms = true;
      } catch (err) {
        results.sms = false;
        this.logger.warn(`[notification] sms failed: ${(err as Error).message}`);
      }
    }
    if (allowedChannels.includes('push')) {
      try {
        await this.push.send(user, message, data);
        results.push = true;
      } catch (err) {
        results.push = false;
        this.logger.warn(`[notification] push failed: ${(err as Error).message}`);
      }
    }
    if (allowedChannels.includes('in_app')) {
      try {
        results.in_app = await this.inApp.send(user, message, data);
      } catch (err) {
        results.in_app = null;
        this.logger.warn(`[notification] in_app failed: ${(err as Error).message}`);
      }
    }
    return results;
  }

  async notifyBookedPassengers(
    tripIds: string[],
    type: string,
    { vars = {}, data = {}, channels = ['in_app', 'push'] }: SendOptions & { channels?: NotifyChannel[] } = {},
  ): Promise<void> {
    if (!tripIds || tripIds.length === 0) return;
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { tripId: { in: tripIds }, status: { in: ['confirmed', 'pending'] } },
        include: {
          trip: { select: { originCity: true, destinationCity: true } },
          passenger: { select: { id: true, phone: true, fcmToken: true, locale: true } },
        },
      });
      const seen = new Set<string>();
      for (const booking of bookings) {
        const passenger = booking.passenger as unknown as NotifyUser | null;
        if (!passenger || seen.has(passenger.id)) continue;
        seen.add(passenger.id);
        const trip = booking.trip as unknown as { originCity: string; destinationCity: string } | null;
        const route = trip ? `${trip.originCity} → ${trip.destinationCity}` : '';
        await this.sendToUser(passenger, type, { channels, vars: { route, ...vars }, data });
      }
    } catch (err) {
      this.logger.warn(`[notification] notifyBookedPassengers failed: ${(err as Error).message}`);
    }
  }

  async notifyConfirmedPassengers(
    tripIds: string | string[],
    type: string,
    { vars = {}, data = {}, channels = ['in_app', 'push'] }: SendOptions & { channels?: NotifyChannel[] } = {},
  ): Promise<number> {
    const ids = Array.isArray(tripIds) ? tripIds : [tripIds];
    if (ids.length === 0) return 0;
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { tripId: { in: ids }, status: 'confirmed' },
        include: {
          trip: { select: { originCity: true, destinationCity: true } },
          passenger: { select: { id: true, phone: true, fcmToken: true, locale: true } },
        },
      });
      let count = 0;
      const seen = new Set<string>();
      for (const booking of bookings) {
        const passenger = booking.passenger as unknown as NotifyUser | null;
        if (!passenger || seen.has(passenger.id)) continue;
        seen.add(passenger.id);
        const trip = booking.trip as unknown as { originCity: string; destinationCity: string } | null;
        const route = trip ? `${trip.originCity} → ${trip.destinationCity}` : '';
        await this.sendToUser(passenger, type, { channels, vars: { route, ...vars }, data });
        count += 1;
      }
      return count;
    } catch (err) {
      this.logger.warn(`[notification] notifyConfirmedPassengers failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async listForUser(
    userId: string,
    { unread = null as boolean | null, page = 1, limit = 20 } = {},
  ): Promise<{ rows: Record<string, unknown>[]; count: number }> {
    const where: { userId: string; isRead?: boolean } = { userId };
    if (unread === true) where.isRead = false;
    else if (unread === false) where.isRead = true;
    const [rows, count] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { rows: rows as unknown as Record<string, unknown>[], count };
  }

  async markRead(userId: string, notificationId: string): Promise<{ id: string; isRead: boolean }> {
    if (!notificationId) {
      throw new NotFoundException({ message: 'NOTIFICATION_NOT_FOUND', code: 'NOTIFICATION_NOT_FOUND' });
    }
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      throw new NotFoundException({ message: 'NOTIFICATION_NOT_FOUND', code: 'NOTIFICATION_NOT_FOUND' });
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException({
        message: 'YOU_CAN_ONLY_MARK_YOUR_OWN_NOTIFICATIONS_AS_READ',
        code: 'FORBIDDEN',
      });
    }
    if (!notification.isRead) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      await this.emitCount(userId);
    }
    return { id: notification.id, isRead: true };
  }

  async markAllRead(userId: string): Promise<{ marked: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    await this.emitCount(userId);
    return { marked: res.count };
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  private async emitCount(userId: string): Promise<void> {
    try {
      const unreadCount = await this.countUnread(userId);
      this.realtime.emitToUser(userId, 'notification:count', {
        unread_count: unreadCount,
        timestamp: Date.now(),
      });
    } catch {
      // ignore
    }
  }
}
