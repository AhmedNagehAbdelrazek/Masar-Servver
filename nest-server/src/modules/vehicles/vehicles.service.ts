import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';

interface VehicleRow {
  id: string;
  driverId: string;
  manufacturer: string;
  model: string;
  vehicleType: string;
  modelYear: number | null;
  plateNumber: string;
  codeNumber: string | null;
  color: string | null;
  seats: number;
  isVerified: boolean;
}

function serializeVehicle(v: VehicleRow): Record<string, unknown> {
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

// Port of Main Server/Services/vehicleService.ts
@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByDriver(driverId: string): Promise<{ vehicles: Record<string, unknown>[] }> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });
    return { vehicles: vehicles.map((v) => serializeVehicle(v as unknown as VehicleRow)) };
  }

  async update(
    driverId: string,
    vehicleId: string,
    payload: UpdateVehicleDto,
  ): Promise<{ vehicle: Record<string, unknown> }> {
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
    const updates: Record<string, unknown> = {};
    if (payload.manufacturer !== undefined) updates.manufacturer = payload.manufacturer;
    if (payload.model !== undefined) updates.model = payload.model;
    if (payload.vehicle_type !== undefined) updates.vehicleType = payload.vehicle_type;
    if (payload.model_year !== undefined) updates.modelYear = payload.model_year;
    if (payload.plate_number !== undefined) updates.plateNumber = payload.plate_number;
    if (payload.code_number !== undefined) updates.codeNumber = payload.code_number;
    if (payload.color !== undefined) updates.color = payload.color;
    if (payload.seats !== undefined) updates.seats = payload.seats;

    if (updates.plateNumber !== undefined && updates.plateNumber !== vehicle.plateNumber) {
      const existing = await this.prisma.vehicle.findFirst({
        where: { plateNumber: updates.plateNumber as string },
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
      data: updates as never,
    });
    return { vehicle: serializeVehicle(updated as unknown as VehicleRow) };
  }
}
