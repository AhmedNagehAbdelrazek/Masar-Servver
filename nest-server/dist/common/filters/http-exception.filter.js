var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
import { Catch, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import { hasKey, localizeDetail, shape } from '../i18n/i18n.js';
import { resolveLocaleMode } from '../utils/locale.js';
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const mode = resolveLocaleMode({
            query: req.query,
            headers: req.headers,
        });
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'object' && body !== null && 'code' in body) {
                const payload = body;
                const shaped = typeof payload.message === 'string' && hasKey(payload.message)
                    ? shape(payload.message, payload.params ?? null, mode)
                    : { message: payload.message };
                const out = {
                    status: 'error',
                    ...shaped,
                    code: payload.code,
                };
                if (Array.isArray(payload.details)) {
                    out.details = payload.details.map((d) => localizeDetail(d, mode));
                }
                else if (payload.details !== undefined) {
                    out.details = payload.details;
                }
                res.status(status).json(out);
                return;
            }
            const message = typeof body === 'string' ? body : body.message;
            if (status === 404) {
                res.status(404).json({
                    status: 'error',
                    message: `Route ${req.method} ${req.originalUrl} not found`,
                    code: 'ROUTE_NOT_FOUND',
                });
                return;
            }
            res.status(status).json({
                status: 'error',
                message: Array.isArray(message) ? message.join(', ') : (message ?? 'Error'),
                code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST',
            });
            return;
        }
        this.logger.error(`Unhandled error ${req.method} ${req.originalUrl}: ${exception instanceof Error ? exception.stack ?? exception.message : String(exception)}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: mode === 'en' ? 'Internal server error.' : 'خطأ داخلي في الخادم.',
            code: 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV === 'development' && exception instanceof Error
                ? { stack: exception.stack }
                : {}),
        });
    }
};
HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    Catch()
], HttpExceptionFilter);
export { HttpExceptionFilter };
//# sourceMappingURL=http-exception.filter.js.map