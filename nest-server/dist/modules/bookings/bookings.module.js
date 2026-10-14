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
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { TripsModule } from '../trips/trips.module.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { DelayService } from './delay.service.js';
let BookingsModule = class BookingsModule {
};
BookingsModule = __decorate([
    Module({
        imports: [TripsModule, MapsModule, NotificationsModule, SubscriptionsModule, RealtimeModule],
        controllers: [BookingsController],
        providers: [BookingsService, DelayService],
        exports: [BookingsService, DelayService],
    })
], BookingsModule);
export { BookingsModule };
//# sourceMappingURL=bookings.module.js.map