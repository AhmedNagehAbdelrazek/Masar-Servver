import { Module } from '@nestjs/common';
import { AdminComplaintsController } from './admin-complaints.controller.js';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintsService } from './complaints.service.js';
import { DriverComplaintsController } from './driver-complaints.controller.js';
import { DriverModule } from '../driver/driver.module.js';

@Module({
  imports: [DriverModule],
  controllers: [ComplaintsController, DriverComplaintsController, AdminComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
