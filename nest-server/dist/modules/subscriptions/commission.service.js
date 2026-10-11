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
import { BalanceService, round } from '../balance/balance.service.js';
let CommissionService = class CommissionService {
    prisma;
    balance;
    constructor(prisma, balance) {
        this.prisma = prisma;
        this.balance = balance;
    }
    minimumBalanceForPlan(plan, farePerSeat) {
        const rate = plan ? Number(plan.planPercentageCut) : 0;
        return round(Number(farePerSeat) * (rate / 100));
    }
    async getGatingSnapshot(driverId, farePerSeat) {
        const current = await this.balance.findCurrentSubscription(driverId);
        if (!current)
            return { current: null, minimum: 0, totalBalance: 0 };
        const overview = await this.balance.getBalanceOverview(driverId);
        return {
            current,
            minimum: this.minimumBalanceForPlan(current, farePerSeat),
            totalBalance: overview ? Number(overview.total_balance) : 0,
        };
    }
    async getTotalFare(tripId) {
        const bookings = await this.prisma.booking.findMany({
            where: { tripId, status: { in: ['confirmed', 'completed'] } },
            select: { agreedFare: true },
        });
        return round(bookings.reduce((sum, b) => sum + Number(b.agreedFare), 0));
    }
    async deductCommission(trip, actorId = null) {
        const totalFare = await this.getTotalFare(trip.id);
        const current = (await this.balance.findCurrentSubscription(trip.driverId));
        const rate = current ? Number(current.planPercentageCut) : 0;
        const commission = round(totalFare * (rate / 100));
        const result = await this.balance.deductCommission({
            driverId: trip.driverId,
            amount: commission,
        });
        void actorId;
        return {
            commission,
            rate,
            totalFare,
            planName: result.planName,
            balanceAfter: result.balanceAfter,
            isInDebt: result.isInDebt,
            shortfall: result.shortfall,
            tripsBlocked: result.tripsBlocked,
        };
    }
};
CommissionService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        BalanceService])
], CommissionService);
export { CommissionService };
//# sourceMappingURL=commission.service.js.map