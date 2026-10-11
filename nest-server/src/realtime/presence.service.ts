import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import type { RealtimeGateway } from './realtime.gateway.js';
import { RealtimeGateway as RealtimeGatewayToken } from './realtime.gateway.js';
import { RealtimeMetricsService } from './realtime-metrics.service.js';

// Port of Main Server/Services/presenceService.ts: 60s TTL online flag with
// a 60s grace timer before marking offline (cancelled by reconnect).
export const PRESENCE_TTL_SECONDS = 60;
const GRACE_MS = 60 * 1000;

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly pendingOffline = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly redis: RedisService,
    @Inject(forwardRef(() => RealtimeGatewayToken))
    private readonly realtime: RealtimeGateway,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  private key(userId: string): string {
    return `presence:${userId}`;
  }

  private emitStatus(
    userId: string,
    role: string,
    status: 'online' | 'offline',
    lastSeen?: string,
  ): void {
    try {
      // Express parity: last_seen is always an ISO string (both producers).
      const last_seen = lastSeen ?? new Date().toISOString();
      this.realtime.emitToRole(role, 'presence:status', {
        user_id: userId,
        status,
        last_seen,
        timestamp: Date.now(),
      });
      if (status === 'online' && role === 'driver') {
        this.realtime.emitToRole('admin', 'admin:driver_online', {
          driver_id: userId,
          lat: null,
          lng: null,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      this.logger.warn(`presence emit failed: ${(err as Error).message}`);
    }
  }

  async markOnline(userId: string, role: string): Promise<void> {
    const pending = this.pendingOffline.get(userId);
    if (pending) {
      clearTimeout(pending);
      this.pendingOffline.delete(userId);
    }
    try {
      await this.redis.setKey(this.key(userId), 'online', PRESENCE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`presence write failed: ${(err as Error).message}`);
    }
    this.emitStatus(userId, role, 'online');
    this.metrics.recordEvent('presence:online');
  }

  scheduleOffline(userId: string, role: string): void {
    // Express parity: clear-and-reschedule the pending timer (a second
    // disconnect refreshes the 60s grace window instead of being ignored).
    if (this.pendingOffline.has(userId)) {
      clearTimeout(this.pendingOffline.get(userId));
    }
    const timer = setTimeout(() => {
      this.pendingOffline.delete(userId);
      void this.redis.deleteKey(this.key(userId)).catch(() => undefined);
      this.emitStatus(userId, role, 'offline');
      this.metrics.recordEvent('presence:offline');
    }, GRACE_MS);
    timer.unref?.();
    this.pendingOffline.set(userId, timer);
  }

  async getStatus(userId: string): Promise<'online' | 'offline'> {
    try {
      return (await this.redis.getKey(this.key(userId))) === 'online' ? 'online' : 'offline';
    } catch {
      return 'offline';
    }
  }
}
