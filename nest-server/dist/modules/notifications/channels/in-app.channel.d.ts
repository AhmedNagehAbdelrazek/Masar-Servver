import { PrismaService } from '../../../prisma/prisma.service.js';
import { RealtimeGateway } from '../../../realtime/realtime.gateway.js';
export interface InAppUser {
    id: string;
}
export declare class InAppChannel {
    private readonly prisma;
    private readonly realtime;
    private readonly logger;
    constructor(prisma: PrismaService, realtime: RealtimeGateway);
    send(user: InAppUser, message: {
        type: string;
        title: string;
        body: string;
    }, data?: Record<string, unknown>): Promise<{
        id: string;
    } | null>;
}
