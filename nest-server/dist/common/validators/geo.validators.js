var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Transform } from 'class-transformer';
import { Validate, ValidatorConstraint, } from 'class-validator';
const DECIMAL_RE = /^-?\d+(\.\d+)?$/;
let IsLatRule = class IsLatRule {
    validate(value) {
        if (value === undefined || value === null || value === '')
            return true;
        if (typeof value !== 'string' && typeof value !== 'number')
            return false;
        if (!DECIMAL_RE.test(String(value)))
            return false;
        const n = parseFloat(String(value));
        return n >= -90 && n <= 90;
    }
    defaultMessage(args) {
        return `${String(args.property)} must be a decimal latitude between -90 and 90`;
    }
};
IsLatRule = __decorate([
    ValidatorConstraint({ name: 'isLat', async: false })
], IsLatRule);
let IsLngRule = class IsLngRule {
    validate(value) {
        if (value === undefined || value === null || value === '')
            return true;
        if (typeof value !== 'string' && typeof value !== 'number')
            return false;
        if (!DECIMAL_RE.test(String(value)))
            return false;
        const n = parseFloat(String(value));
        return n >= -180 && n <= 180;
    }
    defaultMessage(args) {
        return `${String(args.property)} must be a decimal longitude between -180 and 180`;
    }
};
IsLngRule = __decorate([
    ValidatorConstraint({ name: 'isLng', async: false })
], IsLngRule);
let IsMoneyRule = class IsMoneyRule {
    validate(value) {
        if (value === undefined || value === null || value === '')
            return true;
        if (typeof value !== 'string' && typeof value !== 'number')
            return false;
        if (!/^\d+(\.\d{1,2})?$/.test(String(value)))
            return false;
        return parseFloat(String(value)) >= 0;
    }
    defaultMessage(args) {
        return `${String(args.property)} must be a non-negative decimal with up to 2 places`;
    }
};
IsMoneyRule = __decorate([
    ValidatorConstraint({ name: 'isMoney', async: false })
], IsMoneyRule);
let HasTimezoneRule = class HasTimezoneRule {
    validate(value) {
        if (value === undefined || value === null || value === '')
            return true;
        return typeof value === 'string' && /(Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
    }
    defaultMessage() {
        return 'datetime must include a timezone offset';
    }
};
HasTimezoneRule = __decorate([
    ValidatorConstraint({ name: 'hasTimezone', async: false })
], HasTimezoneRule);
export function IsLat(options) {
    return Validate(IsLatRule, options);
}
export function IsLng(options) {
    return Validate(IsLngRule, options);
}
export function IsMoney(options) {
    return Validate(IsMoneyRule, options);
}
export function HasTimezone(options) {
    return Validate(HasTimezoneRule, options);
}
export function TrimString() {
    return Transform(({ value }) => typeof value === 'string' ? value.trim() : value);
}
//# sourceMappingURL=geo.validators.js.map