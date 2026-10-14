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
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { AdminUserListQuery, UpdateUserStatusDto, UserIdParam, } from './dto/admin-moderation.dto.js';
let AdminUsersController = class AdminUsersController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    listUsers(query) {
        return this.admin.listUsers(query);
    }
    updateUserStatus(params, dto, user) {
        return this.admin.updateUserStatus(user?.id ?? '', params.user_id, dto);
    }
};
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminUserListQuery]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "listUsers", null);
__decorate([
    Put(':user_id'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserIdParam,
        UpdateUserStatusDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updateUserStatus", null);
AdminUsersController = __decorate([
    Controller('admin/users'),
    Roles('admin'),
    __metadata("design:paramtypes", [AdminModerationService])
], AdminUsersController);
export { AdminUsersController };
//# sourceMappingURL=admin-users.controller.js.map