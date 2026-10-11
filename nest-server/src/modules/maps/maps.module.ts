import { Module } from '@nestjs/common';
import { GeoService } from './geo.service.js';
import { MapsClient } from './maps.client.js';
import { MapsController } from './maps.controller.js';
import { PickupService } from './pickup.service.js';
import { RouteService } from './route.service.js';

@Module({
  controllers: [MapsController],
  providers: [GeoService, MapsClient, RouteService, PickupService],
  exports: [GeoService, MapsClient, RouteService, PickupService],
})
export class MapsModule {}
