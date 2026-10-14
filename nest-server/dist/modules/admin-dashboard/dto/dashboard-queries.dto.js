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
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
class PaginationQuery {
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], PaginationQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], PaginationQuery.prototype, "limit", void 0);
export class RecentTripsQuery extends PaginationQuery {
    status;
}
__decorate([
    IsOptional(),
    IsIn(['published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled', 'canceled']),
    __metadata("design:type", String)
], RecentTripsQuery.prototype, "status", void 0);
export class DriversListQuery extends PaginationQuery {
    search;
    status;
    registration_from;
    registration_to;
    sort_by;
    sort_order;
}
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], DriversListQuery.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsIn(['active', 'suspended', 'pending', 'blocked']),
    __metadata("design:type", String)
], DriversListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Matches(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], DriversListQuery.prototype, "registration_from", void 0);
__decorate([
    IsOptional(),
    Matches(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], DriversListQuery.prototype, "registration_to", void 0);
__decorate([
    IsOptional(),
    IsIn(['created_at', 'full_name', 'avg_rating']),
    __metadata("design:type", String)
], DriversListQuery.prototype, "sort_by", void 0);
__decorate([
    IsOptional(),
    IsIn(['asc', 'desc']),
    __metadata("design:type", String)
], DriversListQuery.prototype, "sort_order", void 0);
export class DriverTripsQuery extends PaginationQuery {
    status;
    month;
}
__decorate([
    IsOptional(),
    IsIn(['all', 'pending', 'completed', 'canceled', 'cancelled', 'active']),
    __metadata("design:type", String)
], DriverTripsQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    Matches(/^\d{4}-(0[1-9]|1[0-2])$/),
    __metadata("design:type", String)
], DriverTripsQuery.prototype, "month", void 0);
export class ReservationsQuery extends PaginationQuery {
    status;
}
__decorate([
    IsOptional(),
    IsIn(['pending', 'confirmed', 'cancelled', 'canceled', 'completed', 'no_show']),
    __metadata("design:type", String)
], ReservationsQuery.prototype, "status", void 0);
//# sourceMappingURL=dashboard-queries.dto.js.map