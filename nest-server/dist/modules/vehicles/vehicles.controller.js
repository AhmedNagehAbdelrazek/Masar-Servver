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
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';
class VehicleIdParam {
    vehicle_id;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], VehicleIdParam.prototype, "vehicle_id", void 0);
let VehiclesController = class VehiclesController {
    vehicles;
    constructor(vehicles) {
        this.vehicles = vehicles;
    }
    listVehicles(user) {
        return this.vehicles.listByDriver(user?.id ?? '');
    }
    updateVehicle(params, dto, user) {
        return this.vehicles.update(user?.id ?? '', params.vehicle_id, dto);
    }
};
__decorate([
    Get(),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "listVehicles", null);
__decorate([
    Put(':vehicle_id'),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VehicleIdParam,
        UpdateVehicleDto, Object]),
    __metadata("design:returntype", Promise)
], VehiclesController.prototype, "updateVehicle", null);
VehiclesController = __decorate([
    Controller('vehicles'),
    Roles('driver'),
    __metadata("design:paramtypes", [VehiclesService])
], VehiclesController);
export { VehiclesController };
//# sourceMappingURL=vehicles.controller.js.map