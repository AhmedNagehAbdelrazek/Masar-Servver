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
import { Body, Controller, Get, HttpCode, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { DriverVerificationService } from './driver-verification.service.js';
import { SubmitVerificationDto } from './dto/verification.dto.js';
function envelope(data) {
    return { status: 'success', data };
}
let DriverVerificationController = class DriverVerificationController {
    verification;
    constructor(verification) {
        this.verification = verification;
    }
    getStatus(user) {
        return this.verification.getStatus(user?.id ?? '').then(envelope);
    }
    getSubmission(user) {
        return this.verification.getSubmission(user?.id ?? '').then(envelope);
    }
    submit(dto, user) {
        return this.verification.submitOrResubmit(user?.id ?? '', dto).then(envelope);
    }
};
__decorate([
    Get('verification-status'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverVerificationController.prototype, "getStatus", null);
__decorate([
    Get('verification'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverVerificationController.prototype, "getSubmission", null);
__decorate([
    Put('verification'),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SubmitVerificationDto, Object]),
    __metadata("design:returntype", Promise)
], DriverVerificationController.prototype, "submit", null);
DriverVerificationController = __decorate([
    Controller('driver'),
    Roles('driver'),
    __metadata("design:paramtypes", [DriverVerificationService])
], DriverVerificationController);
export { DriverVerificationController };
//# sourceMappingURL=driver-verification.controller.js.map