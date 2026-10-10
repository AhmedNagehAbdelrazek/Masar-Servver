import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  canEditVerification,
  computeVerificationStatus,
  guardVerificationSubmission,
} from './verification-state.js';
import { VerificationService } from './verification.service.js';

const DRIVER_DOC_FIELDS = [
  'user_identification_front',
  'user_identification_back',
  'lincese_front',
  'lincese_back',
  'personal_image_with_id',
] as const;

const VEHICLE_DOC_FIELDS = [
  'registration_doc_front',
  'registration_doc_back',
  'vehicle_photo_front',
  'vehicle_photo_back',
] as const;

export interface VerificationPackage {
  full_name?: string;
  national_id?: string;
  license_number?: string;
  license_expiry?: string;
  user_identification_front?: number;
  user_identification_back?: number;
  lincese_front?: number;
  lincese_back?: number;
  personal_image_with_id?: number;
  vehicle?: {
    manufacturer: string;
    model: string;
    vehicle_type: string;
    model_year?: number;
    plate_number: string;
    code_number?: string;
    color?: string;
    seats: number;
    registration_doc_front?: number;
    registration_doc_back?: number;
    vehicle_photo_front?: number;
    vehicle_photo_back?: number;
  };
}

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

// Port of Main Server/Services/driverVerificationService.ts (driver-facing).
@Injectable()
export class DriverVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verification: VerificationService,
  ) {}

  private async loadDriverData(driverId: string): Promise<{
    user: Record<string, unknown>;
    profile: Record<string, unknown> | null;
    vehicle: Record<string, unknown> | null;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
    const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });
    const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
    return {
      user: user as unknown as Record<string, unknown>,
      profile: profile as unknown as Record<string, unknown> | null,
      vehicle: vehicle as unknown as Record<string, unknown> | null,
    };
  }

  private buildDriverPayload(
    user: Record<string, unknown>,
    profile: Record<string, unknown> | null,
  ): Record<string, unknown> {
    return {
      full_name: (user.fullName as string | null) ?? null,
      national_id: (profile?.nationalID as string | null) ?? null,
      license_number: (profile?.licenseNumber as string | null) ?? null,
      license_expiry: toDateOnly(profile?.licenseExpiry as Date | string | null | undefined),
      user_identification_front: (profile?.userIdentificationFront as number | null) ?? null,
      user_identification_back: (profile?.userIdentificationBack as number | null) ?? null,
      lincese_front: (profile?.linceseFront as number | null) ?? null,
      lincese_back: (profile?.linceseBack as number | null) ?? null,
      personal_image_with_id: (profile?.personalImageWithId as number | null) ?? null,
    };
  }

  private buildVehiclePayload(vehicle: Record<string, unknown> | null): Record<string, unknown> {
    if (!vehicle) {
      return {
        id: null,
        manufacturer: null,
        model: null,
        vehicle_type: null,
        model_year: null,
        plate_number: null,
        code_number: null,
        color: null,
        seats: null,
        registration_doc_front: null,
        registration_doc_back: null,
        vehicle_photo_front: null,
        vehicle_photo_back: null,
      };
    }
    return {
      id: vehicle.id,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      vehicle_type: vehicle.vehicleType,
      model_year: vehicle.modelYear,
      plate_number: vehicle.plateNumber,
      code_number: vehicle.codeNumber,
      color: vehicle.color,
      seats: vehicle.seats,
      registration_doc_front: vehicle.registrationDocFront,
      registration_doc_back: vehicle.registrationDocBack,
      vehicle_photo_front: vehicle.vehiclePhotoFront,
      vehicle_photo_back: vehicle.vehiclePhotoBack,
    };
  }

  async getStatus(driverId: string): Promise<Record<string, unknown>> {
    const { user, profile, vehicle } = await this.loadDriverData(driverId);
    const status = computeVerificationStatus(
      {
        verificationStatus: user.verificationStatus as string,
        verificationRejectedAt: (user.verificationRejectedAt as Date | null) ?? null,
      },
      profile ? { idVerified: Boolean(profile.idVerified) } : null,
      vehicle
        ? {
            isVerified: Boolean(vehicle.isVerified),
            verificationRejectedAt: (vehicle.verificationRejectedAt as Date | null) ?? null,
          }
        : null,
    );
    return {
      status: {
        value: status,
        can_edit: canEditVerification(status),
        submitted_at:
          (user.verificationSubmittedAt as Date | null) ??
          (profile?.createdAt as Date | null) ??
          (vehicle?.createdAt as Date | null) ??
          null,
        rejected_at:
          (user.verificationRejectedAt as Date | null) ??
          (vehicle?.verificationRejectedAt as Date | null) ??
          null,
        rejection_reason:
          (user.verificationRejectionReason as string | null) ??
          (vehicle?.verificationRejectionReason as string | null) ??
          null,
        fields_to_fix: (user.verificationRejectionFields as string[] | null) ?? [],
      },
      driver: this.buildDriverPayload(user, profile),
      vehicle: this.buildVehiclePayload(vehicle),
    };
  }

  async getSubmission(driverId: string): Promise<Record<string, unknown>> {
    const { user, profile, vehicle } = await this.loadDriverData(driverId);
    return {
      driver: this.buildDriverPayload(user, profile),
      vehicle: this.buildVehiclePayload(vehicle),
    };
  }

  private async verifyDocumentIds(body: VerificationPackage): Promise<void> {
    const docIds = [
      ...DRIVER_DOC_FIELDS.map((f) => body[f]),
      ...VEHICLE_DOC_FIELDS.map((f) => body.vehicle?.[f]),
    ].filter((id): id is number => id !== undefined && id !== null);
    if (docIds.length === 0) return;
    const uniqueIds = [...new Set(docIds)];
    const found = await this.prisma.uploadedImage.findMany({ where: { id: { in: uniqueIds } } });
    if (found.length !== uniqueIds.length) {
      throw new UnprocessableEntityException({
        message: 'VALIDATION_FAILED',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'documents', message: 'ONE_OR_MORE_UPLOADED_DOCUMENT_IDS_DO_NOT_EXIST' }],
      });
    }
  }

  async submitOrResubmit(
    driverId: string,
    body: VerificationPackage,
  ): Promise<{ status: string; submitted_at: Date }> {
    const { user, profile, vehicle } = await this.loadDriverData(driverId);
    const currentStatus = computeVerificationStatus(
      {
        verificationStatus: user.verificationStatus as string,
        verificationRejectedAt: (user.verificationRejectedAt as Date | null) ?? null,
      },
      profile ? { idVerified: Boolean(profile.idVerified) } : null,
      vehicle
        ? {
            isVerified: Boolean(vehicle.isVerified),
            verificationRejectedAt: (vehicle.verificationRejectedAt as Date | null) ?? null,
          }
        : null,
    );
    guardVerificationSubmission(currentStatus);
    await this.verifyDocumentIds(body);

    const submittedAt = new Date();
    try {
      await this.prisma.$transaction(async (tx) => {
        const profileData: Prisma.DriverProfileUpdateInput = {
          nationalID: body.national_id !== undefined ? body.national_id : ((profile?.nationalID as string | null) ?? null),
          licenseNumber: body.license_number !== undefined ? body.license_number : ((profile?.licenseNumber as string | null) ?? null),
          licenseExpiry:
            body.license_expiry !== undefined
              ? new Date(body.license_expiry)
              : ((profile?.licenseExpiry as Date | null) ?? null),
          userIdentificationFront:
            body.user_identification_front !== undefined
              ? body.user_identification_front
              : ((profile?.userIdentificationFront as number | null) ?? null),
          userIdentificationBack:
            body.user_identification_back !== undefined
              ? body.user_identification_back
              : ((profile?.userIdentificationBack as number | null) ?? null),
          linceseFront:
            body.lincese_front !== undefined
              ? body.lincese_front
              : ((profile?.linceseFront as number | null) ?? null),
          linceseBack:
            body.lincese_back !== undefined
              ? body.lincese_back
              : ((profile?.linceseBack as number | null) ?? null),
          personalImageWithId:
            body.personal_image_with_id !== undefined
              ? body.personal_image_with_id
              : ((profile?.personalImageWithId as number | null) ?? null),
        };
        if (profile) {
          await tx.driverProfile.update({ where: { id: profile.id as string }, data: profileData });
        } else {
          // No existing profile: only body values apply (all nullable).
          await tx.driverProfile.create({
            data: {
              driverId,
              nationalID: body.national_id ?? null,
              licenseNumber: body.license_number ?? null,
              licenseExpiry: body.license_expiry !== undefined ? new Date(body.license_expiry) : null,
              userIdentificationFront: body.user_identification_front ?? null,
              userIdentificationBack: body.user_identification_back ?? null,
              linceseFront: body.lincese_front ?? null,
              linceseBack: body.lincese_back ?? null,
              personalImageWithId: body.personal_image_with_id ?? null,
            },
          });
        }

        const v = body.vehicle ?? {};
        const vehicleData = {
          driverId,
          manufacturer: (v as Record<string, unknown>).manufacturer as string,
          model: (v as Record<string, unknown>).model as string,
          vehicleType: (v as Record<string, unknown>).vehicle_type as
            | 'sedan'
            | 'suv'
            | 'van'
            | 'bus'
            | 'hatchback',
          modelYear:
            (v as Record<string, unknown>).model_year !== undefined
              ? ((v as Record<string, unknown>).model_year as number)
              : ((vehicle?.modelYear as number | null) ?? null),
          plateNumber: (v as Record<string, unknown>).plate_number as string,
          codeNumber:
            (v as Record<string, unknown>).code_number !== undefined
              ? ((v as Record<string, unknown>).code_number as string | null)
              : ((vehicle?.codeNumber as string | null) ?? null),
          color:
            (v as Record<string, unknown>).color !== undefined
              ? ((v as Record<string, unknown>).color as string | null)
              : ((vehicle?.color as string | null) ?? null),
          seats: (v as Record<string, unknown>).seats as number,
          registrationDocFront:
            (v as Record<string, unknown>).registration_doc_front !== undefined
              ? ((v as Record<string, unknown>).registration_doc_front as number)
              : ((vehicle?.registrationDocFront as number | null) ?? null),
          registrationDocBack:
            (v as Record<string, unknown>).registration_doc_back !== undefined
              ? ((v as Record<string, unknown>).registration_doc_back as number)
              : ((vehicle?.registrationDocBack as number | null) ?? null),
          vehiclePhotoFront:
            (v as Record<string, unknown>).vehicle_photo_front !== undefined
              ? ((v as Record<string, unknown>).vehicle_photo_front as number)
              : ((vehicle?.vehiclePhotoFront as number | null) ?? null),
          vehiclePhotoBack:
            (v as Record<string, unknown>).vehicle_photo_back !== undefined
              ? ((v as Record<string, unknown>).vehicle_photo_back as number)
              : ((vehicle?.vehiclePhotoBack as number | null) ?? null),
          isVerified: false,
          verificationNotes: null,
          verificationRejectionReason: null,
          verificationRejectedAt: null,
          verifiedBy: null,
          verifiedAt: null,
        };
        if (vehicle) {
          await tx.vehicle.update({ where: { id: vehicle.id as string }, data: vehicleData });
        } else {
          await tx.vehicle.create({ data: vehicleData });
        }

        if (body.full_name !== undefined) {
          await tx.user.update({ where: { id: driverId }, data: { fullName: body.full_name } });
        }
        await tx.user.update({
          where: { id: driverId },
          data: {
            verificationStatus: 'pending',
            verificationSubmittedAt: submittedAt,
            isVerified: false,
            verificationRejectedAt: null,
            verificationRejectionReason: null,
            verificationRejectionFields: [],
          },
        });
        await this.verification.recordStatusChange(driverId, currentStatus, 'pending', { tx });
      });
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002') {
        const target = (err as { meta?: { target?: string[] } }).meta?.target?.join(' ') ?? '';
        const message = target.includes('driver_id')
          ? 'You already have a registered vehicle. Update it instead.'
          : target.includes('plate_number')
            ? 'This plate number is already registered to another vehicle.'
            : 'The vehicle could not be saved because a unique field already exists.';
        throw new UnprocessableEntityException({
          message: 'VALIDATION_FAILED',
          code: 'VALIDATION_ERROR',
          details: [{ field: 'vehicle', message }],
        });
      }
      throw err;
    }

    const freshUser = await this.prisma.user.findUnique({ where: { id: driverId } });
    await this.verification.alertAdminsOfNewSubmission(driverId, (freshUser?.fullName as string | null) ?? (user.fullName as string | null));
    return { status: 'pending', submitted_at: submittedAt };
  }
}
