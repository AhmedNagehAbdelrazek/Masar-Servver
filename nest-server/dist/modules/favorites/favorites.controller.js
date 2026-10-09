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
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AddFavoriteDriverDto, AddFavoriteRouteDto, FavoriteDriversListQuery, } from './dto/favorite.dto.js';
import { FavoritesService } from './favorites.service.js';
let FavoritesController = class FavoritesController {
    favorites;
    constructor(favorites) {
        this.favorites = favorites;
    }
    listFavoriteDrivers(query, user) {
        return this.favorites.listFavoriteDrivers(user?.id ?? '', query);
    }
    addFavoriteDriver(dto, user) {
        return this.favorites.addFavoriteDriver(user?.id ?? '', dto.driver_id);
    }
    removeFavoriteDriver(driverId, user) {
        return this.favorites.removeFavoriteDriver(user?.id ?? '', driverId);
    }
    listFavoriteRoutes(user) {
        return this.favorites.listFavoriteRoutes(user?.id ?? '');
    }
    addFavoriteRoute(dto, user) {
        return this.favorites.addFavoriteRoute(user?.id ?? '', dto).then((favorite_route) => ({
            favorite_route,
        }));
    }
    removeFavoriteRoute(originCity, destinationCity, user) {
        return this.favorites.removeFavoriteRoute(user?.id ?? '', originCity, destinationCity);
    }
};
__decorate([
    Get('drivers'),
    __param(0, Query()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [FavoriteDriversListQuery, Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "listFavoriteDrivers", null);
__decorate([
    Post('drivers'),
    HttpCode(200),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AddFavoriteDriverDto, Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "addFavoriteDriver", null);
__decorate([
    Delete('drivers/:driver_id'),
    __param(0, Param('driver_id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "removeFavoriteDriver", null);
__decorate([
    Get('routes'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "listFavoriteRoutes", null);
__decorate([
    Post('routes'),
    HttpCode(201),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AddFavoriteRouteDto, Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "addFavoriteRoute", null);
__decorate([
    Delete('routes/:origin_city/:destination_city'),
    __param(0, Param('origin_city')),
    __param(1, Param('destination_city')),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "removeFavoriteRoute", null);
FavoritesController = __decorate([
    Controller('favorites'),
    Roles('passenger'),
    __metadata("design:paramtypes", [FavoritesService])
], FavoritesController);
export { FavoritesController };
//# sourceMappingURL=favorites.controller.js.map