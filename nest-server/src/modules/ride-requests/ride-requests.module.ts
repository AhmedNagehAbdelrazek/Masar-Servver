import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { OffersController } from './offers.controller.js';
import { RideRequestsController } from './ride-requests.controller.js';
import { RideRequestsService } from './ride-requests.service.js';

@Module({
  imports: [NotificationsModule, SubscriptionsModule, RealtimeModule],
  controllers: [RideRequestsController, OffersController],
  providers: [RideRequestsService],
  exports: [RideRequestsService],
})
export class RideRequestsModule {}
