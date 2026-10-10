import { RealtimeGateway } from '../../realtime/realtime.gateway.js';
export declare class EnforcementService {
    private readonly realtime;
    private readonly logger;
    constructor(realtime: RealtimeGateway);
    revoke(userId: string, { action, reason, actorId, duration }?: {
        action?: string | undefined;
        reason?: string | undefined;
        actorId?: string | null | undefined;
        duration?: string | null | undefined;
    }): boolean;
    revokeIfBlocked(user: {
        id: string;
        status: string;
    } | null, { actorId, reason }?: {
        actorId?: string | null | undefined;
        reason?: string | null | undefined;
    }): boolean;
    revocationForPenalty(penaltyType: string): {
        action: string | null;
        applies: boolean;
    };
}
