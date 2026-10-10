var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Validate, ValidatorConstraint, } from 'class-validator';
let ModelYearRangeRule = class ModelYearRangeRule {
    validate(value) {
        if (value === undefined || value === null)
            return true;
        const currentYear = new Date().getFullYear();
        const num = Number(value);
        return Number.isInteger(num) && num >= currentYear - 10 && num <= currentYear;
    }
    defaultMessage() {
        const currentYear = new Date().getFullYear();
        return `Model year must be between ${currentYear - 10} and ${currentYear} (within the last 10 years)`;
    }
};
ModelYearRangeRule = __decorate([
    ValidatorConstraint({ name: 'modelYearRange', async: false })
], ModelYearRangeRule);
export function IsModelYear(options) {
    return Validate(ModelYearRangeRule, options);
}
//# sourceMappingURL=model-year.validator.js.map