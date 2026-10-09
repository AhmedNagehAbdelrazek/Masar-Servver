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
import { Public } from '../../common/decorators/public.decorator.js';
let HealthController = class HealthController {
    healthz() {
        return { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() };
    }
    realtime() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
};
__decorate([
    Get('healthz'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "healthz", null);
__decorate([
    Get('health/realtime'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "realtime", null);
HealthController = __decorate([
    Public(),
    Controller()
], HealthController);
export { HealthController };
//# sourceMappingURL=health.controller.js.map