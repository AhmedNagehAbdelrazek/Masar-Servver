var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller.js';
import { DriverService } from './driver.service.js';
let DriverModule = class DriverModule {
};
DriverModule = __decorate([
    Module({
        controllers: [DriverController],
        providers: [DriverService]
    })
], DriverModule);
export { DriverModule };
//# sourceMappingURL=driver.module.js.map