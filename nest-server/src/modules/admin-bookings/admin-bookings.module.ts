import { Module } from '@nestjs/common';
import { AdminBookingsController } from './admin-bookings.controller.js';
import { AdminBookingsService } from './admin-bookings.service.js';

// PrismaService is global (PrismaModule @Global) — no import needed.
@Module({
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
