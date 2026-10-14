var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, } from 'class-validator';
import { IsFreeOffer } from './free-offer.validator.js';
export class UpdatePlanDto {
    name;
    period_days;
    percentage_cut;
    cost;
    status;
    features;
    is_free;
    free_offer;
    is_active;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdatePlanDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdatePlanDto.prototype, "period_days", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdatePlanDto.prototype, "percentage_cut", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdatePlanDto.prototype, "cost", void 0);
__decorate([
    IsOptional(),
    IsIn(['most_requested', 'frequent', 'popular', null]),
    Transform(({ value }) => (value === '' ? null : value)),
    __metadata("design:type", Object)
], UpdatePlanDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    MaxLength(200, { each: true }),
    Transform(({ value }) => Array.isArray(value) ? value.map((f) => (typeof f === 'string' ? f.trim() : f)) : value),
    __metadata("design:type", Array)
], UpdatePlanDto.prototype, "features", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    Transform(({ value }) => {
        if (value === 'true' || value === 1 || value === '1')
            return true;
        if (value === 'false' || value === 0 || value === '0')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UpdatePlanDto.prototype, "is_free", void 0);
__decorate([
    IsOptional(),
    IsFreeOffer(),
    __metadata("design:type", Object)
], UpdatePlanDto.prototype, "free_offer", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    Transform(({ value }) => {
        if (value === 'true' || value === 1 || value === '1')
            return true;
        if (value === 'false' || value === 0 || value === '0')
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], UpdatePlanDto.prototype, "is_active", void 0);
//# sourceMappingURL=update-plan.dto.js.map