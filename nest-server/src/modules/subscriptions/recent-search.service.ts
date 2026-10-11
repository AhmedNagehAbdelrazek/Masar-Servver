import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';

// Port of Main Server/Services/recentSearchService.ts.
@Injectable()
export class RecentSearchService {
  private readonly logger = new Logger(RecentSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async recordSearch(
    passengerId: string,
    originCity: string,
    destinationCity: string,
  ): Promise<{ passengerId: string; originCity: string; destinationCity: string; searchedOn: string }> {
    const searchedOn = new Date().toISOString().split('T')[0] as string;
    const existing = await this.prisma.recentSearch.findFirst({
      where: { passengerId, originCity, destinationCity },
    });
    if (existing) {
      await this.prisma.recentSearch.update({
        where: { id: existing.id },
        data: { searchedOn: new Date(searchedOn) },
      });
    } else {
      await this.prisma.recentSearch.create({
        data: { passengerId, originCity, destinationCity, searchedOn: new Date(searchedOn) },
      });
    }
    try {
      await this.redis.deleteKey(`passenger_home:${passengerId}`);
    } catch (err) {
      this.logger.warn(`[recentSearchService] cache invalidation failed: ${(err as Error).message}`);
    }
    return { passengerId, originCity, destinationCity, searchedOn };
  }

  async getRecent(
    passengerId: string,
    limit = 5,
  ): Promise<{ id: string; origin_city: string; destination_city: string; searched_on: Date }[]> {
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
}
