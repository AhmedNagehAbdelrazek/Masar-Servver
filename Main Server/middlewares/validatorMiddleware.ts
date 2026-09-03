import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiErrors } from '../utils/ApiError';
import { tValidation, modeFor } from '../utils/i18n';
import type { LocaleMode } from '../utils/i18n';

interface ValidationDetail {
  field: string;
  message: string;
  value: unknown;
}

function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const mode: LocaleMode = modeFor(req as unknown as Parameters<typeof modeFor>[0]);
    const details: ValidationDetail[] = errors.array().map((err) => {
      const e = err as { path?: string; msg: string; value?: unknown };
      return {
        field: e.path ?? '',
        message: tValidation(e.msg, mode),
        value: e.value,
      };
    });

    return next(ApiErrors.validation('VALIDATION_FAILED', details));
  }

  next();
}

export default validate;
module.exports = validate;
