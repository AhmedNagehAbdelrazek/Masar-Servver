var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class SetDriverStatusDto {
    status;
}
__decorate([
    IsString(),
    IsIn(['active', 'suspended', 'pending', 'blocked']),
    __metadata("design:type", String)
], SetDriverStatusDto.prototype, "status", void 0);
export class AccountActionDto {
    action;
    reason;
}
__decorate([
    IsString(),
    IsIn(['suspend', 'reactivate', 'unblock']),
    __metadata("design:type", String)
], AccountActionDto.prototype, "action", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    MaxLength(500),
    __metadata("design:type", Object)
], AccountActionDto.prototype, "reason", void 0);
export class RejectDocumentDto {
    reason;
}
__decorate([
    IsOptional(),
    IsString(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    MaxLength(2000),
    __metadata("design:type", Object)
], RejectDocumentDto.prototype, "reason", void 0);
//# sourceMappingURL=admin-actions.dto.js.map