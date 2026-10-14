import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AddFavoriteDriverDto, AddFavoriteRouteDto, FavoriteDriversListQuery } from './dto/favorite.dto.js';
import { FavoritesService } from './favorites.service.js';
export declare class FavoritesController {
    private readonly favorites;
    constructor(favorites: FavoritesService);
    listFavoriteDrivers(query: FavoriteDriversListQuery, user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
        pagination: Record<string, unknown>;
    }>;
    addFavoriteDriver(dto: AddFavoriteDriverDto, user?: AuthUser): Promise<{
        favorite_driver: Record<string, unknown>;
        created: boolean;
    }>;
    removeFavoriteDriver(driverId: string, user?: AuthUser): Promise<{
        message: string;
    }>;
    listFavoriteRoutes(user?: AuthUser): Promise<{
        data: Record<string, unknown>[];
    }>;
    addFavoriteRoute(dto: AddFavoriteRouteDto, user?: AuthUser): Promise<{
        favorite_route: Record<string, unknown>;
    }>;
    removeFavoriteRoute(originCity: string, destinationCity: string, user?: AuthUser): Promise<{
        message: string;
    }>;
}
