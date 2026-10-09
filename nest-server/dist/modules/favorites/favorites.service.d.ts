import { PrismaService } from '../../prisma/prisma.service.js';
import type { AddFavoriteRouteDto } from './dto/favorite.dto.js';
import type { FavoriteDriversListQuery } from './dto/favorite.dto.js';
export declare class FavoritesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertDriverExists;
    addFavoriteDriver(passengerId: string, driverId: string): Promise<{
        favorite_driver: Record<string, unknown>;
        created: boolean;
    }>;
    removeFavoriteDriver(passengerId: string, driverId: string): Promise<{
        message: string;
    }>;
    listFavoriteDrivers(passengerId: string, filters?: FavoriteDriversListQuery): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    addFavoriteRoute(passengerId: string, payload: AddFavoriteRouteDto): Promise<Record<string, unknown>>;
    removeFavoriteRoute(passengerId: string, originCity: string, destinationCity: string): Promise<{
        message: string;
    }>;
    listFavoriteRoutes(passengerId: string): Promise<{
        data: Record<string, unknown>[];
    }>;
}
