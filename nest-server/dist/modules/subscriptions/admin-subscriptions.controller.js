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
import { AdminSubscriptionListQuery, RejectSubscriptionDto, SubscriptionIdParam, } from './dto/subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';
let AdminSubscriptionsController = class AdminSubscriptionsController {
    subscriptions;
    constructor(subscriptions) {
        this.subscriptions = subscriptions;
    }
    getStats() {
        return this.subscriptions.getStats();
    }
    listPending(query) {
        return this.subscriptions.listPending(query).then((pending) => ({ pending }));
    }
    getDetail(params) {
        return this.subscriptions.getDetail(params.subscription_id);
    }
    approveSubscription(params, user) {
        return this.subscriptions.approve(params.subscription_id, user?.id ?? '');
    }
    rejectSubscription(params, dto, user) {
        return this.subscriptions.reject(params.subscription_id, dto.reason, user?.id ?? '');
    }
};
__decorate([
    Get('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "getStats", null);
__decorate([
    Get('pending'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AdminSubscriptionListQuery]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "listPending", null);
__decorate([
    Get(':subscription_id'),
    __param(0, Param()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SubscriptionIdParam]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "getDetail", null);
__decorate([
    Post(':subscription_id/approve'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SubscriptionIdParam, Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "approveSubscription", null);
__decorate([
    Post(':subscription_id/reject'),
    HttpCode(200),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SubscriptionIdParam,
        RejectSubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "rejectSubscription", null);
AdminSubscriptionsController = __decorate([
    Controller('admin/subscriptions'),
    Roles('admin'),
    __metadata("design:paramtypes", [SubscriptionsService])
], AdminSubscriptionsController);
export { AdminSubscriptionsController };
//# sourceMappingURL=admin-subscriptions.controller.js.map