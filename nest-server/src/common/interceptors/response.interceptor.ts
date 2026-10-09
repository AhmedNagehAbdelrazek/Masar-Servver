import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

// Success shape mirrors Express helpers: controllers return raw data;
// paginated endpoints return { data, meta } explicitly. No forced envelope
// so localized payloads pass through unchanged (see successResponse()).
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => data));
  }
}
