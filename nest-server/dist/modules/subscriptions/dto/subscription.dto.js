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
import { IsBoolean, IsDefined, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
export class CreateSubscriptionDto {
    plan_id;
    payment_method_id;
    screenshot_id;
    resubmit;
}
__decorate([
    IsDefined(),
    IsUUID(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "plan_id", void 0);
__decorate([
    IsDefined(),
    IsUUID(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "payment_method_id", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateSubscriptionDto.prototype, "screenshot_id", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    Transform(({ value }) => {
        if (value === 'true' || value === '1' || value === 1)
            return true;
        if (value === 'false' || value === '0' || value === 0)
            return false;
        return value;
    }),
    __metadata("design:type", Boolean)
], CreateSubscriptionDto.prototype, "resubmit", void 0);
export class RejectSubscriptionDto {
    reason;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(500),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], RejectSubscriptionDto.prototype, "reason", void 0);
export class SubscriptionIdParam {
    subscription_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], SubscriptionIdParam.prototype, "subscription_id", void 0);
export class AdminSubscriptionListQuery {
    search;
    status;
    plan_id;
    from;
    to;
    sort;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], AdminSubscriptionListQuery.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsIn(['pending_approval', 'active', 'rejected', 'cancelled', 'expired', 'all']),
    __metadata("design:type", String)
], AdminSubscriptionListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], AdminSubscriptionListQuery.prototype, "plan_id", void 0);
__decorate([
    IsOptional(),
    Matches(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], AdminSubscriptionListQuery.prototype, "from", void 0);
__decorate([
    IsOptional(),
    Matches(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], AdminSubscriptionListQuery.prototype, "to", void 0);
__decorate([
    IsOptional(),
    IsIn(['newest', 'oldest']),
    __metadata("design:type", String)
], AdminSubscriptionListQuery.prototype, "sort", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], AdminSubscriptionListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], AdminSubscriptionListQuery.prototype, "limit", void 0);
//# sourceMappingURL=subscription.dto.js.map