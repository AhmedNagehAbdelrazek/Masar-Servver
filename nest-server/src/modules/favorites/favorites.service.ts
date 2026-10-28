import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AddFavoriteRouteDto } from './dto/favorite.dto.js';
import type { FavoriteDriversListQuery } from './dto/favorite.dto.js';

interface DriverRow {
  id: string;
  passengerId: string;
  driverId: string;
  createdAt: Date;
  driver?: { fullName: string | null } | null;
}

interface RouteRow {
  id: string;
  passengerId: string;
  originCity: string;
  destinationCity: string;
  label: string | null;
  createdAt: Date;
}

function serializeFavoriteDriver(f: DriverRow): Record<string, unknown> {
  return {
    id: f.id,
    passenger_id: f.passengerId,
    driver_id: f.driverId,
    driver_name: f.driver ? f.driver.fullName : null,
    created_at: f.createdAt,
  };
}

function serializeFavoriteRoute(r: RouteRow): Record<string, unknown> {
  return {
    id: r.id,
    passenger_id: r.passengerId,
    origin_city: r.originCity,
    destination_city: r.destinationCity,
    label: r.label ?? null,
    created_at: r.createdAt,
  };
}

// Port of Main Server/Services/favoriteService.ts
@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertDriverExists(driverId: string): Promise<void> {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver || driver.role !== 'driver') {
      throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
    }
  }

  async addFavoriteDriver(
    passengerId: string,
    driverId: string,
  ): Promise<{ favorite_driver: Record<string, unknown>; created: boolean }> {
    if (driverId === passengerId) {
      throw new UnprocessableEntityException({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'driver_id', message: 'You cannot add yourself as a favorite driver' }],
      });
    }
    await this.assertDriverExists(driverId);

    const existing = await this.prisma.favoriteDriver.findFirst({
      where: { passengerId, driverId },
      include: { driver: { select: { fullName: true } } },
    });
    if (existing) {
      return {
        favorite_driver: serializeFavoriteDriver(existing as unknown as DriverRow),
        created: false,
      };
    }
    const favorite = await this.prisma.favoriteDriver.create({
      data: { passengerId, driverId },
      include: { driver: { select: { fullName: true } } },
    });
    return {
      favorite_driver: serializeFavoriteDriver(favorite as unknown as DriverRow),
      created: true,
    };
  }

  async removeFavoriteDriver(passengerId: string, driverId: string): Promise<{ message: string }> {
    const existing = await this.prisma.favoriteDriver.findFirst({
      where: { passengerId, driverId },
    });
    if (!existing) {
      throw new NotFoundException({ message: 'FAVORITE_DRIVER_NOT_FOUND', code: 'FAVORITE_DRIVER_NOT_FOUND' });
    }
    await this.prisma.favoriteDriver.delete({ where: { id: existing.id } });
    return { message: 'FAVORITE_DRIVER_REMOVED' };
  }

  async listFavoriteDrivers(
    passengerId: string,
    filters: FavoriteDriversListQuery = {},
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    const { page, limit, offset } = parsePagination(filters);
    const [rows, count] = await Promise.all([
      this.prisma.favoriteDriver.findMany({
        where: { passengerId },
        include: { driver: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.favoriteDriver.count({ where: { passengerId } }),
    ]);
    return {
      data: rows.map((r) => serializeFavoriteDriver(r as unknown as DriverRow)),
      pagination: buildPagination(count, page, limit),
    };
  }

  async addFavoriteRoute(
    passengerId: string,
    payload: AddFavoriteRouteDto,
  ): Promise<Record<string, unknown>> {
    const existing = await this.prisma.favoriteRoute.findFirst({
      where: {
        passengerId,
        originCity: payload.origin_city,
        destinationCity: payload.destination_city,
      },
    });
    if (existing) {
      if (payload.label !== undefined && existing.label !== (payload.label || null)) {
        const updated = await this.prisma.favoriteRoute.update({
          where: { id: existing.id },
          data: { label: payload.label || null },
        });
        return serializeFavoriteRoute(updated as unknown as RouteRow);
      }
      return serializeFavoriteRoute(existing as unknown as RouteRow);
    }
    const route = await this.prisma.favoriteRoute.create({
      data: {
        passengerId,
        originCity: payload.origin_city,
        destinationCity: payload.destination_city,
        label: payload.label ?? null,
      },
    });
    return serializeFavoriteRoute(route as unknown as RouteRow);
  }

  async removeFavoriteRoute(
    passengerId: string,
    originCity: string,
    destinationCity: string,
  ): Promise<{ message: string }> {
    const existing = await this.prisma.favoriteRoute.findFirst({
      where: { passengerId, originCity, destinationCity },
    });
    if (!existing) {
      throw new NotFoundException({ message: 'FAVORITE_ROUTE_NOT_FOUND', code: 'FAVORITE_ROUTE_NOT_FOUND' });
    }
    await this.prisma.favoriteRoute.delete({ where: { id: existing.id } });
    return { message: 'FAVORITE_ROUTE_REMOVED' };
  }

  async listFavoriteRoutes(passengerId: string): Promise<{ data: Record<string, unknown>[] }> {
    const routes = await this.prisma.favoriteRoute.findMany({
      where: { passengerId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: routes.map((r) => serializeFavoriteRoute(r as unknown as RouteRow)) };
  }
}
