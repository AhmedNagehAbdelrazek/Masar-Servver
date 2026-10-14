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
import { IsEmail, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested, } from 'class-validator';
class PersonalDataVehicleDto {
    manufacturer;
    model;
    model_year;
    color;
    plate_number;
    total_seats;
}
__decorate([
    IsOptional(),
    IsString(),
    MinLength(2),
    MaxLength(60),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], PersonalDataVehicleDto.prototype, "manufacturer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(1),
    MaxLength(60),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], PersonalDataVehicleDto.prototype, "model", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1990),
    Max(2100),
    Type(() => Number),
    __metadata("design:type", Number)
], PersonalDataVehicleDto.prototype, "model_year", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(40),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], PersonalDataVehicleDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(3),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], PersonalDataVehicleDto.prototype, "plate_number", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(15),
    Type(() => Number),
    __metadata("design:type", Number)
], PersonalDataVehicleDto.prototype, "total_seats", void 0);
export class UpdatePersonalDataDto {
    full_name;
    display_name;
    email;
    phone;
    age;
    avatar_url;
    national_id;
    vehicle;
}
__decorate([
    IsOptional(),
    IsString(),
    MinLength(3),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdatePersonalDataDto.prototype, "full_name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", Object)
], UpdatePersonalDataDto.prototype, "display_name", void 0);
__decorate([
    IsOptional(),
    IsEmail(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", Object)
], UpdatePersonalDataDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsNotEmpty(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdatePersonalDataDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(18),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Object)
], UpdatePersonalDataDto.prototype, "age", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", Object)
], UpdatePersonalDataDto.prototype, "avatar_url", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(5),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdatePersonalDataDto.prototype, "national_id", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    ValidateNested(),
    Type(() => PersonalDataVehicleDto),
    __metadata("design:type", PersonalDataVehicleDto)
], UpdatePersonalDataDto.prototype, "vehicle", void 0);
//# sourceMappingURL=personal-data.dto.js.map