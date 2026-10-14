import { PrismaService } from '../../prisma/prisma.service.js';
import type { RealtimeGateway } from '../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../realtime/realtime-metrics.service.js';
export interface SosUser {
    id: string;
    role: string;
}
export declare const RE_ALERT_INTERVAL_MS: number;
export declare const ESCALATION_AFTER_MS: number;
export declare class SosService {
    private readonly prisma;
    private readonly realtime;
    private readonly metrics;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, metrics: RealtimeMetricsService);
    isTripMember(user: SosUser, tripId: string): Promise<boolean>;
    findActiveForUser(userId: string): Promise<{
        id: string;
    } | null>;
    private alertPayload;
    trigger(user: SosUser, input: {
        tripId?: string;
        lat?: number;
        lng?: number;
        urgency?: string;
    }): Promise<{
        sos_event_id: string;
        reused: boolean;
    }>;
    listAdmin(_actor: SosUser, input: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    acknowledge(actor: SosUser, sosId: string): Promise<{
        sos_event: Record<string, unknown>;
    }>;
    resolve(actor: SosUser, sosId: string, resolutionNote?: string): Promise<{
        sos_event: Record<string, unknown>;
    }>;
    runEscalation(): Promise<{
        alerted: number;
        escalated: number;
    }>;
}
