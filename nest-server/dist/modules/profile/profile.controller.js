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
import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UpdatePassengerProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';
let ProfileController = class ProfileController {
    profile;
    constructor(profile) {
        this.profile = profile;
    }
    getMyProfile(user) {
        return this.profile.getMyProfile(user?.id ?? '');
    }
    updateMyProfile(dto, user) {
        return this.profile.updateMyProfile(user?.id ?? '', dto);
    }
    getAccountSummary(user) {
        return this.profile.getAccountSummary(user?.id ?? '');
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getMyProfile", null);
__decorate([
    Put(),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdatePassengerProfileDto, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateMyProfile", null);
__decorate([
    Get('account-summary'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getAccountSummary", null);
ProfileController = __decorate([
    Controller('profile/passenger'),
    Roles('passenger'),
    __metadata("design:paramtypes", [ProfileService])
], ProfileController);
export { ProfileController };
//# sourceMappingURL=profile.controller.js.map