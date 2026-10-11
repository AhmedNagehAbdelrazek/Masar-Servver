import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { MapsModule } from '../maps/maps.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { RideRequestsModule } from '../ride-requests/ride-requests.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { AdminTripController } from './admin-trip.controller.js';
import { SeatLockController } from './seat-lock.controller.js';
import { SeatLockService } from './seat-lock.service.js';
import { TripExpiryService } from './trip-expiry.service.js';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';

@Module({
  imports: [SubscriptionsModule, NotificationsModule, RealtimeModule, MapsModule, RideRequestsModule],
  controllers: [TripsController, SeatLockController, AdminTripController],
  providers: [TripsService, SeatLockService, TripExpiryService],
  exports: [TripsService, SeatLockService, TripExpiryService],
})
export class TripsModule {}
