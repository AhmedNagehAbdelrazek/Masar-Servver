var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { validatePhone } from '../../common/phone/phone-validator.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { BalanceService } from '../balance/balance.service.js';
import { NotificationSettingsService } from '../notifications/notification-settings.service.js';
import { OtpService, TEST_PHONES } from './otp.service.js';
const REFRESH_TOKEN_TTL = 7 * 24 * 3600;
const REG_TOKEN_TTL = 600;
const RESET_TOKEN_TTL = 600;
function saltRounds() {
    return parseInt(process.env.SALT_ROUNDS ?? '12', 10) || 12;
}
function unauthorized(key) {
    return new UnauthorizedException({ message: key, code: 'UNAUTHORIZED' });
}
function forbidden(key) {
    return new ForbiddenException({ message: key, code: 'FORBIDDEN' });
}
function badRequest(key) {
    return new BadRequestException({ message: key, code: 'BAD_REQUEST' });
}
function conflict(key) {
    return new ConflictException({ message: key, code: 'CONFLICT' });
}
function notFound(key) {
    return new NotFoundException({ message: key, code: 'NOT_FOUND' });
}
function validationFailed(field, message) {
    return new UnprocessableEntityException({
        message: 'VALIDATION_FAILED',
        code: 'VALIDATION_ERROR',
        details: [{ field, message }],
    });
}
function assertPasswordsMatch(password, confirmPassword) {
    if (confirmPassword !== undefined && confirmPassword !== password) {
        throw validationFailed('confirmPassword', 'Passwords do not match');
    }
}
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    redis;
    otp;
    balance;
    notificationSettings;
    constructor(prisma, jwt, config, redis, otp, balance, notificationSettings) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.redis = redis;
        this.otp = otp;
        this.balance = balance;
        this.notificationSettings = notificationSettings;
    }
    get secret() {
        return this.config.get('jwt.secret', 'dev-secret-change-in-production');
    }
    get accessExpiry() {
        return this.config.get('jwt.expiry', '24h');
    }
    generateAccessToken(id, role) {
        return this.jwt.sign({ id, role, type: 'access' }, {
            secret: this.secret,
            expiresIn: this.accessExpiry,
        });
    }
    async generateRefreshToken(id, role) {
        const jti = randomUUID();
        const token = this.jwt.sign({ id, role, type: 'refresh', jti }, {
            secret: this.secret,
            expiresIn: '7d',
        });
        await this.redis.setKey(`refresh:${id}:${jti}`, '1', REFRESH_TOKEN_TTL);
        return { token, jti };
    }
    generateRegistrationToken(phone, role, countryCode) {
        return this.jwt.sign({ phone, role, countryCode, type: 'registration' }, {
            secret: this.secret,
            expiresIn: '10m',
        });
    }
    generateResetToken(phone) {
        return this.jwt.sign({ phone, type: 'reset' }, { secret: this.secret, expiresIn: '10m' });
    }
    normalizePhone(phone, countryCode) {
        if (phone.startsWith('+'))
            return phone;
        if (!countryCode)
            return phone;
        const result = validatePhone(countryCode, phone);
        if (result.valid && result.fullPhone)
            return result.fullPhone;
        return phone;
    }
    async registerPhone(countryCode, phone, role) {
        const checked = validatePhone(countryCode, phone);
        if (!checked.valid) {
            throw validationFailed('phone', checked.error);
        }
        const normalizedPhone = phone.startsWith('+') ? phone : checked.fullPhone;
        const existing = await this.prisma.user.findFirst({ where: { phone: normalizedPhone } });
        if (existing) {
            if (TEST_PHONES.includes(normalizedPhone)) {
                await this.prisma.user.delete({ where: { id: existing.id } });
            }
            else {
                throw conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
            }
        }
        const otp = this.otp.generateOTP(normalizedPhone);
        await this.otp.storeOTP(normalizedPhone, otp, 'register');
        await this.redis.setKey(`reg_data:${normalizedPhone}`, JSON.stringify({ countryCode, role }), REG_TOKEN_TTL);
        return { message: 'OTP_SENT' };
    }
    async verifyRegistrationOTP(phone, otp) {
        const result = await this.otp.verifyOTP(phone, otp, 'register');
        if (!result.success) {
            if (result.reason === 'expired')
                throw badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
            if (result.reason === 'max_attempts') {
                throw badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
            }
            throw badRequest('INVALID_OTP');
        }
        const existing = await this.prisma.user.findFirst({ where: { phone } });
        if (existing)
            throw conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
        const regDataRaw = await this.redis.getKey(`reg_data:${phone}`);
        const regData = regDataRaw
            ? JSON.parse(regDataRaw)
            : {};
        await this.redis.deleteKey(`reg_data:${phone}`);
        const token = this.generateRegistrationToken(phone, regData.role ?? '', regData.countryCode);
        await this.redis.setKey(`reg_token:${phone}`, token, REG_TOKEN_TTL);
        return { registration_token: token, phone };
    }
    async registerPassword(authHeader, data) {
        assertPasswordsMatch(data.password, data.confirmPassword);
        const password = data.password;
        const token = authHeader?.split(' ')[1];
        if (!token)
            throw unauthorized('REGISTRATION_TOKEN_IS_REQUIRED');
        let decoded;
        try {
            decoded = await this.jwt.verifyAsync(token, { secret: this.secret });
        }
        catch {
            throw unauthorized('INVALID_OR_EXPIRED_REGISTRATION_TOKEN');
        }
        if (decoded.type !== 'registration' || !decoded.phone) {
            throw unauthorized('INVALID_TOKEN_TYPE');
        }
        const stored = await this.redis.getKey(`reg_token:${decoded.phone}`);
        if (!stored || stored !== token) {
            throw unauthorized('REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
        }
        await this.redis.deleteKey(`reg_token:${decoded.phone}`);
        const existing = await this.prisma.user.findFirst({ where: { phone: decoded.phone } });
        if (existing)
            throw conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
        const passwordHash = await bcrypt.hash(password, saltRounds());
        const user = await this.prisma.user.create({
            data: {
                phone: decoded.phone,
                countryCode: decoded.countryCode ?? null,
                role: (decoded.role ?? 'passenger'),
                passwordHash,
                locale: 'ar',
            },
        });
        if (decoded.role === 'driver') {
            try {
                await this.autoAssignFreePlan(user.id);
            }
            catch (err) {
                this.loggerSafe(`failed to auto-assign free plan: ${err.message}`);
            }
        }
        try {
            await this.notificationSettings.initializeDefaults(user.id);
        }
        catch (err) {
            this.loggerSafe(`failed to initialize notification settings: ${err.message}`);
        }
        if (decoded.role === 'passenger') {
            try {
                await this.prisma.passengerProfile.upsert({
                    where: { passengerId: user.id },
                    update: {},
                    create: { passengerId: user.id },
                });
            }
            catch (err) {
                this.loggerSafe(`failed to create passenger profile: ${err.message}`);
            }
        }
        const accessToken = this.generateAccessToken(user.id, user.role);
        const { token: refreshToken, jti } = await this.generateRefreshToken(user.id, user.role);
        await this.redis.setKey(`refresh:${user.id}:${jti}`, '1', REFRESH_TOKEN_TTL);
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                phone: user.phone,
                countryCode: user.countryCode,
                role: user.role,
                fullName: user.fullName,
                isVerified: user.isVerified,
            },
        };
    }
    async autoAssignFreePlan(driverId) {
        const freePlan = await this.prisma.subscriptionPlan.findFirst({
            where: { isFree: true, isActive: true },
        });
        if (!freePlan)
            return;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + Number(freePlan.periodDays) * 24 * 3600 * 1000);
        const sub = await this.prisma.driverSubscription.create({
            data: {
                driverId,
                planId: freePlan.id,
                planName: freePlan.name,
                planPeriodDays: freePlan.periodDays,
                planPercentageCut: freePlan.percentageCut,
                planCost: freePlan.cost,
                balance: 0,
                paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
                status: 'active',
                activatedAt: now,
                expiresAt,
                freeOffer: (freePlan.freeOffer ?? Prisma.DbNull),
            },
        });
        const offer = freePlan.freeOffer;
        if (offer?.type === 'credit') {
            const creditAmount = Number(offer.value) || 0;
            if (creditAmount > 0) {
                await this.balance.creditOnApproval({
                    id: sub.id,
                    driverId,
                    planName: sub.planName,
                    planCost: sub.planCost,
                    balance: sub.balance,
                }, { extraBalance: creditAmount });
            }
        }
    }
    loggerSafe(_message) {
        void _message;
    }
    async login(phone, password, expectedRole) {
        const user = await this.prisma.user.findFirst({ where: { phone } });
        if (!user)
            throw unauthorized('INVALID_PHONE_OR_PASSWORD');
        if (user.status === 'banned')
            throw forbidden('ACCOUNT_HAS_BEEN_BANNED');
        if (user.status === 'suspended')
            throw forbidden('ACCOUNT_HAS_BEEN_SUSPENDED');
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch)
            throw unauthorized('INVALID_PHONE_OR_PASSWORD');
        if (expectedRole && user.role !== expectedRole)
            throw forbidden('ACCOUNT_ROLE_MISMATCH');
        const accessToken = this.generateAccessToken(user.id, user.role);
        const { token: refreshToken } = await this.generateRefreshToken(user.id, user.role);
        await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                phone: user.phone,
                countryCode: user.countryCode,
                role: user.role,
                fullName: user.fullName,
                isVerified: user.isVerified,
            },
        };
    }
    async refresh(refreshTokenValue) {
        let decoded;
        try {
            decoded = await this.jwt.verifyAsync(refreshTokenValue, { secret: this.secret });
        }
        catch {
            throw unauthorized('INVALID_OR_EXPIRED_REFRESH_TOKEN');
        }
        if (decoded.type !== 'refresh' || !decoded.id || !decoded.jti) {
            throw unauthorized('INVALID_TOKEN_TYPE');
        }
        const stored = await this.redis.getKey(`refresh:${decoded.id}:${decoded.jti}`);
        if (!stored)
            throw unauthorized('REFRESH_TOKEN_HAS_BEEN_REVOKED');
        await this.redis.deleteKey(`refresh:${decoded.id}:${decoded.jti}`);
        const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user)
            throw unauthorized('USER_NOT_FOUND');
        if (user.status === 'banned' || user.status === 'suspended') {
            throw forbidden('ACCOUNT_IS_NOT_ACTIVE');
        }
        const accessToken = this.generateAccessToken(user.id, user.role);
        const next = await this.generateRefreshToken(user.id, user.role);
        return { access_token: accessToken, refresh_token: next.token };
    }
    async logout(userId, refreshTokenValue, accessToken) {
        if (refreshTokenValue) {
            try {
                const decoded = (await this.jwt.verifyAsync(refreshTokenValue, {
                    secret: this.secret,
                }));
                if (decoded.type === 'refresh' && decoded.id === userId && decoded.jti) {
                    await this.redis.deleteKey(`refresh:${userId}:${decoded.jti}`);
                }
            }
            catch {
            }
        }
        if (accessToken)
            await this.blacklistAccessToken(accessToken);
        return { message: 'LOGGED_OUT' };
    }
    async blacklistAccessToken(token) {
        try {
            const decoded = (await this.jwt.verifyAsync(token, { secret: this.secret }));
            if (decoded.type !== 'access')
                return;
            const ttl = (decoded.exp ?? 0) - Math.floor(Date.now() / 1000);
            if (ttl <= 0)
                return;
            await this.redis.setKey(`blacklist:${token}`, '1', ttl);
        }
        catch {
        }
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        return {
            id: user.id,
            phone: user.phone,
            countryCode: user.countryCode,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            gender: user.gender,
            age: user.age === null || user.age === undefined ? user.age : Number(user.age),
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            avgRating: user.avgRating === null || user.avgRating === undefined ? user.avgRating : Number(user.avgRating),
            status: user.status,
            locale: user.locale,
        };
    }
    async forgotPassword(phone) {
        const user = await this.prisma.user.findFirst({ where: { phone } });
        if (!user)
            return { message: 'OTP_IF_REGISTERED' };
        const otp = this.otp.generateOTP(phone);
        await this.otp.storeOTP(phone, otp, 'forgot_password');
        return { message: 'OTP_IF_REGISTERED' };
    }
    async verifyForgotPasswordOTP(phone, otp) {
        const result = await this.otp.verifyOTP(phone, otp, 'forgot_password');
        if (!result.success) {
            if (result.reason === 'expired')
                throw badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
            if (result.reason === 'max_attempts') {
                throw badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
            }
            throw badRequest('INVALID_OTP');
        }
        const token = this.generateResetToken(phone);
        await this.redis.setKey(`reset_token:${phone}`, token, RESET_TOKEN_TTL);
        return { reset_token: token, phone };
    }
    async resetPassword(authHeader, data) {
        assertPasswordsMatch(data.password, data.confirmPassword);
        const password = data.password;
        const token = authHeader?.split(' ')[1];
        if (!token)
            throw unauthorized('RESET_TOKEN_IS_REQUIRED');
        let decoded;
        try {
            decoded = await this.jwt.verifyAsync(token, { secret: this.secret });
        }
        catch {
            throw unauthorized('INVALID_OR_EXPIRED_RESET_TOKEN');
        }
        if (decoded.type !== 'reset' || !decoded.phone)
            throw unauthorized('INVALID_TOKEN_TYPE');
        const stored = await this.redis.getKey(`reset_token:${decoded.phone}`);
        if (!stored || stored !== token) {
            throw unauthorized('RESET_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
        }
        await this.redis.deleteKey(`reset_token:${decoded.phone}`);
        const user = await this.prisma.user.findFirst({ where: { phone: decoded.phone } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        const passwordHash = await bcrypt.hash(password, saltRounds());
        await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
        const keys = await this.redis.keys(`refresh:${user.id}:*`);
        if (keys.length > 0)
            await this.redis.deleteKey(...keys);
        return { message: 'PASSWORD_RESET_SUCCESSFUL' };
    }
    async changePassword(userId, currentPassword, newPassword, accessToken) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash ?? '');
        if (!isMatch) {
            throw new BadRequestException({ message: 'CURRENT_PASSWORD_IS_INCORRECT', code: 'INVALID_CURRENT_PASSWORD' });
        }
        if (newPassword === currentPassword || (await bcrypt.compare(newPassword, user.passwordHash ?? ''))) {
            throw new UnprocessableEntityException({
                message: 'NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD',
                code: 'VALIDATION_ERROR',
            });
        }
        const passwordHash = await bcrypt.hash(newPassword, saltRounds());
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        const keys = await this.redis.keys(`refresh:${userId}:*`);
        if (keys.length > 0)
            await this.redis.deleteKey(...keys);
        if (accessToken)
            await this.blacklistAccessToken(accessToken);
        return { message: 'PASSWORD_CHANGED_SUCCESSFULLY', requires_relogin: true };
    }
    async resendOTP(phone, purpose) {
        if (purpose === 'register') {
            const existing = await this.prisma.user.findFirst({ where: { phone } });
            if (existing)
                throw conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
        }
        if (purpose === 'forgot_password') {
            const user = await this.prisma.user.findFirst({ where: { phone } });
            if (!user)
                return { message: 'OTP_IF_REGISTERED' };
        }
        await this.otp.deleteOTP(phone, purpose);
        const otp = this.otp.generateOTP(phone);
        await this.otp.storeOTP(phone, otp, purpose);
        return { message: 'OTP_RESENT' };
    }
    async submitDriverProfile(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        if (user.role !== 'driver')
            throw forbidden('ONLY_DRIVERS_CAN_SUBMIT_A_DRIVER_PROFILE');
        const existing = await this.prisma.driverProfile.findFirst({ where: { driverId: userId } });
        if (existing)
            throw conflict('DRIVER_PROFILE_ALREADY_EXISTS');
        const imageIds = [
            data.userIdentificationFront,
            data.userIdentificationBack,
            data.linceseFront,
            data.linceseBack,
            data.personalImageWithId,
        ];
        const images = await this.prisma.uploadedImage.findMany({ where: { id: { in: imageIds } } });
        if (images.length !== imageIds.length)
            throw badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
        await this.prisma.user.update({
            where: { id: userId },
            data: { fullName: data.fullName, age: data.age, gender: data.gender },
        });
        const profile = await this.prisma.driverProfile.create({
            data: {
                driverId: userId,
                userIdentificationFront: data.userIdentificationFront,
                userIdentificationBack: data.userIdentificationBack,
                linceseFront: data.linceseFront,
                linceseBack: data.linceseBack,
                personalImageWithId: data.personalImageWithId,
                nationalID: data.nationalID,
            },
        });
        const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId: userId } });
        if (vehicle) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { verificationStatus: 'pending', verificationSubmittedAt: new Date() },
            });
        }
        return { driverProfile: profile };
    }
    async getDriverProfile(userId) {
        const profile = await this.prisma.driverProfile.findFirst({ where: { driverId: userId } });
        return { driverProfile: profile ?? null };
    }
    async submitPassengerProfile(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        if (user.role !== 'passenger')
            throw forbidden('ONLY_PASSENGERS_CAN_SUBMIT_A_PASSENGER_PROFILE');
        const profile = await this.prisma.passengerProfile.upsert({
            where: { passengerId: userId },
            update: {},
            create: { passengerId: userId },
        });
        if (profile.nationalID || profile.homeAddress) {
            throw conflict('PASSENGER_PROFILE_ALREADY_EXISTS');
        }
        const numericAge = Number(data.age);
        await this.prisma.user.update({
            where: { id: userId },
            data: { fullName: data.fullname, age: numericAge, gender: data.gender },
        });
        const updated = await this.prisma.passengerProfile.update({
            where: { passengerId: userId },
            data: { nationalID: data.national_id, homeAddress: data.home_address },
        });
        return { passengerProfile: updated };
    }
    async submitVehicle(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        if (user.role !== 'driver')
            throw forbidden('ONLY_DRIVERS_CAN_ADD_VEHICLES');
        const driverProfile = await this.prisma.driverProfile.findFirst({ where: { driverId: userId } });
        if (!driverProfile)
            throw badRequest('PLEASE_COMPLETE_YOUR_DRIVER_PROFILE_FIRST');
        const imageIds = [
            data.registrationDocFront,
            data.registrationDocBack,
            data.vehiclePhotoFront,
            data.vehiclePhotoBack,
        ];
        const images = await this.prisma.uploadedImage.findMany({ where: { id: { in: imageIds } } });
        if (images.length !== imageIds.length)
            throw badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
        const existingPlate = await this.prisma.vehicle.findFirst({
            where: { plateNumber: data.plateNumber },
        });
        if (existingPlate)
            throw conflict('A_VEHICLE_WITH_THIS_PLATE_NUMBER_ALREADY_EXISTS');
        const owned = await this.prisma.vehicle.findFirst({ where: { driverId: userId } });
        if (owned) {
            throw new UnprocessableEntityException({
                message: 'YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD',
                code: 'VALIDATION_ERROR',
            });
        }
        const vehicle = await this.prisma.vehicle.create({
            data: {
                driverId: userId,
                vehicleType: data.vehicleType,
                manufacturer: data.manufacturer,
                model: data.model,
                modelYear: data.modelYear ?? null,
                color: data.color ?? null,
                plateNumber: data.plateNumber,
                codeNumber: data.codeNumber ?? null,
                seats: data.seats,
                registrationDocFront: data.registrationDocFront,
                registrationDocBack: data.registrationDocBack,
                vehiclePhotoFront: data.vehiclePhotoFront,
                vehiclePhotoBack: data.vehiclePhotoBack,
            },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { verificationStatus: 'pending', verificationSubmittedAt: new Date() },
        });
        return { vehicle };
    }
    async getVehicle(userId) {
        const vehicles = await this.prisma.vehicle.findMany({ where: { driverId: userId } });
        return { vehicles };
    }
    async getOnboardingStatus(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw notFound('USER_NOT_FOUND');
        const driverProfile = await this.prisma.driverProfile.findFirst({ where: { driverId: userId } });
        const vehicle = await this.prisma.vehicle.findFirst({ where: { driverId: userId } });
        return {
            role: user.role,
            passwordSet: !!user.passwordHash,
            profileSubmitted: !!driverProfile,
            profileVerified: driverProfile?.idVerified ?? false,
            vehicleSubmitted: !!vehicle,
            vehicleVerified: vehicle?.isVerified ?? false,
            fullyVerified: user.isVerified,
        };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService,
        ConfigService,
        RedisService,
        OtpService,
        BalanceService,
        NotificationSettingsService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map