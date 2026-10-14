import { Module } from '@nestjs/common';
import { DriverModule } from '../driver/driver.module.js';
import { AdminPassengersController } from './admin-passengers.controller.js';
import { AdminPassengersService } from './admin-passengers.service.js';

// Passenger dossier for the admin dashboard (Figma 10062:4551 + detail tabs +
// action modals). PenaltyService is reused from DriverModule so warning /
// suspension / ban semantics stay canonical across roles.
@Module({
  imports: [DriverModule],
  controllers: [AdminPassengersController],
  providers: [AdminPassengersService],
  exports: [AdminPassengersService],
})
export class AdminPassengersModule {}
