var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
let ProfileService = class ProfileService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(passengerId) {
        const user = await this.prisma.user.findUnique({ where: { id: passengerId } });
        const profile = await this.prisma.passengerProfile.upsert({
            where: { passengerId },
            update: {},
            create: { passengerId },
        });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
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
    async updateMyProfile(passengerId, payload) {
        const profile = await this.prisma.passengerProfile.upsert({
            where: { passengerId },
            update: {},
            create: { passengerId },
        });
        const updates = {};
        if (payload.preferred_gender !== undefined)
            updates.preferredGender = payload.preferred_gender;
        if (payload.smoking_preference !== undefined)
            updates.smokingPreference = payload.smoking_preference;
        if (payload.saved_routes !== undefined)
            updates.savedRoutes = payload.saved_routes;
        if (payload.national_id !== undefined)
            updates.nationalID = payload.national_id;
        if (payload.home_address !== undefined)
            updates.homeAddress = payload.home_address;
        if (payload.emergency_contacts !== undefined) {
            updates.emergencyContacts = payload.emergency_contacts;
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
            data: updates,
        });
        void profile;
        return {
            passenger_profile: {
                id: updated.id,
                passenger_id: updated.passengerId,
                preferred_gender: updated.preferredGender,
                smoking_preference: updated.smokingPreference,
                saved_routes: updated.savedRoutes ?? [],
                national_id: updated.nationalID ?? null,
                home_address: updated.homeAddress ?? null,
                emergency_contacts: updated.emergencyContacts ?? [],
                created_at: updated.createdAt,
                updated_at: updated.updatedAt,
            },
        };
    }
    async getAccountSummary(passengerId) {
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
};
ProfileService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], ProfileService);
export { ProfileService };
//# sourceMappingURL=profile.service.js.map