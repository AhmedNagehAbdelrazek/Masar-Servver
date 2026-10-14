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
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UuidPlanIdParam } from './dto/plan-id.param.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { PlansService } from './plans.service.js';
let AdminPlansController = class AdminPlansController {
    plans;
    constructor(plans) {
        this.plans = plans;
    }
    listPlans() {
        return this.plans.listPlans().then((plans) => ({ plans }));
    }
    getFreePlan() {
        return this.plans.getFreePlan().then((plan) => ({ plan }));
    }
    updateFreePlan(dto, user) {
        return this.plans.updateFreePlan(dto, user?.id ?? '').then((plan) => ({ plan }));
    }
    createPlan(dto, user) {
        return this.plans.createPlan(dto, user?.id ?? '').then((plan) => ({ plan }));
    }
    updatePlan(params, dto, user) {
        return this.plans.updatePlan(params.plan_id, dto, user?.id ?? '').then((plan) => ({ plan }));
    }
    deactivatePlan(planId, user) {
        return this.plans.deactivatePlan(planId, user?.id ?? '');
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPlansController.prototype, "listPlans", null);
__decorate([
    Get('free'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPlansController.prototype, "getFreePlan", null);
__decorate([
    Put('free'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], AdminPlansController.prototype, "updateFreePlan", null);
__decorate([
    Post(),
    HttpCode(201),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], AdminPlansController.prototype, "createPlan", null);
__decorate([
    Put(':plan_id'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UuidPlanIdParam,
        UpdatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], AdminPlansController.prototype, "updatePlan", null);
__decorate([
    Delete(':plan_id'),
    __param(0, Param('plan_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminPlansController.prototype, "deactivatePlan", null);
AdminPlansController = __decorate([
    Controller('admin/plans'),
    Roles('admin'),
    __metadata("design:paramtypes", [PlansService])
], AdminPlansController);
export { AdminPlansController };
//# sourceMappingURL=admin-plans.controller.js.map