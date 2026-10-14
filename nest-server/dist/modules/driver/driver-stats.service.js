var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
export const PROFESSIONAL_MIN_TRIPS = 20;
export const PROFESSIONAL_MIN_PUNCTUALITY = 90;
let DriverStatsService = class DriverStatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recomputeForDriver(driverId) {
        const completedTrips = await this.prisma.trip.count({
            where: { driverId, status: 'completed' },
        });
        const [total, onTime] = await Promise.all([
            this.prisma.rating.count({ where: { rateeId: driverId, isVisible: true } }),
            this.prisma.rating.count({
                where: { rateeId: driverId, isVisible: true, NOT: { wasLate: true } },
            }),
        ]);
        let punctualityRate = null;
        if (total > 0) {
            punctualityRate = Math.round((onTime / total) * 10000) / 100;
        }
        const professionalDriver = completedTrips >= PROFESSIONAL_MIN_TRIPS &&
            (punctualityRate == null || punctualityRate >= PROFESSIONAL_MIN_PUNCTUALITY);
        await this.prisma.driverProfile.upsert({
            where: { driverId },
            create: {
                driverId,
                totalTrips: completedTrips,
                punctualityRate,
                professionalDriver,
            },
            update: {
                totalTrips: completedTrips,
                punctualityRate,
                professionalDriver,
            },
        });
        return { driverId, completedTrips, punctualityRate, professionalDriver };
    }
    async recomputeAllDrivers() {
        const [tripDrivers, ratingDrivers] = await Promise.all([
            this.prisma.trip.findMany({
                select: { driverId: true },
                distinct: ['driverId'],
            }),
            this.prisma.rating.findMany({
                select: { rateeId: true },
                distinct: ['rateeId'],
            }),
        ]);
        const ids = new Set();
        for (const r of tripDrivers)
            if (r.driverId)
                ids.add(r.driverId);
        for (const r of ratingDrivers)
            if (r.rateeId)
                ids.add(r.rateeId);
        const results = [];
        for (const driverId of ids) {
            results.push(await this.recomputeForDriver(driverId));
        }
        return results;
    }
};
DriverStatsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], DriverStatsService);
export { DriverStatsService };
//# sourceMappingURL=driver-stats.service.js.map