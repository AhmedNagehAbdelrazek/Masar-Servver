import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, tap } from 'rxjs';

// Port of createAuditMiddleware(audit, { skip: GET || /health }).
// Best-effort: never throws. Full audit-client wiring happens when
// AUDIT_COLLECTOR_URL/KEY/SECRET are set; otherwise disabled locally.
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      path?: string;
      url?: string;
      user?: { id: string; role: string };
    }>();
    const enabled = Boolean(
      this.config.get<string>('audit.collectorUrl') &&
        this.config.get<string>('audit.clientKey') &&
        this.config.get<string>('audit.clientSecret'),
    );
    const path = req.path ?? req.url ?? '';
    const skip = req.method === 'GET' || path === '/health' || path.startsWith('/health');
    return next.handle().pipe(
      tap(() => {
        if (skip || !enabled) return;
        this.logger.debug(
          `audit ${req.method} ${path} user=${req.user?.id ?? 'anonymous'}`,
        );
      }),
    );
  }
}
