import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { BalanceService } from './balance.service.js';

@Module({
  imports: [NotificationsModule],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
