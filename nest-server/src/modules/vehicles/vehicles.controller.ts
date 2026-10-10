import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

class VehicleIdParam {
  @IsUUID()
  vehicle_id!: string;
}

// Express parity: Routes/vehicleRoutes.ts (protect + driver).
@Controller('vehicles')
@Roles('driver')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  listVehicles(@CurrentUser() user?: AuthUser): Promise<{ vehicles: Record<string, unknown>[] }> {
    return this.vehicles.listByDriver(user?.id ?? '');
  }

  @Put(':vehicle_id')
  updateVehicle(
    @Param() params: VehicleIdParam,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ vehicle: Record<string, unknown> }> {
    return this.vehicles.update(user?.id ?? '', params.vehicle_id, dto);
  }
}
