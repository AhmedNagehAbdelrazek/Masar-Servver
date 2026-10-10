import { Injectable, NotFoundException } from '@nestjs/common';
import { maskNationalId, maskPhone } from '../../common/utils/masking.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DashboardService } from './dashboard.service.js';
import { DeletionService } from './deletion.service.js';
import { DriverProfileService } from './driver-profile.service.js';
import { EarningsService } from './earnings.service.js';
import { PenaltyService } from './penalty.service.js';
import { PersonalDataService, type PersonalDataPayload } from './personal-data.service.js';
import { StatsService } from './stats.service.js';

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

// Driver aggregate endpoints. Ported incrementally from
// Main Server/Controllers/driverController.ts + Services.
// Bookings/offers arrive with Wave 5 services; home/subscription with Wave 4.
@Injectable()
export class DriverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: DriverProfileService,
    private readonly personalData: PersonalDataService,
    private readonly deletion: DeletionService,
    private readonly penalties: PenaltyService,
    private readonly earnings: EarningsService,
    private readonly stats: StatsService,
    private readonly dashboard: DashboardService,
  ) {}

  async getProfile(userId: string): Promise<{ profile: Record<string, unknown> }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    const ratingCount = await this.prisma.rating.count({ where: { rateeId: userId } });
    const profile = (user.driverProfile ?? {}) as unknown as Record<string, unknown>;
    const vehicles = await this.prisma.vehicle.findMany({ where: { driverId: userId } });
    const identityVerified = Boolean(profile.idVerified);
    const vehicleVerified = vehicles.some((v) => v.isVerified);
    return {
      profile: {
        user: {
          id: user.id,
          full_name: user.fullName,
          phone: maskPhone(user.phone),
          role: user.role,
          status: user.status,
          avg_rating: Number(user.avgRating ?? 0),
        },
        driver: {
          id_verified: Boolean(profile.idVerified),
          license_expiry: (profile.licenseExpiry as string | Date | null | undefined)
            ? toDateOnly(profile.licenseExpiry as Date | string)
            : null,
          total_trips: (profile.totalTrips as number) || 0,
          total_earnings: Number(profile.totalEarnings || 0),
          response_rate: Number(profile.responseRate || 0),
          national_id: maskNationalId(profile.nationalID as string | null | undefined),
        },
        verification: {
          identity_verified: identityVerified,
          vehicle_verified: vehicleVerified,
          fully_verified: identityVerified && vehicleVerified,
        },
        vehicles: vehicles.map((v) => ({
          id: v.id,
          manufacturer: v.manufacturer,
          model: v.model,
          vehicle_type: v.vehicleType,
          model_year: v.modelYear,
          plate_number: v.plateNumber,
          code_number: v.codeNumber,
          color: v.color,
          seats: v.seats,
          is_verified: v.isVerified,
        })),
        ratings_summary: {
          avg: Number(user.avgRating ?? 0),
          count: ratingCount,
        },
      },
    };
  }

  getFullProfile(driverId: string): Promise<Record<string, unknown>> {
    return this.profiles.getFullProfile(driverId);
  }

  getPersonalData(userId: string): Promise<{
    personal_data: Record<string, unknown>;
    vehicle: Record<string, unknown> | null;
    editable_now: string[];
    locked_fields: string[];
    rejected_fields: string[];
  }> {
    return this.personalData.buildPersonalDataView(userId);
  }

  updatePersonalData(userId: string, payload: PersonalDataPayload): Promise<Record<string, unknown>> {
    return this.personalData.updatePersonalData(userId, payload);
  }

  getAccountStatus(driverId: string): Promise<Record<string, unknown>> {
    return this.profiles.getAccountStatus(driverId);
  }

  requestDeleteAccount(
    userId: string,
    opts: { reason?: string | null; confirmation?: boolean },
  ): Promise<{ request_id: string; status: string; estimated_completion: Date }> {
    return this.deletion.requestDeletion(userId, opts);
  }

  cancelDeleteAccount(userId: string): Promise<{ request_id: string; status: string }> {
    return this.deletion.cancelDeletionRequest(userId);
  }

  getPenalties(
    userId: string,
    filters: { active?: string; page?: unknown; limit?: unknown },
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.penalties.listForDriver(userId, filters);
  }

  getEarnings(
    userId: string,
    filters: { period?: string; from?: string; to?: string },
  ): Promise<{
    period: string;
    currency: string;
    total: number;
    breakdown: { bucket: string; earnings: number; trips: number }[];
  }> {
    return this.earnings.aggregate(userId, filters);
  }

  getStats(userId: string): Promise<{
    stats: {
      total_trips: number;
      total_bookings: number;
      no_show_rate: number;
      response_rate: number;
      avg_rating: number;
      total_earnings: number;
      completed_trips: number;
      cancelled_trips: number;
    };
  }> {
    return this.stats.lifetime(userId);
  }

  getDashboard(userId: string): Promise<Record<string, unknown>> {
    return this.dashboard.getDashboard(userId);
  }
}
