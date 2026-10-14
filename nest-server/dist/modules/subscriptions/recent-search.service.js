var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecentSearchService_1;
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
let RecentSearchService = RecentSearchService_1 = class RecentSearchService {
    prisma;
    redis;
    logger = new Logger(RecentSearchService_1.name);
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async recordSearch(passengerId, originCity, destinationCity) {
        const searchedOn = new Date().toISOString().split('T')[0];
        const existing = await this.prisma.recentSearch.findFirst({
            where: { passengerId, originCity, destinationCity },
        });
        if (existing) {
            await this.prisma.recentSearch.update({
                where: { id: existing.id },
                data: { searchedOn: new Date(searchedOn) },
            });
        }
        else {
            await this.prisma.recentSearch.create({
                data: { passengerId, originCity, destinationCity, searchedOn: new Date(searchedOn) },
            });
        }
        try {
            await this.redis.deleteKey(`passenger_home:${passengerId}`);
        }
        catch (err) {
            this.logger.warn(`[recentSearchService] cache invalidation failed: ${err.message}`);
        }
        return { passengerId, originCity, destinationCity, searchedOn };
    }
    async getRecent(passengerId, limit = 5) {
        const rows = await this.prisma.recentSearch.findMany({
            where: { passengerId },
            orderBy: [{ searchedOn: 'desc' }, { createdAt: 'desc' }],
            take: limit,
        });
        return rows.map((r) => ({
            id: r.id,
            origin_city: r.originCity,
            destination_city: r.destinationCity,
            searched_on: r.searchedOn,
        }));
    }
};
RecentSearchService = RecentSearchService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        RedisService])
], RecentSearchService);
export { RecentSearchService };
//# sourceMappingURL=recent-search.service.js.map