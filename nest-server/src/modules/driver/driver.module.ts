import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { BalanceModule } from '../balance/balance.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
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

@Module({
  imports: [NotificationsModule, BalanceModule, RealtimeModule],
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
export class DriverModule {}
