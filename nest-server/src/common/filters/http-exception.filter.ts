import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { resolveLocaleMode } from '../utils/locale.js';

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
        const out: Record<string, unknown> = {
          status: 'error',
          message: payload.message,
          code: payload.code,
        };
        if (payload.message_en !== undefined) {
          if (mode === 'both') out.message_en = payload.message_en;
          else if (mode === 'en') out.message = payload.message_en;
        }
        if (payload.details !== undefined) out.details = payload.details;
        res.status(status).json(out);
        return;
      }
      const message = typeof body === 'string' ? body : (body as { message?: unknown }).message;
      res.status(status).json({
        status: 'error',
        message: Array.isArray(message) ? message.join(', ') : (message ?? 'Error'),
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
