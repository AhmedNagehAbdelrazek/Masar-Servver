var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, UnprocessableEntityException, } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { canEditVerification, computeVerificationStatus, guardVerificationSubmission, } from './verification-state.js';
import { VerificationService } from './verification.service.js';
const DRIVER_DOC_FIELDS = [
    'user_identification_front',
    'user_identification_back',
    'lincese_front',
    'lincese_back',
    'personal_image_with_id',
];
const VEHICLE_DOC_FIELDS = [
    'registration_doc_front',
    'registration_doc_back',
    'vehicle_photo_front',
    'vehicle_photo_back',
];
function toDateOnly(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}
let DriverVerificationService = class DriverVerificationService {
    prisma;
    verification;
    constructor(prisma, verification) {
        this.prisma = prisma;
        this.verification = verification;
    }
    async loadDriverData(driverId) {
        const user = await this.prisma.user.findUnique({ where: { id: driverId } });
        if (!user)
            throw new NotFoundException({ message: 'DRIVER_NOT_FOUND', code: 'DRIVER_NOT_FOUND' });
        const profile = await this.prisma.driverProfile.findFirst({ where: { driverId } });
        const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId } });
        return {
            user: user,
            profile: profile,
            vehicle: vehicle,
        };
    }
    buildDriverPayload(user, profile) {
        return {
            full_name: user.fullName ?? null,
            national_id: profile?.nationalID ?? null,
            license_number: profile?.licenseNumber ?? null,
            license_expiry: toDateOnly(profile?.licenseExpiry),
            user_identification_front: profile?.userIdentificationFront ?? null,
            user_identification_back: profile?.userIdentificationBack ?? null,
            lincese_front: profile?.linceseFront ?? null,
            lincese_back: profile?.linceseBack ?? null,
            personal_image_with_id: profile?.personalImageWithId ?? null,
        };
    }
    buildVehiclePayload(vehicle) {
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
    async getStatus(driverId) {
        const { user, profile, vehicle } = await this.loadDriverData(driverId);
        const status = computeVerificationStatus({
            verificationStatus: user.verificationStatus,
            verificationRejectedAt: user.verificationRejectedAt ?? null,
        }, profile ? { idVerified: Boolean(profile.idVerified) } : null, vehicle
            ? {
                isVerified: Boolean(vehicle.isVerified),
                verificationRejectedAt: vehicle.verificationRejectedAt ?? null,
            }
            : null);
        return {
            status: {
                value: status,
                can_edit: canEditVerification(status),
                submitted_at: user.verificationSubmittedAt ??
                    profile?.createdAt ??
                    vehicle?.createdAt ??
                    null,
                rejected_at: user.verificationRejectedAt ??
                    vehicle?.verificationRejectedAt ??
                    null,
                rejection_reason: user.verificationRejectionReason ??
                    vehicle?.verificationRejectionReason ??
                    null,
                fields_to_fix: user.verificationRejectionFields ?? [],
            },
            driver: this.buildDriverPayload(user, profile),
            vehicle: this.buildVehiclePayload(vehicle),
        };
    }
    async getSubmission(driverId) {
        const { user, profile, vehicle } = await this.loadDriverData(driverId);
        return {
            driver: this.buildDriverPayload(user, profile),
            vehicle: this.buildVehiclePayload(vehicle),
        };
    }
    async verifyDocumentIds(body) {
        const docIds = [
            ...DRIVER_DOC_FIELDS.map((f) => body[f]),
            ...VEHICLE_DOC_FIELDS.map((f) => body.vehicle?.[f]),
        ].filter((id) => id !== undefined && id !== null);
        if (docIds.length === 0)
            return;
        const uniqueIds = [...new Set(docIds)];
        const found = await this.prisma.uploadedImage.findMany({ where: { id: { in: uniqueIds } } });
        if (found.length !== uniqueIds.length) {
            throw new UnprocessableEntityException({
                message: 'ONE_OR_MORE_UPLOADED_DOCUMENT_IDS_DO_NOT_EXIST',
                code: 'VALIDATION_ERROR',
            });
        }
    }
    async submitOrResubmit(driverId, body) {
        const { user, profile, vehicle } = await this.loadDriverData(driverId);
        const currentStatus = computeVerificationStatus({
            verificationStatus: user.verificationStatus,
            verificationRejectedAt: user.verificationRejectedAt ?? null,
        }, profile ? { idVerified: Boolean(profile.idVerified) } : null, vehicle
            ? {
                isVerified: Boolean(vehicle.isVerified),
                verificationRejectedAt: vehicle.verificationRejectedAt ?? null,
            }
            : null);
        guardVerificationSubmission(currentStatus);
        await this.verifyDocumentIds(body);
        const submittedAt = new Date();
        try {
            await this.prisma.$transaction(async (tx) => {
                const profileData = {
                    nationalID: body.national_id !== undefined ? body.national_id : (profile?.nationalID ?? null),
                    licenseNumber: body.license_number !== undefined ? body.license_number : (profile?.licenseNumber ?? null),
                    licenseExpiry: body.license_expiry !== undefined
                        ? new Date(body.license_expiry)
                        : (profile?.licenseExpiry ?? null),
                    userIdentificationFront: body.user_identification_front !== undefined
                        ? body.user_identification_front
                        : (profile?.userIdentificationFront ?? null),
                    userIdentificationBack: body.user_identification_back !== undefined
                        ? body.user_identification_back
                        : (profile?.userIdentificationBack ?? null),
                    linceseFront: body.lincese_front !== undefined
                        ? body.lincese_front
                        : (profile?.linceseFront ?? null),
                    linceseBack: body.lincese_back !== undefined
                        ? body.lincese_back
                        : (profile?.linceseBack ?? null),
                    personalImageWithId: body.personal_image_with_id !== undefined
                        ? body.personal_image_with_id
                        : (profile?.personalImageWithId ?? null),
                };
                if (profile) {
                    await tx.driverProfile.update({ where: { id: profile.id }, data: profileData });
                }
                else {
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
                    manufacturer: v.manufacturer,
                    model: v.model,
                    vehicleType: v.vehicle_type,
                    modelYear: v.model_year !== undefined
                        ? v.model_year
                        : (vehicle?.modelYear ?? null),
                    plateNumber: v.plate_number,
                    codeNumber: v.code_number !== undefined
                        ? v.code_number
                        : (vehicle?.codeNumber ?? null),
                    color: v.color !== undefined
                        ? v.color
                        : (vehicle?.color ?? null),
                    seats: v.seats,
                    registrationDocFront: v.registration_doc_front !== undefined
                        ? v.registration_doc_front
                        : (vehicle?.registrationDocFront ?? null),
                    registrationDocBack: v.registration_doc_back !== undefined
                        ? v.registration_doc_back
                        : (vehicle?.registrationDocBack ?? null),
                    vehiclePhotoFront: v.vehicle_photo_front !== undefined
                        ? v.vehicle_photo_front
                        : (vehicle?.vehiclePhotoFront ?? null),
                    vehiclePhotoBack: v.vehicle_photo_back !== undefined
                        ? v.vehicle_photo_back
                        : (vehicle?.vehiclePhotoBack ?? null),
                    isVerified: false,
                    verificationNotes: null,
                    verificationRejectionReason: null,
                    verificationRejectedAt: null,
                    verifiedBy: null,
                    verifiedAt: null,
                };
                if (vehicle) {
                    await tx.vehicle.update({ where: { id: vehicle.id }, data: vehicleData });
                }
                else {
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
        }
        catch (err) {
            if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
                const target = err.meta?.target?.join(' ') ?? '';
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
        await this.verification.alertAdminsOfNewSubmission(driverId, freshUser?.fullName ?? user.fullName);
        return { status: 'pending', submitted_at: submittedAt };
    }
};
DriverVerificationService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        VerificationService])
], DriverVerificationService);
export { DriverVerificationService };
//# sourceMappingURL=driver-verification.service.js.map