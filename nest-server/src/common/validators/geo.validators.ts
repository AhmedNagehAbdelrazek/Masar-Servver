import { Transform } from 'class-transformer';
import {
  Validate,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from 'class-validator';

// Shared decimal/range validators mirroring express-validator isDecimal +
// range customs. Accept strings or numbers (tests send both); services store
// via Number().
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

@ValidatorConstraint({ name: 'isLat', async: false })
class IsLatRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    if (!DECIMAL_RE.test(String(value))) return false;
    const n = parseFloat(String(value));
    return n >= -90 && n <= 90;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${String(args.property)} must be a decimal latitude between -90 and 90`;
  }
}

@ValidatorConstraint({ name: 'isLng', async: false })
class IsLngRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    if (!DECIMAL_RE.test(String(value))) return false;
    const n = parseFloat(String(value));
    return n >= -180 && n <= 180;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${String(args.property)} must be a decimal longitude between -180 and 180`;
  }
}

@ValidatorConstraint({ name: 'isMoney', async: false })
class IsMoneyRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return false;
    return parseFloat(String(value)) >= 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${String(args.property)} must be a non-negative decimal with up to 2 places`;
  }
}

@ValidatorConstraint({ name: 'hasTimezone', async: false })
class HasTimezoneRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    return typeof value === 'string' && /(Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
  }

  defaultMessage(): string {
    return 'datetime must include a timezone offset';
  }
}

export function IsLat(options?: ValidationOptions): PropertyDecorator {
  return Validate(IsLatRule, options);
}

export function IsLng(options?: ValidationOptions): PropertyDecorator {
  return Validate(IsLngRule, options);
}

export function IsMoney(options?: ValidationOptions): PropertyDecorator {
  return Validate(IsMoneyRule, options);
}

export function HasTimezone(options?: ValidationOptions): PropertyDecorator {
  return Validate(HasTimezoneRule, options);
}

export function TrimString(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
