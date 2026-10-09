import { Module } from '@nestjs/common';
import { DriverRatingsController } from './driver-ratings.controller.js';
import { RatingsController } from './ratings.controller.js';
import { RatingsService } from './ratings.service.js';

@Module({
  controllers: [RatingsController, DriverRatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
