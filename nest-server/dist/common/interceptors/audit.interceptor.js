var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditInterceptor_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tap } from 'rxjs';
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    config;
    logger = new Logger(AuditInterceptor_1.name);
    constructor(config) {
        this.config = config;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const enabled = Boolean(this.config.get('audit.collectorUrl') &&
            this.config.get('audit.clientKey') &&
            this.config.get('audit.clientSecret'));
        const path = req.path ?? req.url ?? '';
        const skip = req.method === 'GET' || path === '/health' || path.startsWith('/health');
        return next.handle().pipe(tap(() => {
            if (skip || !enabled)
                return;
            this.logger.debug(`audit ${req.method} ${path} user=${req.user?.id ?? 'anonymous'}`);
        }));
    }
};
AuditInterceptor = AuditInterceptor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], AuditInterceptor);
export { AuditInterceptor };
//# sourceMappingURL=audit.interceptor.js.map