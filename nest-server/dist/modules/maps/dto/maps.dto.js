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
import { IsArray, IsDefined, IsIn, IsNumber, IsObject, IsOptional, IsString, IsUUID, } from 'class-validator';
import { IsLat, IsLng } from '../../../common/validators/geo.validators.js';
export class RoutePreviewDto {
    origin_lat;
    origin_lng;
    destination_lat;
    destination_lng;
    origin;
    destination;
    stops;
    departure_time;
}
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], RoutePreviewDto.prototype, "origin_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], RoutePreviewDto.prototype, "origin_lng", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], RoutePreviewDto.prototype, "destination_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], RoutePreviewDto.prototype, "destination_lng", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], RoutePreviewDto.prototype, "origin", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], RoutePreviewDto.prototype, "destination", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], RoutePreviewDto.prototype, "stops", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RoutePreviewDto.prototype, "departure_time", void 0);
export class ReverseGeocodeDto {
    lat;
    lng;
}
__decorate([
    IsDefined(),
    IsNumber(),
    IsLat(),
    Type(() => Number),
    __metadata("design:type", Number)
], ReverseGeocodeDto.prototype, "lat", void 0);
__decorate([
    IsDefined(),
    IsNumber(),
    IsLng(),
    Type(() => Number),
    __metadata("design:type", Number)
], ReverseGeocodeDto.prototype, "lng", void 0);
export class PickupPreviewDto {
    pickup_type;
    pickup_stop_id;
    lat;
    lng;
    pickup_label;
}
__decorate([
    IsOptional(),
    IsIn(['stop', 'custom']),
    __metadata("design:type", String)
], PickupPreviewDto.prototype, "pickup_type", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], PickupPreviewDto.prototype, "pickup_stop_id", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], PickupPreviewDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], PickupPreviewDto.prototype, "lng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], PickupPreviewDto.prototype, "pickup_label", void 0);
export class TripIdParam {
    trip_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], TripIdParam.prototype, "trip_id", void 0);
//# sourceMappingURL=maps.dto.js.map