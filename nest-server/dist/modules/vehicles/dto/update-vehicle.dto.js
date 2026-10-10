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
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { IsModelYear } from '../../../common/validators/model-year.validator.js';
export class UpdateVehicleDto {
    manufacturer;
    model;
    vehicle_type;
    model_year;
    plate_number;
    code_number;
    color;
    seats;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(80),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "manufacturer", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(80),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "model", void 0);
__decorate([
    IsOptional(),
    IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback']),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "vehicle_type", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Type(() => Number),
    IsModelYear(),
    __metadata("design:type", Number)
], UpdateVehicleDto.prototype, "model_year", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "plate_number", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(20),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "code_number", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(30),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], UpdateVehicleDto.prototype, "color", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(50),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdateVehicleDto.prototype, "seats", void 0);
//# sourceMappingURL=update-vehicle.dto.js.map