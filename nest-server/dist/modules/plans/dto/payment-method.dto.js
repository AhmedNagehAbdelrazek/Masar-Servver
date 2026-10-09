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
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
export const PAYMENT_METHOD_TYPES = ['bank_account', 'e-wallet', 'mobile_money'];
export class CreatePaymentMethodDto {
    name;
    account_number;
    type;
    email;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(100),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], CreatePaymentMethodDto.prototype, "name", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(50),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], CreatePaymentMethodDto.prototype, "account_number", void 0);
__decorate([
    IsIn([...PAYMENT_METHOD_TYPES]),
    __metadata("design:type", Object)
], CreatePaymentMethodDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    Transform(({ value }) => (value === '' ? null : value)),
    __metadata("design:type", Object)
], CreatePaymentMethodDto.prototype, "email", void 0);
export class UpdatePaymentMethodDto {
    name;
    account_number;
    type;
    email;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdatePaymentMethodDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdatePaymentMethodDto.prototype, "account_number", void 0);
__decorate([
    IsOptional(),
    IsIn([...PAYMENT_METHOD_TYPES]),
    __metadata("design:type", Object)
], UpdatePaymentMethodDto.prototype, "type", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    Transform(({ value }) => (value === '' ? null : value)),
    __metadata("design:type", Object)
], UpdatePaymentMethodDto.prototype, "email", void 0);
export class UuidMethodIdParam {
    method_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], UuidMethodIdParam.prototype, "method_id", void 0);
//# sourceMappingURL=payment-method.dto.js.map