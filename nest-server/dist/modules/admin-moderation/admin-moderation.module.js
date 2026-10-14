var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { DriverModule } from '../driver/driver.module.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { AdminPenaltiesController } from './admin-penalties.controller.js';
import { AdminUsersController } from './admin-users.controller.js';
let AdminModerationModule = class AdminModerationModule {
};
AdminModerationModule = __decorate([
    Module({
        imports: [DriverModule],
        controllers: [AdminUsersController, AdminPenaltiesController],
        providers: [AdminModerationService],
        exports: [AdminModerationService],
    })
], AdminModerationModule);
export { AdminModerationModule };
//# sourceMappingURL=admin-moderation.module.js.map