import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { localizePayload } from '../i18n/i18n.js';
import { resolveLocaleMode } from '../utils/locale.js';

// Port of successResponse()'s localizePayload step: success payloads carry
// catalog KEYS in `message` fields (e.g. {message:'OTP_SENT'}); this renders
// them per request locale. Unknown strings pass through untouched.
@Injectable()
export class LocalizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const mode = resolveLocaleMode({
      query: req.query as Record<string, unknown>,
      headers: req.headers as Record<string, unknown>,
    });
    return next.handle().pipe(map((data: unknown) => localizePayload(data, mode)));
  }
}
