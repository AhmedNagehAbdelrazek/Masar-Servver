var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PlansService } from './plans.service.js';
let PlansController = class PlansController {
    plans;
    constructor(plans) {
        this.plans = plans;
    }
    listActivePlans() {
        return this.plans.getActivePlans().then((plans) => ({ plans }));
    }
};
__decorate([
    Get(),
    Roles('driver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "listActivePlans", null);
PlansController = __decorate([
    Controller('plans'),
    __metadata("design:paramtypes", [PlansService])
], PlansController);
export { PlansController };
//# sourceMappingURL=plans.controller.js.map