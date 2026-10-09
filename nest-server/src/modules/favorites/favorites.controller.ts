import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import {
  AddFavoriteDriverDto,
  AddFavoriteRouteDto,
  FavoriteDriversListQuery,
} from './dto/favorite.dto.js';
import { FavoritesService } from './favorites.service.js';

// Express parity: Routes/favoriteRoutes.ts mounted at /api/favorites —
// everything protect + passenger. NOTE: DELETE routes carry param validation
// WITHOUT the `validate` middleware in Express, so malformed params fall
// through to 404s — plain-string params here.
@Controller('favorites')
@Roles('passenger')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get('drivers')
  listFavoriteDrivers(
    @Query() query: FavoriteDriversListQuery,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.favorites.listFavoriteDrivers(user?.id ?? '', query);
  }

  @Post('drivers')
  @HttpCode(200)
  addFavoriteDriver(
    @Body() dto: AddFavoriteDriverDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ favorite_driver: Record<string, unknown>; created: boolean }> {
    return this.favorites.addFavoriteDriver(user?.id ?? '', dto.driver_id);
  }

  @Delete('drivers/:driver_id')
  removeFavoriteDriver(
    @Param('driver_id') driverId: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    return this.favorites.removeFavoriteDriver(user?.id ?? '', driverId);
  }

  @Get('routes')
  listFavoriteRoutes(@CurrentUser() user?: AuthUser): Promise<{ data: Record<string, unknown>[] }> {
    return this.favorites.listFavoriteRoutes(user?.id ?? '');
  }

  @Post('routes')
  @HttpCode(201)
  addFavoriteRoute(
    @Body() dto: AddFavoriteRouteDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ favorite_route: Record<string, unknown> }> {
    return this.favorites.addFavoriteRoute(user?.id ?? '', dto).then((favorite_route) => ({
      favorite_route,
    }));
  }

  @Delete('routes/:origin_city/:destination_city')
  removeFavoriteRoute(
    @Param('origin_city') originCity: string,
    @Param('destination_city') destinationCity: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    return this.favorites.removeFavoriteRoute(user?.id ?? '', originCity, destinationCity);
  }
}
