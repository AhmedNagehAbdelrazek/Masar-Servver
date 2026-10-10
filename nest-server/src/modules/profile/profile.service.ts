import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

// Port of Main Server/Services/passengerProfileService.ts (minus
// getPassengerHome, which needs homeService — Wave 4).
@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(passengerId: string): Promise<{
    passenger_profile: {
      full_name: string | null;
      age: number | null;
      gender: string | null;
      phone: string | null;
      national_id: string | null;
      home_address: string | null;
    };
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: passengerId } });
    const profile = await this.prisma.passengerProfile.upsert({
      where: { passengerId },
      update: {},
      create: { passengerId },
    });
    if (!user) throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
    return {
      passenger_profile: {
        full_name: user.fullName ?? null,
        age: user.age === null || user.age === undefined ? null : Number(user.age),
        gender: user.gender ?? null,
        phone: user.phone ?? null,
        national_id: profile.nationalID ?? null,
        home_address: profile.homeAddress ?? null,
      },
    };
  }

  async updateMyProfile(
    passengerId: string,
    payload: {
      preferred_gender?: string;
      smoking_preference?: string;
      saved_routes?: unknown;
      national_id?: string;
      home_address?: string;
      emergency_contacts?: unknown;
    },
  ): Promise<{ passenger_profile: Record<string, unknown> }> {
    const profile = await this.prisma.passengerProfile.upsert({
      where: { passengerId },
      update: {},
      create: { passengerId },
    });
    const updates: Record<string, unknown> = {};
    if (payload.preferred_gender !== undefined) updates.preferredGender = payload.preferred_gender;
    if (payload.smoking_preference !== undefined) updates.smokingPreference = payload.smoking_preference;
    if (payload.saved_routes !== undefined) updates.savedRoutes = payload.saved_routes as never;
    if (payload.national_id !== undefined) updates.nationalID = payload.national_id;
    if (payload.home_address !== undefined) updates.homeAddress = payload.home_address;
    if (payload.emergency_contacts !== undefined) {
      updates.emergencyContacts = payload.emergency_contacts as never;
    }
    if (Object.keys(updates).length === 0) {
      throw new UnprocessableEntityException({
        message: 'VALIDATION_FAILED',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'body', message: 'No updatable fields provided' }],
      });
    }
    const updated = await this.prisma.passengerProfile.update({
      where: { passengerId },
      data: updates as never,
    });
    void profile;
    return {
      passenger_profile: {
        id: updated.id,
        passenger_id: updated.passengerId,
        preferred_gender: updated.preferredGender,
        smoking_preference: updated.smokingPreference,
        saved_routes: (updated.savedRoutes as unknown[]) ?? [],
        national_id: updated.nationalID ?? null,
        home_address: updated.homeAddress ?? null,
        emergency_contacts: (updated.emergencyContacts as unknown[]) ?? [],
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      },
    };
  }

  async getAccountSummary(passengerId: string): Promise<{
    account_summary: { type: string; count: number }[];
  }> {
    const [alerts, violations, sanctions, complaints] = await Promise.all([
      this.prisma.penalty.count({ where: { userId: passengerId, type: 'warning' } }),
      this.prisma.penalty.count({ where: { userId: passengerId, penaltyType: 'violation' } }),
      this.prisma.penalty.count({
        where: { userId: passengerId, type: { in: ['suspension', 'ban'] } },
      }),
      this.prisma.complaint.count({ where: { reporterId: passengerId } }),
    ]);
    return {
      account_summary: [
        { type: 'alerts', count: alerts },
        { type: 'violations', count: violations },
        { type: 'sanctions', count: sanctions },
        { type: 'complaints', count: complaints },
      ],
    };
  }
}
