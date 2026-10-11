import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { BalanceModule } from '../balance/balance.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AdminSubscriptionsController } from './admin-subscriptions.controller.js';
import { CommissionService } from './commission.service.js';
import { HomeService } from './home.service.js';
import { RecentSearchService } from './recent-search.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

// HomeService + RecentSearchService live here (home reads subscriptions;
// same-module injection avoids forwardRef cycles).
@Module({
  imports: [BalanceModule, NotificationsModule, RealtimeModule],
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService, CommissionService, HomeService, RecentSearchService],
  exports: [SubscriptionsService, CommissionService, HomeService, RecentSearchService],
})
export class SubscriptionsModule {}
