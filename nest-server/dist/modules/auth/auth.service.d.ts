import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { BalanceService } from '../balance/balance.service.js';
import { NotificationSettingsService } from '../notifications/notification-settings.service.js';
import { OtpService } from './otp.service.js';
export interface AuthUserShape {
    id: string;
    phone: string;
    countryCode: string | null;
    role: string;
    fullName: string | null;
    isVerified: boolean;
}
export interface TokenPair {
    access_token: string;
    refresh_token: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly redis;
    private readonly otp;
    private readonly balance;
    private readonly notificationSettings;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, redis: RedisService, otp: OtpService, balance: BalanceService, notificationSettings: NotificationSettingsService);
    private get secret();
    private get accessExpiry();
    generateAccessToken(id: string, role: string): string;
    generateRefreshToken(id: string, role: string): Promise<{
        token: string;
        jti: string;
    }>;
    generateRegistrationToken(phone: string, role: string, countryCode?: string | null): string;
    generateResetToken(phone: string): string;
    normalizePhone(phone: string, countryCode?: string | null): string;
    registerPhone(countryCode: string, phone: string, role: string): Promise<{
        message: string;
    }>;
    verifyRegistrationOTP(phone: string, otp: string): Promise<{
        registration_token: string;
        phone: string;
    }>;
    registerPassword(authHeader: string | undefined, data: {
        password: string;
        confirmPassword?: string;
    }): Promise<{
        access_token: string;
        refresh_token: string;
        user: AuthUserShape;
    }>;
    private autoAssignFreePlan;
    private loggerSafe;
    login(phone: string, password: string, expectedRole: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: AuthUserShape;
    }>;
    refresh(refreshTokenValue: string): Promise<TokenPair>;
    logout(userId: string, refreshTokenValue?: string | null, accessToken?: string | null): Promise<{
        message: string;
    }>;
    blacklistAccessToken(token: string): Promise<void>;
    me(userId: string): Promise<Record<string, unknown>>;
    forgotPassword(phone: string): Promise<{
        message: string;
    }>;
    verifyForgotPasswordOTP(phone: string, otp: string): Promise<{
        reset_token: string;
        phone: string;
    }>;
    resetPassword(authHeader: string | undefined, data: {
        password: string;
        confirmPassword?: string;
    }): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string, accessToken?: string | null): Promise<{
        message: string;
        requires_relogin: boolean;
    }>;
    resendOTP(phone: string, purpose: string): Promise<{
        message: string;
    }>;
    submitDriverProfile(userId: string, data: {
        fullName: string;
        age: number;
        gender: string;
        userIdentificationFront: number;
        userIdentificationBack: number;
        linceseFront: number;
        linceseBack: number;
        personalImageWithId: number;
        nationalID: string;
    }): Promise<{
        driverProfile: unknown;
    }>;
    getDriverProfile(userId: string): Promise<{
        driverProfile: unknown | null;
    }>;
    submitPassengerProfile(userId: string, data: {
        fullname: string;
        national_id: string;
        age: number | string;
        home_address: string;
        gender: string;
    }): Promise<{
        passengerProfile: unknown;
    }>;
    submitVehicle(userId: string, data: {
        vehicleType: string;
        manufacturer: string;
        model: string;
        modelYear?: number | null;
        color?: string | null;
        plateNumber: string;
        codeNumber?: string | null;
        seats: number;
        registrationDocFront: number;
        registrationDocBack: number;
        vehiclePhotoFront: number;
        vehiclePhotoBack: number;
    }): Promise<{
        vehicle: unknown;
    }>;
    getVehicle(userId: string): Promise<{
        vehicles: unknown[];
    }>;
    getOnboardingStatus(userId: string): Promise<{
        role: string;
        passwordSet: boolean;
        profileSubmitted: boolean;
        profileVerified: boolean;
        vehicleSubmitted: boolean;
        vehicleVerified: boolean;
        fullyVerified: boolean;
    }>;
}
