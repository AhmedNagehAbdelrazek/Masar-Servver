var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { IsDefined, IsIn, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, } from 'class-validator';
import { IsLat, IsLng, TrimString } from '../../../common/validators/geo.validators.js';
export class CreateRideRequestDto {
    origin_city;
    destination_city;
    origin_place;
    destination_place;
    origin_lat;
    origin_lng;
    origin_time;
    destination_lat;
    destination_lng;
    arrival_deadline;
    seats_needed;
    max_budget;
    attributes_preferred;
    note;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "origin_city", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "destination_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "origin_place", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "destination_place", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], CreateRideRequestDto.prototype, "origin_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], CreateRideRequestDto.prototype, "origin_lng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "origin_time", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], CreateRideRequestDto.prototype, "destination_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], CreateRideRequestDto.prototype, "destination_lng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "arrival_deadline", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(8),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateRideRequestDto.prototype, "seats_needed", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateRideRequestDto.prototype, "max_budget", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateRideRequestDto.prototype, "attributes_preferred", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    TrimString(),
    __metadata("design:type", String)
], CreateRideRequestDto.prototype, "note", void 0);
export class ListRideRequestsQuery {
    status;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['open', 'offered', 'accepted', 'expired', 'cancelled']),
    __metadata("design:type", String)
], ListRideRequestsQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], ListRideRequestsQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], ListRideRequestsQuery.prototype, "limit", void 0);
export class RequestIdParam {
    request_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], RequestIdParam.prototype, "request_id", void 0);
export class UpdateRideRequestDto {
    action;
    origin_city;
    destination_city;
    origin_time;
    arrival_deadline;
    seats_needed;
    max_budget;
    note;
}
__decorate([
    IsOptional(),
    IsIn(['cancel']),
    __metadata("design:type", String)
], UpdateRideRequestDto.prototype, "action", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], UpdateRideRequestDto.prototype, "origin_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], UpdateRideRequestDto.prototype, "destination_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    __metadata("design:type", String)
], UpdateRideRequestDto.prototype, "origin_time", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    __metadata("design:type", String)
], UpdateRideRequestDto.prototype, "arrival_deadline", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(8),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdateRideRequestDto.prototype, "seats_needed", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], UpdateRideRequestDto.prototype, "max_budget", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    TrimString(),
    __metadata("design:type", String)
], UpdateRideRequestDto.prototype, "note", void 0);
export class CreateOfferDto {
    offered_fare;
    message;
    trip_id;
}
__decorate([
    IsOptional(),
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateOfferDto.prototype, "offered_fare", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    TrimString(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "message", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateOfferDto.prototype, "trip_id", void 0);
export class DecideOfferDto {
    action;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['accept', 'decline']),
    __metadata("design:type", String)
], DecideOfferDto.prototype, "action", void 0);
export class AgreePriceDto {
    agreed_fare;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsNumber(),
    Min(0),
    Type(() => Number),
    __metadata("design:type", Number)
], AgreePriceDto.prototype, "agreed_fare", void 0);
export class OfferIdParam {
    offer_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], OfferIdParam.prototype, "offer_id", void 0);
export class DriverOffersQuery {
    status;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['sent', 'accepted', 'declined', 'expired']),
    __metadata("design:type", String)
], DriverOffersQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], DriverOffersQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], DriverOffersQuery.prototype, "limit", void 0);
export class AttachOfferBody {
    dropoff_place;
    dropoff_deadline;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    __metadata("design:type", String)
], AttachOfferBody.prototype, "dropoff_place", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], AttachOfferBody.prototype, "dropoff_deadline", void 0);
//# sourceMappingURL=ride-request.dto.js.map