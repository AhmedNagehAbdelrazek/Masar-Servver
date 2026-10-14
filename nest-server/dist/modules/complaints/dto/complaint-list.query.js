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
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { COMPLAINT_CATEGORIES } from './create-complaint.dto.js';
export const COMPLAINT_STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'];
export class DriverComplaintListQuery {
    direction;
    status;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['filed', 'against']),
    __metadata("design:type", String)
], DriverComplaintListQuery.prototype, "direction", void 0);
__decorate([
    IsOptional(),
    IsIn([...COMPLAINT_STATUSES]),
    __metadata("design:type", Object)
], DriverComplaintListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], DriverComplaintListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], DriverComplaintListQuery.prototype, "limit", void 0);
export class AdminComplaintListQuery {
    status;
    category;
    search;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn([...COMPLAINT_STATUSES]),
    __metadata("design:type", Object)
], AdminComplaintListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsIn([...COMPLAINT_CATEGORIES]),
    __metadata("design:type", Object)
], AdminComplaintListQuery.prototype, "category", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(120),
    __metadata("design:type", String)
], AdminComplaintListQuery.prototype, "search", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], AdminComplaintListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], AdminComplaintListQuery.prototype, "limit", void 0);
//# sourceMappingURL=complaint-list.query.js.map