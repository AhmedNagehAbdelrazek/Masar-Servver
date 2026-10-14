import { Module } from '@nestjs/common';
import { AdminRideRequestsController } from './admin-ride-requests.controller.js';
import { AdminRideRequestsService } from './admin-ride-requests.service.js';

// PrismaService is global (PrismaModule @Global) — no import needed.
@Module({
  controllers: [AdminRideRequestsController],
  providers: [AdminRideRequestsService],
  exports: [AdminRideRequestsService],
})
export class AdminRideRequestsModule {}
