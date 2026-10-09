var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsIn, IsString, Length, Matches } from 'class-validator';
export class RegisterPhoneDto {
    country_code;
    phone;
    role;
}
__decorate([
    IsString(),
    Length(2, 5),
    __metadata("design:type", String)
], RegisterPhoneDto.prototype, "country_code", void 0);
__decorate([
    IsString(),
    Matches(/^[0-9+\s-]{5,20}$/),
    __metadata("design:type", String)
], RegisterPhoneDto.prototype, "phone", void 0);
__decorate([
    IsIn(['passenger', 'driver']),
    __metadata("design:type", String)
], RegisterPhoneDto.prototype, "role", void 0);
//# sourceMappingURL=register-phone.dto.js.map