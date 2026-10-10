import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

// Port of Main Server/Services/verificationService.ts: status-change audit,
// admin alerts, admin queue, and the four admin approve/reject operations.
// The admin HTTP surface lives in AdminVerificationController (registered
// early for the driver resubmit flow; Wave 7 must not duplicate it).
const DRIVER_DOC_LABELS: [string, string][] = [
  ['userIdentificationFront', 'national_id_front'],
  ['userIdentificationBack', 'national_id_back'],
  ['linceseFront', 'license_front'],
  ['linceseBack', 'license_back'],
  ['personalImageWithId', 'personal_with_id'],
];

const VEHICLE_DOC_LABELS: [string, string][] = [
  ['registrationDocFront', 'registration_doc_front'],
  ['registrationDocBack', 'registration_doc_back'],
  ['vehiclePhotoFront', 'vehicle_photo_front'],
  ['vehiclePhotoBack', 'vehicle_photo_back'],
];

type Tx = Prisma.TransactionClient;

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async recordStatusChange(
    driverId: string,
    fromStatus: string | null,
    toStatus: string,
    opts: { reason?: string | null; markedFields?: string[] | null; changedBy?: string | null; tx?: Tx } = {},
  ): Promise<unknown> {
    const db = opts.tx ?? this.prisma;
    return db.verificationStatusChange.create({
      data: {
        driverId,
        fromStatus: (fromStatus ?? undefined) as
          | 'unverified'
          | 'pending'
          | 'rejected'
          | 'approved'
          | undefined,
        toStatus: toStatus as 'unverified' | 'pending' | 'rejected' | 'approved',
        reason: opts.reason ?? null,
        markedFields: (opts.markedFields ?? null) as never,
        changedBy: opts.changedBy ?? null,
      },
    });
  }

  async alertAdminsOfNewSubmission(driverId: string, fullName?: string | null): Promise<number> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'admin', status: 'active' },
      });
      for (const admin of admins) {
        await this.notifications.sendToUser(
          admin as unknown as { id: string; phone?: string | null; fcmToken?: string | null; locale?: string | null },
          'ADMIN_VERIFICATION_NEW',
          {
            channels: ['in_app', 'push'],
            vars: { driver_name: fullName ?? 'A driver' },
            data: { driver_id: driverId },
          },
        );
      }
      return admins.length;
    } catch (err) {
      this.logger.warn(`[verification] admin alert failed: ${(err as Error).message}`);
      return 0;
    }
  }

  private async resolveImageUrls(imageIds: (number | null | undefined)[]): Promise<Map<number, string>> {
    const ids = [...new Set(imageIds.filter((id): id is number => typeof id === 'number'))];
    if (ids.length === 0) return new Map();
    const images = await this.prisma.uploadedImage.findMany({ where: { id: { in: ids } } });
    return new Map(images.map((img) => [img.id, img.url]));
  }

  private buildDocuments(
    record: Record<string, unknown>,
    labels: [string, string][],
    urls: Map<number, string>,
  ): { label: string; url: string }[] {
    const documents: { label: string; url: string }[] = [];
    for (const [field, label] of labels) {
      const imageId = record[field] as number | null | undefined;
      if (imageId && urls.has(imageId)) documents.push({ label, url: urls.get(imageId) as string });
    }
    return documents;
  }

  async getQueue(filters: { status?: string; search?: string; page?: unknown; limit?: unknown } = {}): Promise<{
    requests: Record<string, unknown>[];
    meta: Record<string, unknown>;
  }> {
    const { page, limit, offset } = parsePagination(filters);
    const where: Prisma.UserWhereInput = {};
    if (['pending', 'approved', 'rejected', 'unverified'].includes(filters.status ?? '')) {
      where.verificationStatus = filters.status as 'pending' | 'approved' | 'rejected' | 'unverified';
    }
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ verificationSubmittedAt: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    const driverIds = users.map((u) => u.id);
    const profiles = driverIds.length
      ? await this.prisma.driverProfile.findMany({ where: { driverId: { in: driverIds } } })
      : [];
    const vehicles = driverIds.length
      ? await this.prisma.vehicle.findMany({ where: { driverId: { in: driverIds } } })
      : [];
    const profileMap = new Map(profiles.map((p) => [p.driverId, p]));
    const vehicleMap = new Map(vehicles.map((v) => [v.driverId, v]));
    const urls = await this.resolveImageUrls([
      ...profiles.flatMap((p) => DRIVER_DOC_LABELS.map(([f]) => (p as unknown as Record<string, number | null>)[f])),
      ...vehicles.flatMap((v) => VEHICLE_DOC_LABELS.map(([f]) => (v as unknown as Record<string, number | null>)[f])),
    ]);
    const requests = users.map((u) => {
      const p = profileMap.get(u.id) as unknown as Record<string, unknown> | undefined;
      const v = vehicleMap.get(u.id) as unknown as Record<string, unknown> | undefined;
      return {
        id: u.id,
        status: { value: u.verificationStatus, submitted_at: u.verificationSubmittedAt },
        driver: {
          user_id: u.id,
          full_name: u.fullName,
          phone: maskPhone(u.phone),
          profile_id: p?.id ?? null,
          national_id: (p?.nationalID as string | null) ?? null,
          license_number: (p?.licenseNumber as string | null) ?? null,
          user_identification_front: (p?.userIdentificationFront as number | null) ?? null,
          user_identification_back: (p?.userIdentificationBack as number | null) ?? null,
          lincese_front: (p?.linceseFront as number | null) ?? null,
          lincese_back: (p?.linceseBack as number | null) ?? null,
          personal_image_with_id: (p?.personalImageWithId as number | null) ?? null,
        },
        vehicle: v
          ? {
              vehicle_id: v.id,
              manufacturer: v.manufacturer,
              model: v.model,
              vehicle_type: v.vehicleType,
              model_year: v.modelYear,
              plate_number: v.plateNumber,
              code_number: v.codeNumber,
              color: v.color,
              seats: v.seats,
              registration_doc_front: v.registrationDocFront,
              registration_doc_back: v.registrationDocBack,
              vehicle_photo_front: v.vehiclePhotoFront,
              vehicle_photo_back: v.vehiclePhotoBack,
            }
          : null,
        documents: [
          ...(p ? this.buildDocuments(p, DRIVER_DOC_LABELS, urls) : []),
          ...(v ? this.buildDocuments(v, VEHICLE_DOC_LABELS, urls) : []),
        ],
      };
    });
    return { requests, meta: buildPagination(count, page, limit) };
  }

  private async syncUserVerification(driverId: string): Promise<{ fullyVerified: boolean }> {
    const [profile, vehicle] = await Promise.all([
      this.prisma.driverProfile.findFirst({ where: { driverId } }),
      this.prisma.vehicle.findFirst({ where: { driverId } }),
    ]);
    const fullyVerified = Boolean(profile?.idVerified) && Boolean(vehicle?.isVerified);
    await this.prisma.user.update({ where: { id: driverId }, data: { isVerified: fullyVerified } });
    return { fullyVerified };
  }

  async approveDriver(
    adminId: string,
    driverId: string,
  ): Promise<{ driver_id: string; id_verified: boolean; notified: boolean }> {
    const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });
    if (!profile) throw new NotFoundException({ message: 'DRIVER_PROFILE_NOT_FOUND', code: 'DRIVER_PROFILE_NOT_FOUND' });
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
    const fromStatus = user.verificationStatus;
    const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
    await this.prisma.driverProfile.update({ where: { id: profile.id }, data: { idVerified: true } });
    if (vehicle) {
      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { isVerified: true, verifiedBy: adminId, verifiedAt: new Date() },
      });
    }
    await this.prisma.user.update({
      where: { id: driverId },
      data: { isVerified: true, verificationStatus: 'approved' },
    });
    await this.recordStatusChange(driverId, fromStatus, 'approved', { changedBy: adminId });
    await this.notifications.sendToUser(
      user as unknown as { id: string; phone?: string | null; fcmToken?: string | null; locale?: string | null },
      'VERIFICATION_APPROVED',
      { channels: ['in_app', 'push'], vars: { subject: 'identity documents' }, data: { driver_id: driverId } },
    );
    return { driver_id: driverId, id_verified: true, notified: true };
  }

  async rejectDriver(
    adminId: string,
    driverId: string,
    reason: string,
    fieldsToFix?: string[],
  ): Promise<{ driver_id: string; id_verified: boolean; reason: string; notified: boolean }> {
    const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });
    if (!profile) throw new NotFoundException({ message: 'DRIVER_PROFILE_NOT_FOUND', code: 'DRIVER_PROFILE_NOT_FOUND' });
    const user = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!user) throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
    const fromStatus = user.verificationStatus;
    const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
    await this.prisma.driverProfile.update({ where: { id: profile.id }, data: { idVerified: false } });
    if (vehicle) {
      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          isVerified: false,
          verificationNotes: reason,
          verificationRejectionReason: reason,
          verificationRejectedAt: new Date(),
        },
      });
    }
    await this.prisma.user.update({
      where: { id: driverId },
      data: {
        isVerified: false,
        verificationStatus: 'rejected',
        verificationRejectedAt: new Date(),
        verificationRejectionReason: reason,
        verificationRejectionFields: (fieldsToFix ?? []) as never,
      },
    });
    await this.recordStatusChange(driverId, fromStatus, 'rejected', {
      reason,
      markedFields: fieldsToFix ?? [],
      changedBy: adminId,
    });
    await this.notifications.sendToUser(
      user as unknown as { id: string; phone?: string | null; fcmToken?: string | null; locale?: string | null },
      'VERIFICATION_REJECTED',
      {
        channels: ['in_app', 'push'],
        vars: { subject: 'identity documents', reason },
        data: { driver_id: driverId, reason, fields_to_fix: fieldsToFix ?? [] },
      },
    );
    return { driver_id: driverId, id_verified: false, reason, notified: true };
  }

  async approveVehicle(
    adminId: string,
    vehicleId: string,
  ): Promise<{ vehicle_id: string; is_verified: boolean; notified: boolean }> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException({ message: 'VEHICLE_NOT_FOUND', code: 'VEHICLE_NOT_FOUND' });
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { isVerified: true, verifiedBy: adminId, verifiedAt: new Date() },
    });
    const { fullyVerified } = await this.syncUserVerification(vehicle.driverId);
    const owner = await this.prisma.user.findUnique({ where: { id: vehicle.driverId } });
    if (owner && fullyVerified && owner.verificationStatus !== 'rejected') {
      const fromStatus = owner.verificationStatus;
      await this.prisma.user.update({
        where: { id: owner.id },
        data: { verificationStatus: 'approved' },
      });
      await this.recordStatusChange(owner.id, fromStatus, 'approved', { changedBy: adminId });
    }
    if (owner) {
      await this.notifications.sendToUser(
        owner as unknown as { id: string; phone?: string | null; fcmToken?: string | null; locale?: string | null },
        'VERIFICATION_APPROVED',
        { channels: ['in_app', 'push'], vars: { subject: 'vehicle' }, data: { vehicle_id: vehicleId } },
      );
    }
    return { vehicle_id: vehicleId, is_verified: true, notified: true };
  }

  async rejectVehicle(
    adminId: string,
    vehicleId: string,
    reason: string,
    fieldsToFix?: string[],
  ): Promise<{ vehicle_id: string; is_verified: boolean; reason: string; notified: boolean }> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException({ message: 'VEHICLE_NOT_FOUND', code: 'VEHICLE_NOT_FOUND' });
    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        isVerified: false,
        verificationNotes: reason,
        verificationRejectionReason: reason,
        verificationRejectedAt: new Date(),
      },
    });
    await this.syncUserVerification(vehicle.driverId);
    const owner = await this.prisma.user.findUnique({ where: { id: vehicle.driverId } });
    if (owner) {
      const fromStatus = owner.verificationStatus;
      await this.prisma.user.update({
        where: { id: owner.id },
        data: {
          isVerified: false,
          verificationStatus: 'rejected',
          verificationRejectedAt: new Date(),
          verificationRejectionReason: reason,
          verificationRejectionFields: (fieldsToFix ?? []) as never,
        },
      });
      await this.recordStatusChange(owner.id, fromStatus, 'rejected', {
        reason,
        markedFields: fieldsToFix ?? [],
        changedBy: adminId,
      });
      await this.notifications.sendToUser(
        owner as unknown as { id: string; phone?: string | null; fcmToken?: string | null; locale?: string | null },
        'VERIFICATION_REJECTED',
        {
          channels: ['in_app', 'push'],
          vars: { subject: 'vehicle', reason },
          data: { vehicle_id: vehicleId, reason, fields_to_fix: fieldsToFix ?? [] },
        },
      );
    }
    return { vehicle_id: vehicleId, is_verified: false, reason, notified: true };
  }
}
