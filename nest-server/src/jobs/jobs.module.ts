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

@Module({
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
export class JobsModule {}
