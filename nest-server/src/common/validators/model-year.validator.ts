import {
  Validate,
  ValidatorConstraint,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from 'class-validator';

// Shared model-year range rule (last 10 years): used by vehicle update and
// driver onboarding validators. Absent values pass (optional fields).
@ValidatorConstraint({ name: 'modelYearRange', async: false })
class ModelYearRangeRule implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    const currentYear = new Date().getFullYear();
    const num = Number(value);
    return Number.isInteger(num) && num >= currentYear - 10 && num <= currentYear;
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    return `Model year must be between ${currentYear - 10} and ${currentYear} (within the last 10 years)`;
  }
}

export function IsModelYear(options?: ValidationOptions): PropertyDecorator {
  return Validate(ModelYearRangeRule, options);
}
