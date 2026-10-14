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
import { ArrayMinSize, IsArray, IsDefined, IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, } from 'class-validator';
import { IsLat, IsLng, TrimString } from '../../../common/validators/geo.validators.js';
export class CreateBookingDto {
    trip_id;
    seat_number;
    seat_numbers;
    seats;
    agreed_fare;
    pickup_point;
    pick_up_point;
    pickup;
    drop_off_point;
    dropoff_point;
    dropoff;
    dropOffPoint;
    pickup_type;
    pickup_stop_id;
    dropoff_place;
    dropoff_deadline;
    pickup_label;
    label;
}
__decorate([
    IsDefined(),
    IsUUID(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "trip_id", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "seat_number", void 0);
__decorate([
    IsDefined(),
    IsArray(),
    ArrayMinSize(1),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "seat_numbers", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Type(() => Number),
    __metadata("design:type", Number)
], CreateBookingDto.prototype, "seats", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "agreed_fare", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "pickup_point", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "pick_up_point", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "pickup", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "drop_off_point", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "dropoff_point", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "dropoff", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Object)
], CreateBookingDto.prototype, "dropOffPoint", void 0);
__decorate([
    IsOptional(),
    IsIn(['stop', 'custom']),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickup_type", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickup_stop_id", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "dropoff_place", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "dropoff_deadline", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "pickup_label", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "label", void 0);
export class PassengerBookingListQuery {
    status;
    trip_id;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
    __metadata("design:type", String)
], PassengerBookingListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], PassengerBookingListQuery.prototype, "trip_id", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], PassengerBookingListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], PassengerBookingListQuery.prototype, "limit", void 0);
export class DriverBookingListQuery {
    status;
    date_from;
    date_to;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
    __metadata("design:type", String)
], DriverBookingListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], DriverBookingListQuery.prototype, "date_from", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], DriverBookingListQuery.prototype, "date_to", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], DriverBookingListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], DriverBookingListQuery.prototype, "limit", void 0);
export class BookingIdParam {
    booking_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], BookingIdParam.prototype, "booking_id", void 0);
export class EditPickupDto {
    pickup_type;
    pickup_stop_id;
    lat;
    lng;
    pickup_label;
    label;
}
__decorate([
    IsOptional(),
    IsIn(['stop', 'custom']),
    __metadata("design:type", String)
], EditPickupDto.prototype, "pickup_type", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], EditPickupDto.prototype, "pickup_stop_id", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], EditPickupDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], EditPickupDto.prototype, "lng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], EditPickupDto.prototype, "pickup_label", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], EditPickupDto.prototype, "label", void 0);
export class ReportDelayDto {
    party;
    delay_minutes;
    reason;
}
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['driver', 'passenger']),
    __metadata("design:type", String)
], ReportDelayDto.prototype, "party", void 0);
__decorate([
    IsDefined(),
    IsInt(),
    Min(1),
    Max(720),
    Type(() => Number),
    __metadata("design:type", Number)
], ReportDelayDto.prototype, "delay_minutes", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    TrimString(),
    __metadata("design:type", String)
], ReportDelayDto.prototype, "reason", void 0);
export class DelayListQuery {
    party;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['driver', 'passenger']),
    __metadata("design:type", String)
], DelayListQuery.prototype, "party", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], DelayListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], DelayListQuery.prototype, "limit", void 0);
//# sourceMappingURL=booking.dto.js.map