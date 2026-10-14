var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { maskNationalId, maskPhone } from '../../common/utils/masking.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HomeService } from '../subscriptions/home.service.js';
import { DashboardService } from './dashboard.service.js';
import { DeletionService } from './deletion.service.js';
import { DriverProfileService } from './driver-profile.service.js';
import { EarningsService } from './earnings.service.js';
import { PenaltyService } from './penalty.service.js';
import { PersonalDataService } from './personal-data.service.js';
import { StatsService } from './stats.service.js';
function toDateOnly(value) {
    if (!value)
        return null;
    if (typeof value === 'string')
        return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}
let DriverService = class DriverService {
    prisma;
    profiles;
    personalData;
    deletion;
    penalties;
    earnings;
    stats;
    dashboard;
    home;
    constructor(prisma, profiles, personalData, deletion, penalties, earnings, stats, dashboard, home) {
        this.prisma = prisma;
        this.profiles = profiles;
        this.personalData = personalData;
        this.deletion = deletion;
        this.penalties = penalties;
        this.earnings = earnings;
        this.stats = stats;
        this.dashboard = dashboard;
        this.home = home;
    }
    async assertDriverEligible(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        if (user.isVerified !== true ||
            ['suspended', 'banned'].includes(user.status)) {
            throw new ForbiddenException({
                message: 'ACCOUNT_MUST_BE_VERIFIED_AND_ACTIVE_TO_ACCESS_THIS_RESOURCE',
                code: 'FORBIDDEN',
            });
        }
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { driverProfile: true },
        });
        if (!user)
            throw new NotFoundException({ message: 'USER_NOT_FOUND', code: 'USER_NOT_FOUND' });
        const ratingCount = await this.prisma.rating.count({ where: { rateeId: userId } });
        const profile = (user.driverProfile ?? {});
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
                    license_expiry: profile.licenseExpiry
                        ? toDateOnly(profile.licenseExpiry)
                        : null,
                    total_trips: profile.totalTrips || 0,
                    total_earnings: Number(profile.totalEarnings || 0),
                    response_rate: Number(profile.responseRate || 0),
                    national_id: maskNationalId(profile.nationalID),
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
    getFullProfile(driverId) {
        return this.profiles.getFullProfile(driverId);
    }
    getPersonalData(userId) {
        return this.personalData.buildPersonalDataView(userId);
    }
    updatePersonalData(userId, payload) {
        return this.personalData.updatePersonalData(userId, payload);
    }
    getAccountStatus(driverId) {
        return this.profiles.getAccountStatus(driverId);
    }
    requestDeleteAccount(userId, opts) {
        return this.deletion.requestDeletion(userId, opts);
    }
    cancelDeleteAccount(userId) {
        return this.deletion.cancelDeletionRequest(userId);
    }
    getPenalties(userId, filters) {
        return this.penalties.listForDriver(userId, filters);
    }
    getEarnings(userId, filters) {
        return this.earnings.aggregate(userId, filters);
    }
    getStats(userId) {
        return this.stats.lifetime(userId);
    }
    getDashboard(userId) {
        return this.dashboard.getDashboard(userId);
    }
    async getHome(userId) {
        await this.assertDriverEligible(userId);
        return this.home.getHome(userId);
    }
    async getSubscription(userId) {
        await this.assertDriverEligible(userId);
        return this.home.getSubscription(userId);
    }
};
DriverService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        DriverProfileService,
        PersonalDataService,
        DeletionService,
        PenaltyService,
        EarningsService,
        StatsService,
        DashboardService,
        HomeService])
], DriverService);
export { DriverService };
//# sourceMappingURL=driver.service.js.map