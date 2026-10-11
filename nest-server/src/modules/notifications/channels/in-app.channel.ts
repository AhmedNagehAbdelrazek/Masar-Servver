import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway.js';
import { RealtimeGateway as RealtimeGatewayToken } from '../../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../../realtime/realtime-metrics.service.js';

// Port of Main Server/Services/notificationService/channels/inApp.ts:
// persistence-before-broadcast, `notification:new` + refreshed
// `notification:count` badge to the user's room.
export interface InAppUser {
  id: string;
}

@Injectable()
export class InAppChannel {
  private readonly logger = new Logger(InAppChannel.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGatewayToken))
    private readonly realtime: RealtimeGateway,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  async send(
    user: InAppUser,
    message: { type: string; title: string; body: string },
    data: Record<string, unknown> = {},
  ): Promise<{ id: string } | null> {
    if (!user?.id) return null;
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: user.id,
          type: message.type,
          title: message.title,
          body: message.body,
          data: data as never,
          sentVia: ['in_app'],
        },
      });
      this.realtime.emitToUser(user.id, 'notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        reference_id: null,
        reference_type: null,
        created_at: notification.createdAt.toISOString(),
        timestamp: Date.now(),
      });
      const unreadCount = await this.prisma.notification.count({
        where: { userId: user.id, isRead: false },
      });
      this.realtime.emitToUser(user.id, 'notification:count', {
        unread_count: unreadCount,
        timestamp: Date.now(),
      });
      this.metrics.recordEvent('notification:new');
      this.metrics.recordDelivery();
      return { id: notification.id };
    } catch (err) {
      this.logger.warn(`[notification] in_app failed: ${(err as Error).message}`);
      return null;
    }
  }
}
