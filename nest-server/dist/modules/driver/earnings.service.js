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
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
const PERIODS = ['day', 'week', 'month'];
let EarningsService = class EarningsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async aggregate(driverId, { period = 'month', from, to } = {}) {
        const truncated = PERIODS.includes(period)
            ? period
            : 'month';
        const now = new Date();
        let fromDate = from ? new Date(from) : null;
        let toDate = to ? new Date(to) : null;
        if (!fromDate || Number.isNaN(fromDate.getTime())) {
            fromDate = new Date(now);
            if (truncated === 'day')
                fromDate.setHours(0, 0, 0, 0);
            else if (truncated === 'week')
                fromDate.setDate(now.getDate() - 7);
            else
                fromDate.setMonth(now.getMonth() - 1);
        }
        if (!toDate || Number.isNaN(toDate.getTime()))
            toDate = new Date(now);
        const fmt = truncated === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
        const rows = (await this.prisma.$queryRaw `
      SELECT to_char(date_trunc(${Prisma.raw(`'${truncated}'`)}, b."createdat"), ${fmt}) AS bucket,
             SUM(b."agreed_fare") AS earnings,
             COUNT(DISTINCT b."trip_id") AS trips
      FROM "bookings" b
      JOIN "trips" t ON t."id" = b."trip_id"
      WHERE t."driver_id" = ${driverId}
        AND b."status" = 'completed'
        AND b."createdat" >= ${fromDate} AND b."createdat" <= ${toDate}
      GROUP BY 1 ORDER BY 1
    `);
        const breakdown = rows.map((r) => ({
            bucket: r.bucket,
            earnings: Number(r.earnings ?? 0),
            trips: Number(r.trips ?? 0),
        }));
        const total = breakdown.reduce((sum, r) => sum + r.earnings, 0);
        return {
            period: truncated,
            currency: 'JOD',
            total: Math.round(total * 100) / 100,
            breakdown,
        };
    }
};
EarningsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], EarningsService);
export { EarningsService };
//# sourceMappingURL=earnings.service.js.map