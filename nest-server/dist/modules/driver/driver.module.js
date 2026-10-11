var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { BalanceModule } from '../balance/balance.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { AdminVerificationController } from './admin-verification.controller.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { DeletionService } from './deletion.service.js';
import { DriverController } from './driver.controller.js';
import { DriverProfileService } from './driver-profile.service.js';
import { DriverVerificationController } from './driver-verification.controller.js';
import { DriverVerificationService } from './driver-verification.service.js';
import { DriverService } from './driver.service.js';
import { EarningsService } from './earnings.service.js';
import { EnforcementService } from './enforcement.service.js';
import { PenaltyService } from './penalty.service.js';
import { PersonalDataService } from './personal-data.service.js';
import { StatsService } from './stats.service.js';
import { VerificationService } from './verification.service.js';
let DriverModule = class DriverModule {
};
DriverModule = __decorate([
    Module({
        imports: [NotificationsModule, BalanceModule, RealtimeModule, SubscriptionsModule],
        controllers: [
            DriverController,
            DashboardController,
            DriverVerificationController,
            AdminVerificationController,
        ],
        providers: [
            DriverService,
            DriverProfileService,
            PersonalDataService,
            DeletionService,
            PenaltyService,
            EnforcementService,
            EarningsService,
            StatsService,
            DashboardService,
            DriverVerificationService,
            VerificationService,
        ],
        exports: [DriverService, VerificationService, PenaltyService, EnforcementService],
    })
], DriverModule);
export { DriverModule };
//# sourceMappingURL=driver.module.js.map