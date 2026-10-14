var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ensureOperational, ensureReadable, loadDriverUser } from '../../common/access/user-access.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { canEditVerification } from './verification-state.js';
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
function genderLabel(gender) {
    if (gender === 'male')
        return 'ذكر';
    if (gender === 'female')
        return 'أنثى';
    return null;
}
let PersonalDataService = class PersonalDataService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async buildPersonalDataView(userId) {
        const user = (await loadDriverUser(this.prisma, userId));
        ensureReadable({ status: user.status });
        const [driverProfile, vehicle] = await Promise.all([
            this.prisma.driverProfile.findFirst({ where: { driverId: userId } }),
            this.prisma.vehicle.findFirst({ where: { driverId: userId } }),
        ]);
        let lockedFields = [];
        let rejectedFields = [];
        if (user.verificationStatus === 'pending' || user.verificationStatus === 'approved') {
            lockedFields = [...LOCKED_WHEN_VERIFIED];
        }
        else if (user.verificationStatus === 'rejected') {
            rejectedFields = Array.isArray(user.verificationRejectionFields)
                ? user.verificationRejectionFields
                : [];
        }
        return {
            personal_data: {
                full_name: user.fullName ?? null,
                display_name: user.displayName ?? null,
                country_code: user.countryCode ?? '+962',
                phone: user.phone ?? null,
                email: user.email ?? null,
                email_verified: false,
                age: user.age == null ? null : Number(user.age),
                gender: user.gender ?? null,
                gender_label: genderLabel(user.gender),
                avatar_url: user.avatarUrl ?? null,
                national_id: driverProfile?.nationalID ?? null,
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
    async assertUniqueness(userId, payload) {
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
    async updatePersonalData(userId, payload) {
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
        const userAttrs = {};
        if (payload.full_name !== undefined)
            userAttrs.fullName = payload.full_name;
        if (payload.display_name !== undefined)
            userAttrs.displayName = payload.display_name;
        if (payload.email !== undefined)
            userAttrs.email = payload.email || null;
        if (payload.phone !== undefined)
            userAttrs.phone = payload.phone;
        if (payload.age !== undefined)
            userAttrs.age = payload.age;
        if (payload.avatar_url !== undefined)
            userAttrs.avatarUrl = payload.avatar_url;
        const identityChanged = Boolean(payload.full_name !== undefined ||
            payload.national_id !== undefined ||
            (payload.vehicle && Object.keys(payload.vehicle).length > 0));
        if (Object.keys(userAttrs).length > 0) {
            await this.prisma.user.update({ where: { id: userId }, data: userAttrs });
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
            const vehicleAttrs = {};
            if (v.manufacturer !== undefined)
                vehicleAttrs.manufacturer = v.manufacturer;
            if (v.model !== undefined)
                vehicleAttrs.model = v.model;
            if (v.model_year !== undefined)
                vehicleAttrs.modelYear = v.model_year;
            if (v.color !== undefined)
                vehicleAttrs.color = v.color;
            if (v.plate_number !== undefined)
                vehicleAttrs.plateNumber = v.plate_number;
            if (v.total_seats !== undefined)
                vehicleAttrs.seats = v.total_seats;
            if (Object.keys(vehicleAttrs).length > 0) {
                const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId: userId } });
                if (vehicle) {
                    await this.prisma.vehicle.update({ where: { id: vehicle.id }, data: vehicleAttrs });
                }
                else {
                    if (vehicleAttrs.manufacturer !== undefined &&
                        vehicleAttrs.model !== undefined &&
                        vehicleAttrs.plateNumber !== undefined &&
                        vehicleAttrs.seats !== undefined) {
                        await this.prisma.vehicle.create({
                            data: {
                                driverId: userId,
                                manufacturer: vehicleAttrs.manufacturer,
                                model: vehicleAttrs.model,
                                vehicleType: 'sedan',
                                plateNumber: vehicleAttrs.plateNumber,
                                seats: vehicleAttrs.seats,
                                ...(vehicleAttrs.modelYear !== undefined ? { modelYear: vehicleAttrs.modelYear } : {}),
                                ...(vehicleAttrs.color !== undefined ? { color: vehicleAttrs.color } : {}),
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
    extractLockedAttempts(payload) {
        const attempts = [];
        if (payload.full_name !== undefined)
            attempts.push('full_name');
        if (payload.email !== undefined)
            attempts.push('email');
        if (payload.national_id !== undefined)
            attempts.push('national_id');
        if (payload.vehicle && typeof payload.vehicle === 'object') {
            for (const key of Object.keys(payload.vehicle)) {
                if (payload.vehicle[key] !== undefined) {
                    attempts.push(`vehicle.${key}`);
                }
            }
        }
        return attempts;
    }
    async statusOf(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { verificationStatus: true },
        });
        return user?.verificationStatus ?? 'unverified';
    }
};
PersonalDataService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], PersonalDataService);
export { PersonalDataService };
//# sourceMappingURL=personal-data.service.js.map