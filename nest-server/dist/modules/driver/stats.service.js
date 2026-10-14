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
let StatsService = class StatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lifetime(driverId) {
        const [user, profile, totalTrips, completedTrips, cancelledTrips, tripIds] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: driverId }, select: { avgRating: true } }),
            this.prisma.driverProfile.findFirst({ where: { driverId }, select: { responseRate: true } }),
            this.prisma.trip.count({ where: { driverId } }),
            this.prisma.trip.count({ where: { driverId, status: 'completed' } }),
            this.prisma.trip.count({ where: { driverId, status: 'cancelled' } }),
            this.prisma.trip
                .findMany({ where: { driverId }, select: { id: true } })
                .then((rows) => rows.map((r) => r.id)),
        ]);
        let totalBookings = 0;
        let noShowBookings = 0;
        let totalEarnings = 0;
        if (tripIds.length > 0) {
            [totalBookings, noShowBookings] = await Promise.all([
                this.prisma.booking.count({ where: { tripId: { in: tripIds } } }),
                this.prisma.booking.count({ where: { tripId: { in: tripIds }, status: 'no_show' } }),
            ]);
            const agg = await this.prisma.booking.aggregate({
                where: { tripId: { in: tripIds }, status: 'completed' },
                _sum: { agreedFare: true },
            });
            totalEarnings = Number(agg._sum.agreedFare ?? 0);
        }
        const noShowRate = totalBookings === 0 ? 0 : Math.round((noShowBookings / totalBookings) * 1000) / 10;
        return {
            stats: {
                total_trips: totalTrips,
                total_bookings: totalBookings,
                no_show_rate: noShowRate,
                response_rate: profile ? Number(profile.responseRate ?? 0) : 0,
                avg_rating: user ? Number(user.avgRating ?? 0) : 0,
                total_earnings: totalEarnings,
                completed_trips: completedTrips,
                cancelled_trips: cancelledTrips,
            },
        };
    }
};
StatsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], StatsService);
export { StatsService };
//# sourceMappingURL=stats.service.js.map