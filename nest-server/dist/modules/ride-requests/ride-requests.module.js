var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { TripsModule } from '../trips/trips.module.js';
import { OffersController } from './offers.controller.js';
import { RideRequestsController } from './ride-requests.controller.js';
import { RideRequestsService } from './ride-requests.service.js';
let RideRequestsModule = class RideRequestsModule {
};
RideRequestsModule = __decorate([
    Module({
        imports: [NotificationsModule, SubscriptionsModule, RealtimeModule, TripsModule],
        controllers: [RideRequestsController, OffersController],
        providers: [RideRequestsService],
        exports: [RideRequestsService],
    })
], RideRequestsModule);
export { RideRequestsModule };
//# sourceMappingURL=ride-requests.module.js.map