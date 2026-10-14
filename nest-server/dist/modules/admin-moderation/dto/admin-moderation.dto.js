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
import { IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, } from 'class-validator';
export class AdminUserListQuery {
    role;
    status;
    page;
    limit;
}
__decorate([
    IsOptional(),
    IsIn(['passenger', 'driver', 'admin', 'support', 'moderator']),
    __metadata("design:type", String)
], AdminUserListQuery.prototype, "role", void 0);
__decorate([
    IsOptional(),
    IsIn(['active', 'warned', 'suspended', 'banned']),
    __metadata("design:type", String)
], AdminUserListQuery.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Type(() => Number),
    __metadata("design:type", Number)
], AdminUserListQuery.prototype, "page", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    Max(100),
    Type(() => Number),
    __metadata("design:type", Number)
], AdminUserListQuery.prototype, "limit", void 0);
export class UserIdParam {
    user_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], UserIdParam.prototype, "user_id", void 0);
export class UpdateUserStatusDto {
    status;
    reason;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    IsIn(['active', 'warned', 'suspended', 'banned']),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "status", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "reason", void 0);
export class ModerateTripDto {
    action;
    reason;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    IsIn(['unpublish', 'block', 'restore']),
    __metadata("design:type", String)
], ModerateTripDto.prototype, "action", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(500),
    __metadata("design:type", String)
], ModerateTripDto.prototype, "reason", void 0);
export class IssuePenaltyDto {
    user_id;
    type;
    reason;
    complaint_id;
    details;
    ends_at;
    confirm_reviewed_log;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], IssuePenaltyDto.prototype, "user_id", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    IsIn(['warning', 'suspension', 'ban']),
    __metadata("design:type", String)
], IssuePenaltyDto.prototype, "type", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    MaxLength(2000),
    __metadata("design:type", String)
], IssuePenaltyDto.prototype, "reason", void 0);
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", String)
], IssuePenaltyDto.prototype, "complaint_id", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MaxLength(4000),
    __metadata("design:type", String)
], IssuePenaltyDto.prototype, "details", void 0);
__decorate([
    IsOptional(),
    IsDateString(),
    __metadata("design:type", String)
], IssuePenaltyDto.prototype, "ends_at", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], IssuePenaltyDto.prototype, "confirm_reviewed_log", void 0);
//# sourceMappingURL=admin-moderation.dto.js.map