import { PrismaService } from '../../prisma/prisma.service.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
export declare class VehiclesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listByDriver(driverId: string): Promise<{
        vehicles: Record<string, unknown>[];
    }>;
    update(driverId: string, vehicleId: string, payload: UpdateVehicleDto): Promise<{
        vehicle: Record<string, unknown>;
    }>;
}
