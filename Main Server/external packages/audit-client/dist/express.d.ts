import type { Request, Response, NextFunction } from 'express';
import { AuditClient } from './client';
export interface ExpressAuditOptions {
    skip?: (req: Request) => boolean;
    captureBody?: (req: Request) => boolean;
}
export declare function createAuditMiddleware(client: AuditClient, options?: ExpressAuditOptions): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=express.d.ts.map