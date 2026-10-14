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
import { ArrayMinSize, IsArray, IsDateString, IsDefined, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, Validate, ValidatorConstraint, ValidateNested, } from 'class-validator';
let AbsentFieldRule = class AbsentFieldRule {
    validate(value) {
        return value === undefined;
    }
    defaultMessage(args) {
        return `${String(args.property)} cannot be changed during verification`;
    }
};
AbsentFieldRule = __decorate([
    ValidatorConstraint({ name: 'absentField', async: false })
], AbsentFieldRule);
function DocumentId() {
    return (target, propertyKey) => {
        IsOptional()(target, propertyKey);
        IsInt()(target, propertyKey);
        Min(1)(target, propertyKey);
        Type(() => Number)(target, propertyKey);
    };
}
class VerificationVehicleDto {
    manufacturer;
    model;
    vehicle_type;
    model_year;
    plate_number;
    code_number;
    color;
    seats;
    registration_doc_front;
    registration_doc_back;
    vehicle_photo_front;
    vehicle_photo_back;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(80),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], VerificationVehicleDto.prototype, "manufacturer", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(80),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], VerificationVehicleDto.prototype, "model", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback']),
    __metadata("design:type", String)
], VerificationVehicleDto.prototype, "vehicle_type", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], VerificationVehicleDto.prototype, "model_year", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], VerificationVehicleDto.prototype, "plate_number", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], VerificationVehicleDto.prototype, "code_number", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], VerificationVehicleDto.prototype, "color", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsInt(),
    Min(1),
    Max(50),
    Type(() => Number),
    __metadata("design:type", Number)
], VerificationVehicleDto.prototype, "seats", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], VerificationVehicleDto.prototype, "registration_doc_front", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], VerificationVehicleDto.prototype, "registration_doc_back", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], VerificationVehicleDto.prototype, "vehicle_photo_front", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], VerificationVehicleDto.prototype, "vehicle_photo_back", void 0);
export class SubmitVerificationDto {
    full_name;
    national_id;
    license_number;
    license_expiry;
    phone;
    user_identification_front;
    user_identification_back;
    lincese_front;
    lincese_back;
    personal_image_with_id;
    vehicle;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], SubmitVerificationDto.prototype, "full_name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], SubmitVerificationDto.prototype, "national_id", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(50),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], SubmitVerificationDto.prototype, "license_number", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], SubmitVerificationDto.prototype, "license_expiry", void 0);
__decorate([
    Validate(AbsentFieldRule),
    __metadata("design:type", Object)
], SubmitVerificationDto.prototype, "phone", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], SubmitVerificationDto.prototype, "user_identification_front", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], SubmitVerificationDto.prototype, "user_identification_back", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], SubmitVerificationDto.prototype, "lincese_front", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], SubmitVerificationDto.prototype, "lincese_back", void 0);
__decorate([
    DocumentId(),
    __metadata("design:type", Number)
], SubmitVerificationDto.prototype, "personal_image_with_id", void 0);
__decorate([
    IsDefined(),
    IsObject(),
    ValidateNested(),
    Type(() => VerificationVehicleDto),
    __metadata("design:type", VerificationVehicleDto)
], SubmitVerificationDto.prototype, "vehicle", void 0);
export class VerificationQueueQuery {
    status;
    search;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['pending', 'approved', 'rejected', 'unverified']),
    __metadata("design:type", String)
], VerificationQueueQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], VerificationQueueQuery.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], VerificationQueueQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], VerificationQueueQuery.prototype, "limit", void 0);
export const VERIFICATION_FIELD_KEYS = [
    'national_id',
    'license',
    'personal_photo',
    'vehicle_registration',
    'vehicle_photo',
    'vehicle_details',
    'personal_details',
];
export class RejectVerificationDto {
    reason;
    fields_to_fix;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsString(),
    MaxLength(2000),
    __metadata("design:type", String)
], RejectVerificationDto.prototype, "reason", void 0);
__decorate([
    IsDefined(),
    IsArray(),
    ArrayMinSize(1),
    IsIn([...VERIFICATION_FIELD_KEYS], { each: true }),
    __metadata("design:type", Array)
], RejectVerificationDto.prototype, "fields_to_fix", void 0);
export class DriverIdParam {
    driver_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], DriverIdParam.prototype, "driver_id", void 0);
export class VehicleIdParam {
    vehicle_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], VehicleIdParam.prototype, "vehicle_id", void 0);
//# sourceMappingURL=verification.dto.js.map