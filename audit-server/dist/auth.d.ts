import { Pool } from 'pg';
export interface AuthenticatedService {
    serviceId: string;
    serviceName: string;
    environment: string;
}
export declare function verifyAuditRequest(params: {
    pool: Pool;
    serviceId: string;
    clientKey: string;
    timestamp: string;
    signature: string;
    rawBody: string;
    maxAgeMs?: number;
}): Promise<AuthenticatedService>;
//# sourceMappingURL=auth.d.ts.map