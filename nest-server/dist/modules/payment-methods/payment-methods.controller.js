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
let PaymentMethodsController = class PaymentMethodsController {
    plans;
    constructor(plans) {
        this.plans = plans;
    }
    listActiveMethods() {
        return this.plans.getActivePaymentMethods().then((methods) => ({ methods }));
    }
    listAllMethods() {
        return this.plans.listPaymentMethods().then((methods) => ({ methods }));
    }
    createMethod(dto, user) {
        return this.plans.createPaymentMethod(dto, user?.id ?? '').then((payment_method) => ({
            payment_method,
        }));
    }
    updateMethod(params, dto, user) {
        return this.plans
            .updatePaymentMethod(params.method_id, dto, user?.id ?? '')
            .then((payment_method) => ({ payment_method }));
    }
    deactivateMethod(methodId, user) {
        return this.plans.deactivatePaymentMethod(methodId, user?.id ?? '');
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "listActiveMethods", null);
__decorate([
    Get('all'),
    Roles('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "listAllMethods", null);
__decorate([
    Post(),
    HttpCode(201),
    Roles('admin'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePaymentMethodDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "createMethod", null);
__decorate([
    Put(':method_id'),
    Roles('admin'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UuidMethodIdParam,
        UpdatePaymentMethodDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "updateMethod", null);
__decorate([
    Delete(':method_id'),
    Roles('admin'),
    __param(0, Param('method_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentMethodsController.prototype, "deactivateMethod", null);
PaymentMethodsController = __decorate([
    Controller('payment-methods'),
    __metadata("design:paramtypes", [PlansService])
], PaymentMethodsController);
export { PaymentMethodsController };
//# sourceMappingURL=payment-methods.controller.js.map