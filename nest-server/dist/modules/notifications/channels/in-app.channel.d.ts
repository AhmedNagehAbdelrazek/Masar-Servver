import { PrismaService } from '../../../prisma/prisma.service.js';
import type { RealtimeGateway } from '../../../realtime/realtime.gateway.js';
import { RealtimeMetricsService } from '../../../realtime/realtime-metrics.service.js';
export interface InAppUser {
    id: string;
}
export declare class InAppChannel {
    private readonly prisma;
    private readonly realtime;
    private readonly metrics;
    private readonly logger;
    constructor(prisma: PrismaService, realtime: RealtimeGateway, metrics: RealtimeMetricsService);
    send(user: InAppUser, message: {
        type: string;
        title: string;
        body: string;
    }, data?: Record<string, unknown>): Promise<{
        id: string;
    } | null>;
}
