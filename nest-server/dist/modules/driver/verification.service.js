var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VerificationService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { maskPhone } from '../../common/utils/masking.js';
import { buildPagination, parsePagination } from '../../common/utils/pagination.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
const DRIVER_DOC_LABELS = [
    ['userIdentificationFront', 'national_id_front'],
    ['userIdentificationBack', 'national_id_back'],
    ['linceseFront', 'license_front'],
    ['linceseBack', 'license_back'],
    ['personalImageWithId', 'personal_with_id'],
];
const VEHICLE_DOC_LABELS = [
    ['registrationDocFront', 'registration_doc_front'],
    ['registrationDocBack', 'registration_doc_back'],
    ['vehiclePhotoFront', 'vehicle_photo_front'],
    ['vehiclePhotoBack', 'vehicle_photo_back'],
];
let VerificationService = VerificationService_1 = class VerificationService {
    prisma;
    notifications;
    logger = new Logger(VerificationService_1.name);
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async recordStatusChange(driverId, fromStatus, toStatus, opts = {}) {
        const db = opts.tx ?? this.prisma;
        return db.verificationStatusChange.create({
            data: {
                driverId,
                fromStatus: (fromStatus ?? undefined),
                toStatus: toStatus,
                reason: opts.reason ?? null,
                markedFields: (opts.markedFields ?? null),
                changedBy: opts.changedBy ?? null,
            },
        });
    }
    async alertAdminsOfNewSubmission(driverId, fullName) {
        try {
            const admins = await this.prisma.user.findMany({
                where: { role: 'admin', status: 'active' },
            });
            for (const admin of admins) {
                await this.notifications.sendToUser(admin, 'ADMIN_VERIFICATION_NEW', {
                    channels: ['in_app', 'push'],
                    vars: { driver_name: fullName ?? 'A driver' },
                    data: { driver_id: driverId },
                });
            }
            return admins.length;
        }
        catch (err) {
            this.logger.warn(`[verification] admin alert failed: ${err.message}`);
            return 0;
        }
    }
    async resolveImageUrls(imageIds) {
        const ids = [...new Set(imageIds.filter((id) => typeof id === 'number'))];
        if (ids.length === 0)
            return new Map();
        const images = await this.prisma.uploadedImage.findMany({ where: { id: { in: ids } } });
        return new Map(images.map((img) => [img.id, img.url]));
    }
    buildDocuments(record, labels, urls) {
        const documents = [];
        for (const [field, label] of labels) {
            const imageId = record[field];
            if (imageId && urls.has(imageId))
                documents.push({ label, url: urls.get(imageId) });
        }
        return documents;
    }
    async getQueue(filters = {}) {
        const { page, limit, offset } = parsePagination(filters);
        const where = {};
        if (['pending', 'approved', 'rejected', 'unverified'].includes(filters.status ?? '')) {
            where.verificationStatus = filters.status;
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
            ...profiles.flatMap((p) => DRIVER_DOC_LABELS.map(([f]) => p[f])),
            ...vehicles.flatMap((v) => VEHICLE_DOC_LABELS.map(([f]) => v[f])),
        ]);
        const requests = users.map((u) => {
            const p = profileMap.get(u.id);
            const v = vehicleMap.get(u.id);
            return {
                id: u.id,
                status: { value: u.verificationStatus, submitted_at: u.verificationSubmittedAt },
                driver: {
                    user_id: u.id,
                    full_name: u.fullName,
                    phone: maskPhone(u.phone),
                    profile_id: p?.id ?? null,
                    national_id: p?.nationalID ?? null,
                    license_number: p?.licenseNumber ?? null,
                    user_identification_front: p?.userIdentificationFront ?? null,
                    user_identification_back: p?.userIdentificationBack ?? null,
                    lincese_front: p?.linceseFront ?? null,
                    lincese_back: p?.linceseBack ?? null,
                    personal_image_with_id: p?.personalImageWithId ?? null,
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
    async syncUserVerification(driverId) {
        const [profile, vehicle] = await Promise.all([
            this.prisma.driverProfile.findFirst({ where: { driverId } }),
            this.prisma.vehicle.findFirst({ where: { driverId } }),
        ]);
        const fullyVerified = Boolean(profile?.idVerified) && Boolean(vehicle?.isVerified);
        await this.prisma.user.update({ where: { id: driverId }, data: { isVerified: fullyVerified } });
        return { fullyVerified };
    }
    async approveDriver(adminId, driverId) {
        const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });
        if (!profile)
            throw new NotFoundException({ message: 'DRIVER_PROFILE_NOT_FOUND', code: 'DRIVER_PROFILE_NOT_FOUND' });
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user)
            throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
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
        await this.notifications.sendToUser(user, 'VERIFICATION_APPROVED', { channels: ['in_app', 'push'], vars: { subject: 'identity documents' }, data: { driver_id: driverId } });
        return { driver_id: driverId, id_verified: true, notified: true };
    }
    async rejectDriver(adminId, driverId, reason, fieldsToFix) {
        const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });
        if (!profile)
            throw new NotFoundException({ message: 'DRIVER_PROFILE_NOT_FOUND', code: 'DRIVER_PROFILE_NOT_FOUND' });
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user)
            throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
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
                verificationRejectionFields: (fieldsToFix ?? []),
            },
        });
        await this.recordStatusChange(driverId, fromStatus, 'rejected', {
            reason,
            markedFields: fieldsToFix ?? [],
            changedBy: adminId,
        });
        await this.notifications.sendToUser(user, 'VERIFICATION_REJECTED', {
            channels: ['in_app', 'push'],
            vars: { subject: 'identity documents', reason },
            data: { driver_id: driverId, reason, fields_to_fix: fieldsToFix ?? [] },
        });
        return { driver_id: driverId, id_verified: false, reason, notified: true };
    }
    async approveVehicle(adminId, vehicleId) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle)
            throw new NotFoundException({ message: 'VEHICLE_NOT_FOUND', code: 'VEHICLE_NOT_FOUND' });
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
            await this.notifications.sendToUser(owner, 'VERIFICATION_APPROVED', { channels: ['in_app', 'push'], vars: { subject: 'vehicle' }, data: { vehicle_id: vehicleId } });
        }
        return { vehicle_id: vehicleId, is_verified: true, notified: true };
    }
    async rejectVehicle(adminId, vehicleId, reason, fieldsToFix) {
        const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle)
            throw new NotFoundException({ message: 'VEHICLE_NOT_FOUND', code: 'VEHICLE_NOT_FOUND' });
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
                    verificationRejectionFields: (fieldsToFix ?? []),
                },
            });
            await this.recordStatusChange(owner.id, fromStatus, 'rejected', {
                reason,
                markedFields: fieldsToFix ?? [],
                changedBy: adminId,
            });
            await this.notifications.sendToUser(owner, 'VERIFICATION_REJECTED', {
                channels: ['in_app', 'push'],
                vars: { subject: 'vehicle', reason },
                data: { vehicle_id: vehicleId, reason, fields_to_fix: fieldsToFix ?? [] },
            });
        }
        return { vehicle_id: vehicleId, is_verified: false, reason, notified: true };
    }
};
VerificationService = VerificationService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        NotificationsService])
], VerificationService);
export { VerificationService };
//# sourceMappingURL=verification.service.js.map