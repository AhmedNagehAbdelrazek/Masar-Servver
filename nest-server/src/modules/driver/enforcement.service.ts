import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../realtime/realtime-metrics.service.js';

// Port of Main Server/Services/enforcementService.ts: immediate session
// revocation on suspension/ban. Best-effort, never throws into callers.
@Injectable()
export class EnforcementService {
  private readonly logger = new Logger(EnforcementService.name);

  constructor(
    private readonly realtime: RealtimeGateway,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  revoke(
    userId: string,
    { action = 'suspend', reason = 'Account action applied', actorId = null as string | null, duration = null as string | null } = {},
  ): boolean {
    if (!userId) return false;
    this.realtime.emitToUser(userId, 'enforcement:revoke', {
      reason,
      action,
      duration,
      effective_at: new Date().toISOString(),
    });
    this.metrics.recordEvent('enforcement:revoke');
    void actorId;
    void this.realtime.disconnectUserSockets(userId).catch((err: Error) => {
      this.logger.warn(`[enforcement] disconnect failed: ${err.message}`);
    });
    return true;
  }

  revokeIfBlocked(
    user: { id: string; status: string } | null,
    { actorId = null as string | null, reason = null as string | null } = {},
  ): boolean {
    if (!user) return false;
    if (user.status === 'suspended') {
      return this.revoke(user.id, { action: 'suspend', reason: reason ?? 'Account suspended', actorId });
    }
    if (user.status === 'banned') {
      return this.revoke(user.id, { action: 'ban', reason: reason ?? 'Account banned', actorId });
    }
    return false;
  }

  revocationForPenalty(penaltyType: string): { action: string | null; applies: boolean } {
    if (penaltyType === 'suspension') return { action: 'suspend', applies: true };
    if (penaltyType === 'ban') return { action: 'ban', applies: true };
    return { action: null, applies: false };
  }
}
