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
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { DriverIdParam, RejectVerificationDto, VehicleIdParam, VerificationQueueQuery, } from './dto/verification.dto.js';
import { VerificationService } from './verification.service.js';
function envelope(data) {
    return { status: 'success', data };
}
let AdminVerificationController = class AdminVerificationController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    getQueue(query) {
        return this.verification.getQueue(query).then(envelope);
    }
    approveDriver(params, user) {
        return this.verification.approveDriver(user?.id ?? '', params.driver_id);
    }
    rejectDriver(params, dto, user) {
        return this.verification.rejectDriver(user?.id ?? '', params.driver_id, dto.reason, dto.fields_to_fix);
    }
    approveVehicle(params, user) {
        return this.verification.approveVehicle(user?.id ?? '', params.vehicle_id);
    }
    rejectVehicle(params, dto, user) {
        return this.verification.rejectVehicle(user?.id ?? '', params.vehicle_id, dto.reason, dto.fields_to_fix);
    }
};
__decorate([
    Get('queue'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerificationQueueQuery]),
    __metadata("design:returntype", Promise)
], AdminVerificationController.prototype, "getQueue", null);
__decorate([
    Post('drivers/:driver_id/approve'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam, Object]),
    __metadata("design:returntype", Promise)
], AdminVerificationController.prototype, "approveDriver", null);
__decorate([
    Post('drivers/:driver_id/reject'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DriverIdParam,
        RejectVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], AdminVerificationController.prototype, "rejectDriver", null);
__decorate([
    Post('vehicles/:vehicle_id/approve'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VehicleIdParam, Object]),
    __metadata("design:returntype", Promise)
], AdminVerificationController.prototype, "approveVehicle", null);
__decorate([
    Post('vehicles/:vehicle_id/reject'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VehicleIdParam,
        RejectVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], AdminVerificationController.prototype, "rejectVehicle", null);
AdminVerificationController = __decorate([
    Controller('admin/verification'),
    Roles('admin'),
    __metadata("design:paramtypes", [VerificationService])
], AdminVerificationController);
export { AdminVerificationController };
//# sourceMappingURL=admin-verification.controller.js.map