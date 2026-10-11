var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { TripIdParam } from './dto/create-trip.dto.js';
import { TripsService } from './trips.service.js';
let AdminTripController = class AdminTripController {
    trips;
    constructor(trips) {
        this.trips = trips;
    }
    getAdminTripRoute(params, user) {
        return this.trips.getTripRoute(user?.id ?? '', user?.role ?? '', params.trip_id);
    }
    getAdminTripActual(params, user) {
        return this.trips.getTripActual(user?.id ?? '', user?.role ?? '', params.trip_id);
    }
};
__decorate([
    Get(':trip_id/route'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], AdminTripController.prototype, "getAdminTripRoute", null);
__decorate([
    Get(':trip_id/route/actual'),
    __param(0, Param()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TripIdParam, Object]),
    __metadata("design:returntype", Promise)
], AdminTripController.prototype, "getAdminTripActual", null);
AdminTripController = __decorate([
    Controller('admin/trips'),
    Roles('admin', 'support', 'moderator'),
    __metadata("design:paramtypes", [TripsService])
], AdminTripController);
export { AdminTripController };
//# sourceMappingURL=admin-trip.controller.js.map