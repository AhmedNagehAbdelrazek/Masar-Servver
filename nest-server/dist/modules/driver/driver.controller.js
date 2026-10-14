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
import { Body, Controller, Get, HttpCode, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { EarningsQuery, PenaltyListQuery } from './dto/driver-query.dto.js';
import { UpdatePersonalDataDto } from './dto/personal-data.dto.js';
import { DriverService } from './driver.service.js';
let DriverController = class DriverController {
    driver;
    constructor(driver) {
        this.driver = driver;
    }
    getProfile(user) {
        return this.driver.getProfile(user?.id ?? '');
    }
    getFullProfile(user) {
        return this.driver.getFullProfile(user?.id ?? '');
    }
    getPersonalData(user) {
        return this.driver.getPersonalData(user?.id ?? '');
    }
    updatePersonalData(dto, user) {
        return this.driver.updatePersonalData(user?.id ?? '', dto);
    }
    getAccountStatus(user) {
        return this.driver.getAccountStatus(user?.id ?? '');
    }
    requestDeleteAccount(body, user) {
        return this.driver.requestDeleteAccount(user?.id ?? '', body ?? {});
    }
    cancelDeleteAccount(user) {
        return this.driver.cancelDeleteAccount(user?.id ?? '');
    }
    getPenalties(query, user) {
        return this.driver.getPenalties(user?.id ?? '', query);
    }
    getEarnings(query, user) {
        return this.driver.getEarnings(user?.id ?? '', query);
    }
    getHome(user) {
        return this.driver.getHome(user?.id ?? '');
    }
    getSubscription(user) {
        return this.driver.getSubscription(user?.id ?? '');
    }
    getStats(user) {
        return this.driver.getStats(user?.id ?? '');
    }
};
__decorate([
    Get('profile'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getProfile", null);
__decorate([
    Get('profile/full'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getFullProfile", null);
__decorate([
    Get('personal-data'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getPersonalData", null);
__decorate([
    Put('personal-data'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdatePersonalDataDto, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updatePersonalData", null);
__decorate([
    Get('account-status'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getAccountStatus", null);
__decorate([
    Post('delete-account'),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "requestDeleteAccount", null);
__decorate([
    Post('delete-account/cancel'),
    HttpCode(200),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "cancelDeleteAccount", null);
__decorate([
    Get('penalties'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PenaltyListQuery, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getPenalties", null);
__decorate([
    Get('earnings'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [EarningsQuery, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getEarnings", null);
__decorate([
    Get('home'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getHome", null);
__decorate([
    Get('subscription'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getSubscription", null);
__decorate([
    Get('stats'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getStats", null);
DriverController = __decorate([
    Controller('driver'),
    Roles('driver'),
    __metadata("design:paramtypes", [DriverService])
], DriverController);
export { DriverController };
//# sourceMappingURL=driver.controller.js.map