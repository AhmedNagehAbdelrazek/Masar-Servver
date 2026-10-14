var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { BalanceModule } from '../modules/balance/balance.module.js';
import { DriverModule } from '../modules/driver/driver.module.js';
import { MapsModule } from '../modules/maps/maps.module.js';
import { NotificationsModule } from '../modules/notifications/notifications.module.js';
import { SosModule } from '../modules/sos/sos.module.js';
import { SubscriptionsModule } from '../modules/subscriptions/subscriptions.module.js';
import { TripsModule } from '../modules/trips/trips.module.js';
import { JobsService } from './jobs.service.js';
let JobsModule = class JobsModule {
};
JobsModule = __decorate([
    Module({
        imports: [
            ScheduleModule.forRoot(),
            PrismaModule,
            RedisModule,
            BalanceModule,
            NotificationsModule,
            SubscriptionsModule,
            SosModule,
            TripsModule,
            MapsModule,
            DriverModule,
        ],
        providers: [JobsService],
        exports: [JobsService],
    })
], JobsModule);
export { JobsModule };
//# sourceMappingURL=jobs.module.js.map