import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

// Express parity: middlewares/validatorMiddleware.ts turns express-validator
// failures into 422 {status:'error', message, code:'VALIDATION_ERROR',
// details:[{field, message, value}]}. This pipe reproduces that envelope for
// class-validator DTOs. Unknown (non-whitelisted) props are stripped, matching
// express-validator's ignore-unknown-fields behavior.
export interface ValidationDetail {
  field: string;
  message: string;
  value?: unknown;
}

function toDetails(errors: ValidationError[], parent = ''): ValidationDetail[] {
  const out: ValidationDetail[] = [];
  for (const err of errors) {
    const field = parent ? `${parent}.${err.property}` : err.property;
    if (err.constraints) {
      for (const message of Object.values(err.constraints)) {
        out.push({ field, message, value: err.value });
      }
    }
    if (err.children?.length) out.push(...toDetails(err.children, field));
  }
  return out;
}

export class ApiValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new UnprocessableEntityException({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: toDetails(errors),
        }),
    });
  }
}
