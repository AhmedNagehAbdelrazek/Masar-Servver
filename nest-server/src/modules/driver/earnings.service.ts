import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const PERIODS = ['day', 'week', 'month'] as const;
export type EarningsPeriod = (typeof PERIODS)[number];

// Port of Main Server/Services/earningsService.ts: completed-booking earnings
// grouped by Postgres date_trunc buckets. period/from/to validated by DTO;
// the trunc/format fragments are allowlisted here (never raw user input).
@Injectable()
export class EarningsService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregate(
    driverId: string,
    { period = 'month', from, to }: { period?: string; from?: string; to?: string } = {},
  ): Promise<{
    period: EarningsPeriod;
    currency: string;
    total: number;
    breakdown: { bucket: string; earnings: number; trips: number }[];
  }> {
    const truncated: EarningsPeriod = (PERIODS as readonly string[]).includes(period)
      ? (period as EarningsPeriod)
      : 'month';
    const now = new Date();
    let fromDate = from ? new Date(from) : null;
    let toDate = to ? new Date(to) : null;
    if (!fromDate || Number.isNaN(fromDate.getTime())) {
      fromDate = new Date(now);
      if (truncated === 'day') fromDate.setHours(0, 0, 0, 0);
      else if (truncated === 'week') fromDate.setDate(now.getDate() - 7);
      else fromDate.setMonth(now.getMonth() - 1);
    }
    if (!toDate || Number.isNaN(toDate.getTime())) toDate = new Date(now);

    const fmt = truncated === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    const rows = (await this.prisma.$queryRaw`
      SELECT to_char(date_trunc(${Prisma.raw(`'${truncated}'`)}, b."createdat"), ${fmt}) AS bucket,
             SUM(b."agreed_fare") AS earnings,
             COUNT(DISTINCT b."trip_id") AS trips
      FROM "bookings" b
      JOIN "trips" t ON t."id" = b."trip_id"
      WHERE t."driver_id" = ${driverId}
        AND b."status" = 'completed'
        AND b."createdat" >= ${fromDate} AND b."createdat" <= ${toDate}
      GROUP BY 1 ORDER BY 1
    `) as { bucket: string; earnings: number | string; trips: number | string }[];

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
}
