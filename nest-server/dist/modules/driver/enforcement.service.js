var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EnforcementService_1;
import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../realtime/realtime-metrics.service.js';
let EnforcementService = EnforcementService_1 = class EnforcementService {
    realtime;
    metrics;
    logger = new Logger(EnforcementService_1.name);
    constructor(realtime, metrics) {
        this.realtime = realtime;
        this.metrics = metrics;
    }
    revoke(userId, { action = 'suspend', reason = 'Account action applied', actorId = null, duration = null } = {}) {
        if (!userId)
            return false;
        this.realtime.emitToUser(userId, 'enforcement:revoke', {
            reason,
            action,
            duration,
            effective_at: new Date().toISOString(),
        });
        this.metrics.recordEvent('enforcement:revoke');
        void actorId;
        void this.realtime.disconnectUserSockets(userId).catch((err) => {
            this.logger.warn(`[enforcement] disconnect failed: ${err.message}`);
        });
        return true;
    }
    revokeIfBlocked(user, { actorId = null, reason = null } = {}) {
        if (!user)
            return false;
        if (user.status === 'suspended') {
            return this.revoke(user.id, { action: 'suspend', reason: reason ?? 'Account suspended', actorId });
        }
        if (user.status === 'banned') {
            return this.revoke(user.id, { action: 'ban', reason: reason ?? 'Account banned', actorId });
        }
        return false;
    }
    revocationForPenalty(penaltyType) {
        if (penaltyType === 'suspension')
            return { action: 'suspend', applies: true };
        if (penaltyType === 'ban')
            return { action: 'ban', applies: true };
        return { action: null, applies: false };
    }
};
EnforcementService = EnforcementService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RealtimeGateway,
        RealtimeMetricsService])
], EnforcementService);
export { EnforcementService };
//# sourceMappingURL=enforcement.service.js.map