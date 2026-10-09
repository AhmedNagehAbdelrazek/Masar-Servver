import {
  registerDecorator,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from 'class-validator';

// Port of validateFreeOffer/validateFreeOfferShape in
// Main Server/utils/validators/planValidator.ts:
// - when the sibling is_free === true, free_offer is REQUIRED and must be
//   {type: 'trips'|'credit', value: positive number}
// - otherwise a provided object is still shape-checked; absent/null passes.
@ValidatorConstraint({ name: 'isFreeOffer', async: false })
class FreeOfferRule implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const isFree = (args.object as Record<string, unknown>).is_free === true;
    if (isFree) {
      if (value === undefined || value === null || typeof value !== 'object') return false;
      return FreeOfferRule.shape(value as Record<string, unknown>);
    }
    if (value !== undefined && value !== null && typeof value === 'object') {
      return FreeOfferRule.shape(value as Record<string, unknown>);
    }
    return true;
  }

  private static shape(offer: Record<string, unknown>): boolean {
    if (offer.type !== 'trips' && offer.type !== 'credit') return false;
    const v = Number(offer.value);
    return Number.isFinite(v) && v > 0;
  }

  defaultMessage(): string {
    return 'free_offer must be {type: trips|credit, value: positive number} for a free plan';
  }
}

export function IsFreeOffer(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      target: (target as object).constructor,
      propertyName: propertyKey as string,
      options,
      validator: FreeOfferRule,
    });
  };
}
