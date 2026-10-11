import { Module } from '@nestjs/common';
import { DriverModule } from '../driver/driver.module.js';
import { AdminModerationService } from './admin-moderation.service.js';
import { AdminPenaltiesController } from './admin-penalties.controller.js';
import { AdminUsersController } from './admin-users.controller.js';

// Wave 7 admin surface: complaints live in ComplaintsModule
// (AdminComplaintsController) and trip moderation lives in TripsModule
// (AdminTripController) — this module must NOT re-register those paths.
@Module({
  imports: [DriverModule],
  controllers: [AdminUsersController, AdminPenaltiesController],
  providers: [AdminModerationService],
  exports: [AdminModerationService],
})
export class AdminModerationModule {}
