var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { GeoService } from './geo.service.js';
import { MapsClient } from './maps.client.js';
import { MapsController } from './maps.controller.js';
import { PickupService } from './pickup.service.js';
import { RouteService } from './route.service.js';
let MapsModule = class MapsModule {
};
MapsModule = __decorate([
    Module({
        controllers: [MapsController],
        providers: [GeoService, MapsClient, RouteService, PickupService],
        exports: [GeoService, MapsClient, RouteService, PickupService],
    })
], MapsModule);
export { MapsModule };
//# sourceMappingURL=maps.module.js.map