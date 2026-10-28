import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { hasKey, localizeDetail, shape } from '../i18n/i18n.js';
import { resolveLocaleMode } from '../utils/locale.js';

// Express parity (Main Server/utils/ApiError.ts): V1 has one code for every
// 401 (UNAUTHORIZED), uses FORBIDDEN for role denials, and emits generic
// NOT_FOUND for missing resources — but it *does* have a few explicit codes
// (FIELD_LOCKED, SEAT_LOCK_EXPIRED, NO_PENDING_DELETION_REQUEST, ...), so only
// collapse the codes that V2 invented: AUTH_* on 403 and *_NOT_FOUND on 404.
function mapCodeToV1(status: number, code: unknown): unknown {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403 && typeof code === 'string' && code.startsWith('AUTH_')) return 'FORBIDDEN';
  if (status === 404 && typeof code === 'string') {
    if (code === 'ROUTE_NOT_FOUND') return code;
    if (code.endsWith('_NOT_FOUND') || code === 'SEAT_LOCK_EXPIRED_OR_DOES_NOT_EXIST') {
      return 'NOT_FOUND';
    }
  }
  return code;
}

function isJsonParseMessage(message: unknown): boolean {
  return (
    typeof message === 'string' &&
    (/JSON at position/i.test(message) ||
      /^Unexpected token/i.test(message) ||
      /^Unexpected end of JSON/i.test(message) ||
      /^Expected .+ in JSON/i.test(message))
  );
}

// Port of Main Server/middlewares/globalErrorHandler.ts + utils/ApiError.ts
// Error envelope: { status: 'error', message, message_en?, code, details? }
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { user?: { id: string; role: string } }>();
    const res = ctx.getResponse<Response>();
    const mode = resolveLocaleMode({
      query: req.query as Record<string, unknown>,
      headers: req.headers as Record<string, unknown>,
    });

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null && 'code' in body) {
        const payload = body as Record<string, unknown>;
        // Services throw catalog KEYS as message (e.g. 'OTP_SENT'); render
        // per request locale. Raw strings pass through (entryFor fallback).
        const shaped =
          typeof payload.message === 'string' && hasKey(payload.message)
            ? shape(
                payload.message,
                (payload.params as Record<string, unknown> | undefined) ?? null,
                mode,
              )
            : isJsonParseMessage(payload.message)
              ? shape('INVALID_JSON_BODY', null, mode)
              : { message: payload.message };
        const out: Record<string, unknown> = {
          status: 'error',
          ...shaped,
          code: mapCodeToV1(status, payload.code),
        };
        if (Array.isArray(payload.details)) {
          out.details = (payload.details as Record<string, string>[]).map((d) =>
            localizeDetail(
              d as { field: string; message: string; value?: unknown },
              mode,
            ),
          );
        } else if (payload.details !== undefined) {
          out.details = payload.details;
        }
        res.status(status).json(out);
        return;
      }
      const message = typeof body === 'string' ? body : (body as { message?: unknown }).message;
      // Express parity (app.ts 404 middleware): Nest's router throws a codeless
      // `Cannot ${method} ${url}` NotFoundException for unknown routes. Render
      // the Express envelope instead of the Nest default.
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
        ...(isJsonParseMessage(message)
          ? shape('INVALID_JSON_BODY', null, mode)
          : { message: Array.isArray(message) ? message.join(', ') : (message ?? 'Error') }),
        code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST',
      });
      return;
    }

    this.logger.error(
      `Unhandled error ${req.method} ${req.originalUrl}: ${
        exception instanceof Error ? exception.stack ?? exception.message : String(exception)
      }`,
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: mode === 'en' ? 'Internal server error.' : 'خطأ داخلي في الخادم.',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });
  }
}
