var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FreeOfferRule_1;
import { registerDecorator, ValidatorConstraint, } from 'class-validator';
let FreeOfferRule = FreeOfferRule_1 = class FreeOfferRule {
    validate(value, args) {
        const isFree = args.object.is_free === true;
        if (isFree) {
            if (value === undefined || value === null || typeof value !== 'object')
                return false;
            return FreeOfferRule_1.shape(value);
        }
        if (value !== undefined && value !== null && typeof value === 'object') {
            return FreeOfferRule_1.shape(value);
        }
        return true;
    }
    static shape(offer) {
        if (offer.type !== 'trips' && offer.type !== 'credit')
            return false;
        const v = Number(offer.value);
        return Number.isFinite(v) && v > 0;
    }
    defaultMessage() {
        return 'free_offer must be {type: trips|credit, value: positive number} for a free plan';
    }
};
FreeOfferRule = FreeOfferRule_1 = __decorate([
    ValidatorConstraint({ name: 'isFreeOffer', async: false })
], FreeOfferRule);
export function IsFreeOffer(options) {
    return (target, propertyKey) => {
        registerDecorator({
            target: target.constructor,
            propertyName: propertyKey,
            options,
            validator: FreeOfferRule,
        });
    };
}
//# sourceMappingURL=free-offer.validator.js.map