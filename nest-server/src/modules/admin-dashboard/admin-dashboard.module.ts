import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { DriverModule } from '../driver/driver.module.js';

// PrismaService is global (PrismaModule @Global) — no import needed.
@Module({
  imports: [NotificationsModule, DriverModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
