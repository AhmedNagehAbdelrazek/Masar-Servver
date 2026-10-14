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
import { IsDefined, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, } from 'class-validator';
export class AddFavoriteDriverDto {
    driver_id;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsUUID(),
    __metadata("design:type", String)
], AddFavoriteDriverDto.prototype, "driver_id", void 0);
export class FavoriteDriversListQuery {
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], FavoriteDriversListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], FavoriteDriversListQuery.prototype, "limit", void 0);
export class AddFavoriteRouteDto {
    origin_city;
    destination_city;
    label;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsString(),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], AddFavoriteRouteDto.prototype, "origin_city", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsString(),
    MaxLength(120),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], AddFavoriteRouteDto.prototype, "destination_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], AddFavoriteRouteDto.prototype, "label", void 0);
//# sourceMappingURL=favorite.dto.js.map