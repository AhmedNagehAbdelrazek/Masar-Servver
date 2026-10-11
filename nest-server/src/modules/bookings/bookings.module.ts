import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { MapsModule } from '../maps/maps.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { TripsModule } from '../trips/trips.module.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { DelayService } from './delay.service.js';

@Module({
  imports: [TripsModule, MapsModule, NotificationsModule, SubscriptionsModule, RealtimeModule],
  controllers: [BookingsController],
  providers: [BookingsService, DelayService],
  exports: [BookingsService, DelayService],
})
export class BookingsModule {}
