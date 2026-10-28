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
import { ArrayMinSize, IsArray, IsDefined, IsIn, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested, registerDecorator, } from 'class-validator';
import { IsLat, IsLng, IsMoney, TrimString } from '../../../common/validators/geo.validators.js';
export function IsFutureDateTime(validationOptions) {
    return function (object, propertyName) {
        registerDecorator({
            name: 'isFutureDateTime',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    if (typeof value !== 'string' || value.trim() === '')
                        return false;
                    const time = Date.parse(value);
                    return Number.isFinite(time) && time > Date.now();
                },
                defaultMessage() {
                    return 'DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE';
                },
            },
        });
    };
}
class WaypointDto {
    stop_name;
    name;
    stop_lat;
    lat;
    stop_lng;
    lng;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], WaypointDto.prototype, "stop_name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], WaypointDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], WaypointDto.prototype, "stop_lat", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], WaypointDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], WaypointDto.prototype, "stop_lng", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], WaypointDto.prototype, "lng", void 0);
class TripPointDto {
    name;
    stop_name;
    lat;
    stop_lat;
    lng;
    stop_lng;
    city;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], TripPointDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], TripPointDto.prototype, "stop_name", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], TripPointDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], TripPointDto.prototype, "stop_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], TripPointDto.prototype, "lng", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], TripPointDto.prototype, "stop_lng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], TripPointDto.prototype, "city", void 0);
class StopInputDto {
    name;
    stop_name;
    city;
    address;
    lat;
    lng;
    stop_lat;
    stop_lng;
    stop_type;
    stop_order;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], StopInputDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], StopInputDto.prototype, "stop_name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], StopInputDto.prototype, "city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], StopInputDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], StopInputDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], StopInputDto.prototype, "lng", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], StopInputDto.prototype, "stop_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], StopInputDto.prototype, "stop_lng", void 0);
__decorate([
    IsOptional(),
    IsIn(['pickup', 'dropoff', 'both']),
    __metadata("design:type", String)
], StopInputDto.prototype, "stop_type", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], StopInputDto.prototype, "stop_order", void 0);
class SeatInputDto {
    seat_number;
    type;
}
__decorate([
    IsDefined(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], SeatInputDto.prototype, "seat_number", void 0);
__decorate([
    IsDefined(),
    IsIn(['driver', 'available', 'unavailable']),
    __metadata("design:type", String)
], SeatInputDto.prototype, "type", void 0);
export class CreateTripDto {
    origin_city;
    origin_area;
    origin_lat;
    origin_lng;
    destination_city;
    destination_area;
    destination_lat;
    destination_lng;
    waypoints;
    pickup_point;
    pickup;
    pickup_location;
    dropoff_point;
    dropoff;
    dropoff_location;
    drop_off_point;
    stops;
    departure_time;
    type_of_trip;
    repeated_days;
    repeated_end_date;
    allowed_type;
    fare_per_seat;
    seats;
    instructions;
    additional_instructions;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "origin_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "origin_area", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "origin_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "origin_lng", void 0);
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "destination_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    TrimString(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "destination_area", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "destination_lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "destination_lng", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => WaypointDto),
    __metadata("design:type", Array)
], CreateTripDto.prototype, "waypoints", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    ValidateNested(),
    Type(() => TripPointDto),
    __metadata("design:type", TripPointDto)
], CreateTripDto.prototype, "pickup_point", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "pickup", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "pickup_location", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    ValidateNested(),
    Type(() => TripPointDto),
    __metadata("design:type", TripPointDto)
], CreateTripDto.prototype, "dropoff_point", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "dropoff", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "dropoff_location", void 0);
__decorate([
    IsOptional(),
    IsObject(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "drop_off_point", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => StopInputDto),
    __metadata("design:type", Array)
], CreateTripDto.prototype, "stops", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsISO8601(),
    IsFutureDateTime(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "departure_time", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsIn(['once', 'repeated']),
    __metadata("design:type", String)
], CreateTripDto.prototype, "type_of_trip", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    IsInt({ each: true }),
    Min(0, { each: true }),
    Max(6, { each: true }),
    __metadata("design:type", Array)
], CreateTripDto.prototype, "repeated_days", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "repeated_end_date", void 0);
__decorate([
    IsOptional(),
    IsIn(['all', 'women_only', 'men_only']),
    __metadata("design:type", String)
], CreateTripDto.prototype, "allowed_type", void 0);
__decorate([
    IsDefined(),
    IsNotEmpty(),
    IsMoney(),
    __metadata("design:type", Object)
], CreateTripDto.prototype, "fare_per_seat", void 0);
__decorate([
    IsDefined(),
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => SeatInputDto),
    __metadata("design:type", Array)
], CreateTripDto.prototype, "seats", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    __metadata("design:type", Array)
], CreateTripDto.prototype, "instructions", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    TrimString(),
    __metadata("design:type", String)
], CreateTripDto.prototype, "additional_instructions", void 0);
class TripAttributeDto {
    attr_key;
    attr_value;
}
__decorate([
    IsOptional(),
    IsIn(['smoking_allowed', 'women_only', 'ac', 'pets', 'luggage', 'music']),
    __metadata("design:type", String)
], TripAttributeDto.prototype, "attr_key", void 0);
__decorate([
    IsOptional(),
    IsIn(['true', 'false', 'yes', 'no']),
    __metadata("design:type", String)
], TripAttributeDto.prototype, "attr_value", void 0);
class TripStopUpdateDto {
    city;
    address;
    lat;
    lng;
    stop_type;
    stop_order;
    estimated_arrival;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], TripStopUpdateDto.prototype, "city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(255),
    TrimString(),
    __metadata("design:type", String)
], TripStopUpdateDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsLat(),
    __metadata("design:type", Object)
], TripStopUpdateDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLng(),
    __metadata("design:type", Object)
], TripStopUpdateDto.prototype, "lng", void 0);
__decorate([
    IsOptional(),
    IsIn(['pickup', 'dropoff', 'both']),
    __metadata("design:type", String)
], TripStopUpdateDto.prototype, "stop_type", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], TripStopUpdateDto.prototype, "stop_order", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], TripStopUpdateDto.prototype, "estimated_arrival", void 0);
export class UpdateTripDto {
    fare_per_seat;
    departure_time;
    arrival_time;
    gender_preference;
    driver_instructions;
    additional_instructions;
    attributes;
    stops;
}
__decorate([
    IsOptional(),
    IsMoney(),
    __metadata("design:type", Object)
], UpdateTripDto.prototype, "fare_per_seat", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    IsFutureDateTime(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "departure_time", void 0);
__decorate([
    IsOptional(),
    IsString(),
    IsISO8601(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "arrival_time", void 0);
__decorate([
    IsOptional(),
    IsIn(['all', 'women_only', 'men_only']),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "gender_preference", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    __metadata("design:type", Array)
], UpdateTripDto.prototype, "driver_instructions", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(1000),
    TrimString(),
    __metadata("design:type", String)
], UpdateTripDto.prototype, "additional_instructions", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => TripAttributeDto),
    __metadata("design:type", Array)
], UpdateTripDto.prototype, "attributes", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => TripStopUpdateDto),
    __metadata("design:type", Array)
], UpdateTripDto.prototype, "stops", void 0);
export class TripIdParam {
    trip_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], TripIdParam.prototype, "trip_id", void 0);
export class TripPassengersQuery {
    status;
}
__decorate([
    IsOptional(),
    IsIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']),
    __metadata("design:type", String)
], TripPassengersQuery.prototype, "status", void 0);
export class TripSearchQuery {
    origin_city;
    destination_city;
    date;
    return_date;
    gender_preference;
    time_from;
    time_to;
    vehicle_type;
    seats;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "origin_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(100),
    TrimString(),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "destination_city", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "date", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "return_date", void 0);
__decorate([
    IsOptional(),
    IsIn(['all', 'women_only', 'men_only']),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "gender_preference", void 0);
__decorate([
    IsOptional(),
    Matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "time_from", void 0);
__decorate([
    IsOptional(),
    Matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "time_to", void 0);
__decorate([
    IsOptional(),
    IsIn(['sedan', 'suv', 'van', 'bus', 'hatchback']),
    __metadata("design:type", String)
], TripSearchQuery.prototype, "vehicle_type", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    Type(() => Number),
    __metadata("design:type", Number)
], TripSearchQuery.prototype, "seats", void 0);
export class CancelTripDto {
    reason;
    note;
}
__decorate([
    IsDefined(),
    IsString(),
    IsNotEmpty(),
    MaxLength(500),
    TrimString(),
    __metadata("design:type", String)
], CancelTripDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    TrimString(),
    __metadata("design:type", String)
], CancelTripDto.prototype, "note", void 0);
export class LockSeatDto {
    seat_number;
    seat_numbers;
}
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], LockSeatDto.prototype, "seat_number", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    ArrayMinSize(1),
    __metadata("design:type", Array)
], LockSeatDto.prototype, "seat_numbers", void 0);
//# sourceMappingURL=create-trip.dto.js.map