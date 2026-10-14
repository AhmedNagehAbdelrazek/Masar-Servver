var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let TripsModule = class TripsModule {
};
TripsModule = __decorate([
    Module({
        imports: [SubscriptionsModule, NotificationsModule, RealtimeModule, MapsModule, RideRequestsModule],
        controllers: [TripsController, SeatLockController, AdminTripController],
        providers: [TripsService, SeatLockService, TripExpiryService],
        exports: [TripsService, SeatLockService, TripExpiryService],
    })
], TripsModule);
export { TripsModule };
//# sourceMappingURL=trips.module.js.map