var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PenaltyService } from '../driver/penalty.service.js';
import { IssuePenaltyDto } from './dto/admin-moderation.dto.js';
let AdminPenaltiesController = class AdminPenaltiesController {
    penalties;
    constructor(penalties) {
        this.penalties = penalties;
    }
    issuePenalty(dto, user) {
        return this.penalties.issue(user?.id ?? '', {
            user_id: dto.user_id,
            type: dto.type,
            reason: dto.reason,
            details: dto.details ?? null,
            complaint_id: dto.complaint_id ?? null,
            ends_at: dto.ends_at ?? null,
        });
    }
};
__decorate([
    Post(),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [IssuePenaltyDto, Object]),
    __metadata("design:returntype", Promise)
], AdminPenaltiesController.prototype, "issuePenalty", null);
AdminPenaltiesController = __decorate([
    Controller('admin/penalties'),
    Roles('admin'),
    __metadata("design:paramtypes", [PenaltyService])
], AdminPenaltiesController);
export { AdminPenaltiesController };
//# sourceMappingURL=admin-penalties.controller.js.map