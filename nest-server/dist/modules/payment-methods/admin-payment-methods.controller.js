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
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, UuidMethodIdParam, } from '../plans/dto/payment-method.dto.js';
import { PlansService } from '../plans/plans.service.js';
let AdminPaymentMethodsController = class AdminPaymentMethodsController {
    plans;
    constructor(plans) {
        this.plans = plans;
    }
    listPaymentMethods() {
        return this.plans.listPaymentMethods().then((methods) => ({ methods }));
    }
    createPaymentMethod(dto, user) {
        return this.plans.createPaymentMethod(dto, user?.id ?? '').then((method) => ({ method }));
    }
    updatePaymentMethod(params, dto, user) {
        return this.plans
            .updatePaymentMethod(params.method_id, dto, user?.id ?? '')
            .then((method) => ({ method }));
    }
    deactivatePaymentMethod(params, user) {
        return this.plans.deactivatePaymentMethod(params.method_id, user?.id ?? '');
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPaymentMethodsController.prototype, "listPaymentMethods", null);
__decorate([
    Post(),
    HttpCode(201),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePaymentMethodDto, Object]),
    __metadata("design:returntype", Promise)
], AdminPaymentMethodsController.prototype, "createPaymentMethod", null);
__decorate([
    Put(':method_id'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UuidMethodIdParam,
        UpdatePaymentMethodDto, Object]),
    __metadata("design:returntype", Promise)
], AdminPaymentMethodsController.prototype, "updatePaymentMethod", null);
__decorate([
    Delete(':method_id'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UuidMethodIdParam, Object]),
    __metadata("design:returntype", Promise)
], AdminPaymentMethodsController.prototype, "deactivatePaymentMethod", null);
AdminPaymentMethodsController = __decorate([
    Controller('admin/payment-methods'),
    Roles('admin'),
    __metadata("design:paramtypes", [PlansService])
], AdminPaymentMethodsController);
export { AdminPaymentMethodsController };
//# sourceMappingURL=admin-payment-methods.controller.js.map