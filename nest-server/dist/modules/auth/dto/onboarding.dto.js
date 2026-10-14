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
import { IsDefined, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength, } from 'class-validator';
import { IsModelYear } from '../../../common/validators/model-year.validator.js';
export class OnboardingProfileDto {
    fullName;
    age;
    gender;
    userIdentificationFront;
    userIdentificationBack;
    linceseFront;
    linceseBack;
    personalImageWithId;
    nationalID;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "fullName", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Min(18),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingProfileDto.prototype, "age", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['male', 'female']),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "gender", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingProfileDto.prototype, "userIdentificationFront", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingProfileDto.prototype, "userIdentificationBack", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingProfileDto.prototype, "linceseFront", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingProfileDto.prototype, "linceseBack", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingProfileDto.prototype, "personalImageWithId", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MinLength(5),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingProfileDto.prototype, "nationalID", void 0);
export class OnboardingPassengerProfileDto {
    fullname;
    national_id;
    age;
    home_address;
    gender;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingPassengerProfileDto.prototype, "fullname", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MinLength(5),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingPassengerProfileDto.prototype, "national_id", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Min(18),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingPassengerProfileDto.prototype, "age", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingPassengerProfileDto.prototype, "home_address", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['male', 'female']),
    __metadata("design:type", String)
], OnboardingPassengerProfileDto.prototype, "gender", void 0);
export class OnboardingVehicleDto {
    vehicleType;
    manufacturer;
    model;
    modelYear;
    color;
    plateNumber;
    codeNumber;
    seats;
    registrationDocFront;
    registrationDocBack;
    vehiclePhotoFront;
    vehiclePhotoBack;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback']),
    __metadata("design:type", String)
], OnboardingVehicleDto.prototype, "vehicleType", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(80),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingVehicleDto.prototype, "manufacturer", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(80),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingVehicleDto.prototype, "model", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Type(() => Number),
    IsModelYear(),
    __metadata("design:type", Number)
], OnboardingVehicleDto.prototype, "modelYear", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingVehicleDto.prototype, "color", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingVehicleDto.prototype, "plateNumber", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], OnboardingVehicleDto.prototype, "codeNumber", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Min(1),
    Max(50),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingVehicleDto.prototype, "seats", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingVehicleDto.prototype, "registrationDocFront", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingVehicleDto.prototype, "registrationDocBack", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingVehicleDto.prototype, "vehiclePhotoFront", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], OnboardingVehicleDto.prototype, "vehiclePhotoBack", void 0);
//# sourceMappingURL=onboarding.dto.js.map