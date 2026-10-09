import { Module } from '@nestjs/common';
import { RideRequestsController } from './ride-requests.controller.js';
import { RideRequestsService } from './ride-requests.service.js';

@Module({
  controllers: [RideRequestsController],
  providers: [RideRequestsService]
})
export class RideRequestsModule {}
