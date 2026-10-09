import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
export declare class AuditInterceptor implements NestInterceptor {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
