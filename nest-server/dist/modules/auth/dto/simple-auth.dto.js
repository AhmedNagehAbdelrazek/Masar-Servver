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
import { IsDefined, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class PhoneDto {
    phone;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], PhoneDto.prototype, "phone", void 0);
export class ResendOtpDto extends PhoneDto {
    purpose;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['register', 'forgot_password']),
    __metadata("design:type", String)
], ResendOtpDto.prototype, "purpose", void 0);
export class RefreshDto {
    refresh_token;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    __metadata("design:type", String)
], RefreshDto.prototype, "refresh_token", void 0);
export class LogoutDto {
    refresh_token;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], LogoutDto.prototype, "refresh_token", void 0);
//# sourceMappingURL=simple-auth.dto.js.map