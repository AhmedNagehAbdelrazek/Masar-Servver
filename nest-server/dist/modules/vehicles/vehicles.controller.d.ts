import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';
declare class VehicleIdParam {
    vehicle_id: string;
}
export declare class VehiclesController {
    private readonly vehicles;
    constructor(vehicles: VehiclesService);
    listVehicles(user?: AuthUser): Promise<{
        vehicles: Record<string, unknown>[];
    }>;
    updateVehicle(params: VehicleIdParam, dto: UpdateVehicleDto, user?: AuthUser): Promise<{
        vehicle: Record<string, unknown>;
    }>;
}
export {};
