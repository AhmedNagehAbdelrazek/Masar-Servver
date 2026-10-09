var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
function serializeFavoriteDriver(f) {
    return {
        id: f.id,
        passenger_id: f.passengerId,
        driver_id: f.driverId,
        driver_name: f.driver ? f.driver.fullName : null,
        created_at: f.createdAt,
    };
}
function serializeFavoriteRoute(r) {
    return {
        id: r.id,
        passenger_id: r.passengerId,
        origin_city: r.originCity,
        destination_city: r.destinationCity,
        label: r.label ?? null,
        created_at: r.createdAt,
    };
}
let FavoritesService = class FavoritesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertDriverExists(driverId) {
        const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!driver || driver.role !== 'driver') {
            throw new NotFoundException({ message: 'Driver not found', code: 'DRIVER_NOT_FOUND' });
        }
    }
    async addFavoriteDriver(passengerId, driverId) {
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
                favorite_driver: serializeFavoriteDriver(existing),
                created: false,
            };
        }
        const favorite = await this.prisma.favoriteDriver.create({
            data: { passengerId, driverId },
            include: { driver: { select: { fullName: true } } },
        });
        return {
            favorite_driver: serializeFavoriteDriver(favorite),
            created: true,
        };
    }
    async removeFavoriteDriver(passengerId, driverId) {
        const existing = await this.prisma.favoriteDriver.findFirst({
            where: { passengerId, driverId },
        });
        if (!existing) {
            throw new NotFoundException({ message: 'Favorite driver not found', code: 'FAVORITE_DRIVER_NOT_FOUND' });
        }
        await this.prisma.favoriteDriver.delete({ where: { id: existing.id } });
        return { message: 'FAVORITE_DRIVER_REMOVED' };
    }
    async listFavoriteDrivers(passengerId, filters = {}) {
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
            data: rows.map((r) => serializeFavoriteDriver(r)),
            pagination: buildPagination(count, page, limit),
        };
    }
    async addFavoriteRoute(passengerId, payload) {
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
                return serializeFavoriteRoute(updated);
            }
            return serializeFavoriteRoute(existing);
        }
        const route = await this.prisma.favoriteRoute.create({
            data: {
                passengerId,
                originCity: payload.origin_city,
                destinationCity: payload.destination_city,
                label: payload.label ?? null,
            },
        });
        return serializeFavoriteRoute(route);
    }
    async removeFavoriteRoute(passengerId, originCity, destinationCity) {
        const existing = await this.prisma.favoriteRoute.findFirst({
            where: { passengerId, originCity, destinationCity },
        });
        if (!existing) {
            throw new NotFoundException({ message: 'Favorite route not found', code: 'FAVORITE_ROUTE_NOT_FOUND' });
        }
        await this.prisma.favoriteRoute.delete({ where: { id: existing.id } });
        return { message: 'FAVORITE_ROUTE_REMOVED' };
    }
    async listFavoriteRoutes(passengerId) {
        const routes = await this.prisma.favoriteRoute.findMany({
            where: { passengerId },
            orderBy: { createdAt: 'desc' },
        });
        return { data: routes.map((r) => serializeFavoriteRoute(r)) };
    }
};
FavoritesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], FavoritesService);
export { FavoritesService };
//# sourceMappingURL=favorites.service.js.map