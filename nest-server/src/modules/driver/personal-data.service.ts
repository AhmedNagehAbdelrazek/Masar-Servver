import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ensureOperational, ensureReadable, loadDriverUser } from '../../common/access/user-access.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { canEditVerification } from './verification-state.js';

// Port of Main Server/Services/personalDataService.ts.
export const EDITABLE_ANYTIME = ['display_name', 'phone', 'age', 'avatar_url'];

export const LOCKED_WHEN_VERIFIED = [
  'full_name',
  'email',
  'national_id',
  'vehicle.manufacturer',
  'vehicle.model',
  'vehicle.model_year',
  'vehicle.color',
  'vehicle.plate_number',
  'vehicle.total_seats',
];

function genderLabel(gender: string | null | undefined): string | null {
  if (gender === 'male') return 'ذكر';
  if (gender === 'female') return 'أنثى';
  return null;
}

export interface PersonalDataPayload {
  full_name?: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string;
  age?: number | null;
  avatar_url?: string | null;
  national_id?: string;
  vehicle?: {
    manufacturer?: string;
    model?: string;
    model_year?: number;
    color?: string;
    plate_number?: string;
    total_seats?: number;
  };
}

@Injectable()
export class PersonalDataService {
  constructor(private readonly prisma: PrismaService) {}

  async buildPersonalDataView(userId: string): Promise<{
    personal_data: Record<string, unknown>;
    vehicle: Record<string, unknown> | null;
    editable_now: string[];
    locked_fields: string[];
    rejected_fields: string[];
  }> {
    const user = (await loadDriverUser(this.prisma, userId)) as unknown as Record<string, unknown>;
    ensureReadable({ status: user.status as string });
    const [driverProfile, vehicle] = await Promise.all([
      this.prisma.driverProfile.findFirst({ where: { driverId: userId } }),
      this.prisma.vehicle.findFirst({ where: { driverId: userId } }),
    ]);

    let lockedFields: string[] = [];
    let rejectedFields: string[] = [];
    if (user.verificationStatus === 'pending' || user.verificationStatus === 'approved') {
      lockedFields = [...LOCKED_WHEN_VERIFIED];
    } else if (user.verificationStatus === 'rejected') {
      rejectedFields = Array.isArray(user.verificationRejectionFields)
        ? (user.verificationRejectionFields as string[])
        : [];
    }

    return {
      personal_data: {
        full_name: (user.fullName as string | null) ?? null,
        display_name: (user.displayName as string | null) ?? null,
        country_code: (user.countryCode as string | null) ?? '+962',
        phone: (user.phone as string | null) ?? null,
        email: (user.email as string | null) ?? null,
        email_verified: false,
        age: user.age == null ? null : Number(user.age),
        gender: (user.gender as string | null) ?? null,
        gender_label: genderLabel(user.gender as string | null),
        avatar_url: (user.avatarUrl as string | null) ?? null,
        national_id: (driverProfile?.nationalID as string | null) ?? null,
      },
      vehicle: vehicle
        ? {
            id: vehicle.id,
            manufacturer: vehicle.manufacturer ?? null,
            model: vehicle.model ?? null,
            model_year: vehicle.modelYear ?? null,
            color: vehicle.color ?? null,
            plate_number: vehicle.plateNumber ?? null,
            total_seats: vehicle.seats ?? null,
          }
        : null,
      editable_now: [...EDITABLE_ANYTIME],
      locked_fields: lockedFields,
      rejected_fields: rejectedFields,
    };
  }

  private async assertUniqueness(userId: string, payload: PersonalDataPayload): Promise<void> {
    if (payload.email) {
      const clash = await this.prisma.user.findFirst({
        where: { email: payload.email, id: { not: userId } },
      });
      if (clash) {
        throw new ConflictException({ message: 'EMAIL_ALREADY_IN_USE', code: 'EMAIL_ALREADY_IN_USE' });
      }
    }
    if (payload.phone) {
      const clash = await this.prisma.user.findFirst({
        where: { phone: payload.phone, id: { not: userId } },
      });
      if (clash) {
        throw new ConflictException({ message: 'PHONE_ALREADY_IN_USE', code: 'PHONE_ALREADY_IN_USE' });
      }
    }
    if (payload.vehicle?.plate_number) {
      const clash = await this.prisma.vehicle.findFirst({
        where: { plateNumber: payload.vehicle.plate_number, driverId: { not: userId } },
      });
      if (clash) {
        throw new ConflictException({
          message: 'PLATE_NUMBER_ALREADY_IN_USE',
          code: 'PLATE_ALREADY_IN_USE',
        });
      }
    }
  }

  async updatePersonalData(
    userId: string,
    payload: PersonalDataPayload,
  ): Promise<Record<string, unknown>> {
    await this.assertUniqueness(userId, payload);
    const user = await loadDriverUser(this.prisma, userId);
    ensureOperational(user);

    const editable = canEditVerification(await this.statusOf(userId));
    if (!editable) {
      const attempts = this.extractLockedAttempts(payload);
      if (attempts.length > 0) {
        throw new ForbiddenException({
          message: 'LOCKED_FIELDS_CANNOT_BE_MODIFIED',
          code: 'FIELD_LOCKED',
          params: { fields: attempts.join(', ') },
        });
      }
    }

    const userAttrs: Record<string, unknown> = {};
    if (payload.full_name !== undefined) userAttrs.fullName = payload.full_name;
    if (payload.display_name !== undefined) userAttrs.displayName = payload.display_name;
    if (payload.email !== undefined) userAttrs.email = payload.email || null;
    if (payload.phone !== undefined) userAttrs.phone = payload.phone;
    if (payload.age !== undefined) userAttrs.age = payload.age;
    if (payload.avatar_url !== undefined) userAttrs.avatarUrl = payload.avatar_url;

    const identityChanged = Boolean(
      payload.full_name !== undefined ||
        payload.national_id !== undefined ||
        (payload.vehicle && Object.keys(payload.vehicle).length > 0),
    );

    if (Object.keys(userAttrs).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: userAttrs as never });
    }

    if (payload.national_id !== undefined) {
      await this.prisma.driverProfile.upsert({
        where: { driverId: userId },
        update: { nationalID: payload.national_id },
        create: { driverId: userId, nationalID: payload.national_id },
      });
    }

    if (payload.vehicle && typeof payload.vehicle === 'object') {
      const v = payload.vehicle;
      const vehicleAttrs: Record<string, unknown> = {};
      if (v.manufacturer !== undefined) vehicleAttrs.manufacturer = v.manufacturer;
      if (v.model !== undefined) vehicleAttrs.model = v.model;
      if (v.model_year !== undefined) vehicleAttrs.modelYear = v.model_year;
      if (v.color !== undefined) vehicleAttrs.color = v.color;
      if (v.plate_number !== undefined) vehicleAttrs.plateNumber = v.plate_number;
      if (v.total_seats !== undefined) vehicleAttrs.seats = v.total_seats;
      if (Object.keys(vehicleAttrs).length > 0) {
        const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId: userId } });
        if (vehicle) {
          await this.prisma.vehicle.update({ where: { id: vehicle.id }, data: vehicleAttrs as never });
        } else {
          // Vehicle requires manufacturer/model/type/plate/seats in Express;
          // personal-data edits only patch when a vehicle exists.
          if (
            vehicleAttrs.manufacturer !== undefined &&
            vehicleAttrs.model !== undefined &&
            vehicleAttrs.plateNumber !== undefined &&
            vehicleAttrs.seats !== undefined
          ) {
            await this.prisma.vehicle.create({
              data: {
                driverId: userId,
                manufacturer: vehicleAttrs.manufacturer as string,
                model: vehicleAttrs.model as string,
                vehicleType: 'sedan',
                plateNumber: vehicleAttrs.plateNumber as string,
                seats: vehicleAttrs.seats as number,
                ...(vehicleAttrs.modelYear !== undefined ? { modelYear: vehicleAttrs.modelYear as number } : {}),
                ...(vehicleAttrs.color !== undefined ? { color: vehicleAttrs.color as string } : {}),
              },
            });
          }
        }
      }
    }

    let requiresVerification = false;
    if (identityChanged && editable) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: 'pending', verificationSubmittedAt: new Date() },
      });
      requiresVerification = true;
    }

    const view = await this.buildPersonalDataView(userId);
    const fresh = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      ...view,
      verification_status: fresh?.verificationStatus,
      requires_verification: requiresVerification,
      message: requiresVerification ? 'تم تحديث بياناتك وإرسالها للمراجعة' : 'تم تحديث البيانات بنجاح',
    };
  }

  private extractLockedAttempts(payload: PersonalDataPayload): string[] {
    const attempts: string[] = [];
    if (payload.full_name !== undefined) attempts.push('full_name');
    if (payload.email !== undefined) attempts.push('email');
    if (payload.national_id !== undefined) attempts.push('national_id');
    if (payload.vehicle && typeof payload.vehicle === 'object') {
      for (const key of Object.keys(payload.vehicle)) {
        if ((payload.vehicle as Record<string, unknown>)[key] !== undefined) {
          attempts.push(`vehicle.${key}`);
        }
      }
    }
    return attempts;
  }

  private async statusOf(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true },
    });
    return user?.verificationStatus ?? 'unverified';
  }
}
