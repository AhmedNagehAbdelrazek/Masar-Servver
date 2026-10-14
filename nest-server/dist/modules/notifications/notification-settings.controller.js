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
import { GroupedSettingsDto } from './dto/grouped-settings.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { NotificationSettingsService } from './notification-settings.service.js';
let NotificationSettingsController = class NotificationSettingsController {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    getNotificationSettings(user) {
        return this.settings.getSettings(user?.id ?? '').then((settings) => ({ settings }));
    }
    updateNotificationSettings(dto, user) {
        return this.settings.updateSettings(user?.id ?? '', dto.settings);
    }
    getGroupedSettings(user) {
        return this.settings.getGroupedSettings(user?.id ?? '');
    }
    updateGroupedSettings(dto, user) {
        return this.settings.updateGroupedSettings(user?.id ?? '', dto);
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationSettingsController.prototype, "getNotificationSettings", null);
__decorate([
    Put(),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationSettingsController.prototype, "updateNotificationSettings", null);
__decorate([
    Get('grouped'),
    Roles('driver'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationSettingsController.prototype, "getGroupedSettings", null);
__decorate([
    Put('grouped'),
    Roles('driver'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GroupedSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], NotificationSettingsController.prototype, "updateGroupedSettings", null);
NotificationSettingsController = __decorate([
    Controller('settings/notifications'),
    __metadata("design:paramtypes", [NotificationSettingsService])
], NotificationSettingsController);
export { NotificationSettingsController };
//# sourceMappingURL=notification-settings.controller.js.map