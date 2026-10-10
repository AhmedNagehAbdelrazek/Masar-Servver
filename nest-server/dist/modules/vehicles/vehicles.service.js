var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
function serializeVehicle(v) {
    return {
        id: v.id,
        manufacturer: v.manufacturer,
        model: v.model,
        vehicle_type: v.vehicleType,
        model_year: v.modelYear,
        plate_number: v.plateNumber,
        code_number: v.codeNumber,
        color: v.color,
        seats: v.seats,
        is_verified: v.isVerified,
    };
}
let VehiclesService = class VehiclesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listByDriver(driverId) {
        const vehicles = await this.prisma.vehicle.findMany({
            where: { driverId },
            orderBy: { createdAt: 'desc' },
        });
        return { vehicles: vehicles.map((v) => serializeVehicle(v)) };
    }
    async update(driverId, vehicleId, payload) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            throw new NotFoundException({ message: 'VEHICLE_NOT_FOUND', code: 'VEHICLE_NOT_FOUND' });
        }
        if (vehicle.driverId !== driverId) {
            throw new ForbiddenException({
                message: 'YOU_CAN_ONLY_UPDATE_YOUR_OWN_VEHICLES',
                code: 'FORBIDDEN',
            });
        }
        const updates = {};
        if (payload.manufacturer !== undefined)
            updates.manufacturer = payload.manufacturer;
        if (payload.model !== undefined)
            updates.model = payload.model;
        if (payload.vehicle_type !== undefined)
            updates.vehicleType = payload.vehicle_type;
        if (payload.model_year !== undefined)
            updates.modelYear = payload.model_year;
        if (payload.plate_number !== undefined)
            updates.plateNumber = payload.plate_number;
        if (payload.code_number !== undefined)
            updates.codeNumber = payload.code_number;
        if (payload.color !== undefined)
            updates.color = payload.color;
        if (payload.seats !== undefined)
            updates.seats = payload.seats;
        if (updates.plateNumber !== undefined && updates.plateNumber !== vehicle.plateNumber) {
            const existing = await this.prisma.vehicle.findFirst({
                where: { plateNumber: updates.plateNumber },
            });
            if (existing && existing.id !== vehicle.id) {
                throw new ConflictException({
                    message: 'PLATE_NUMBER_ALREADY_IN_USE',
                    code: 'PLATE_NUMBER_ALREADY_IN_USE',
                });
            }
        }
        const updated = await this.prisma.vehicle.update({
            where: { id: vehicleId },
            data: updates,
        });
        return { vehicle: serializeVehicle(updated) };
    }
};
VehiclesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], VehiclesService);
export { VehiclesService };
//# sourceMappingURL=vehicles.service.js.map