import { Pool } from 'pg';
import { AuditQueuePayload } from './queue';
export declare function insertAuditBatch(pool: Pool, payloads: AuditQueuePayload[]): Promise<void>;
//# sourceMappingURL=worker.d.ts.map