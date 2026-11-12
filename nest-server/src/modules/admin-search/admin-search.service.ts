import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { maskPhone } from '../../common/utils/masking.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AdminSearchQuery {
  q?: string;
  limit?: number;
}

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: AdminSearchQuery = {}): Promise<Record<string, unknown>> {
    const q = String(query.q ?? '').trim();
    const limit = Math.min(Math.max(Number(query.limit) || 5, 1), 10);
    if (q.length < 2) {
      return {
        query: q,
        results: { passengers: [], drivers: [], trips: [], requests: [] },
        total: 0,
      };
    }

    const contains: Prisma.StringFilter = { contains: q, mode: 'insensitive' };
    const uuid = UUID_RE.test(q);
    const userWhere: Prisma.UserWhereInput = {
      OR: [
        { fullName: contains },
        { phone: contains },
        ...(uuid ? [{ id: q }] : []),
      ],
    };

    const [passengers, drivers, trips, requests] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'passenger', ...userWhere },
        select: { id: true, fullName: true, phone: true, status: true },
        orderBy: { fullName: 'asc' },
        take: limit,
      }),
      this.prisma.user.findMany({
        where: { role: 'driver', ...userWhere },
        select: {
          id: true,
          fullName: true,
          phone: true,
          status: true,
          verificationStatus: true,
        },
        orderBy: { fullName: 'asc' },
        take: limit,
      }),
      this.prisma.trip.findMany({
        where: {
          OR: [
            { originCity: contains },
            { destinationCity: contains },
            { driver: { fullName: contains } },
            ...(uuid ? [{ id: q }] : []),
          ],
        },
        include: { driver: { select: { id: true, fullName: true } } },
        orderBy: { departureTime: 'desc' },
        take: limit,
      }),
      this.prisma.rideRequest.findMany({
        where: {
          OR: [
            { originCity: contains },
            { destinationCity: contains },
            {
              passenger: {
                OR: [{ fullName: contains }, { phone: contains }],
              },
            },
            ...(uuid ? [{ id: q }] : []),
          ],
        },
        include: { passenger: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    const results = {
      passengers: passengers.map((user) => this.userResult(user, 'passenger')),
      drivers: drivers.map((user) => this.userResult(user, 'driver')),
      trips: trips.map((trip) => ({
        id: trip.id,
        kind: 'trip',
        origin: trip.originCity,
        destination: trip.destinationCity,
        route: `${trip.originCity} → ${trip.destinationCity}`,
        datetime: trip.departureTime,
        driver: trip.driver?.fullName ?? null,
        status: trip.status,
      })),
      requests: requests.map((request) => ({
        id: request.id,
        kind: 'request',
        origin: request.originCity,
        destination: request.destinationCity,
        route: `${request.originCity} → ${request.destinationCity}`,
        datetime: request.originTime ?? request.createdAt,
        passenger: request.passenger?.fullName ?? null,
        status: request.status,
      })),
    };
    const total = Object.values(results).reduce((sum, rows) => sum + rows.length, 0);
    return { query: q, results, total };
  }

  private userResult(
    user: {
      id: string;
      fullName: string | null;
      phone: string;
      status: string;
      verificationStatus?: string;
    },
    role: 'passenger' | 'driver',
  ): Record<string, unknown> {
    return {
      id: user.id,
      kind: role,
      name: user.fullName || (role === 'driver' ? 'سائق' : 'راكب'),
      phone: maskPhone(user.phone),
      phone_full: user.phone,
      status: user.status,
      verification_status: user.verificationStatus ?? null,
    };
  }
}
