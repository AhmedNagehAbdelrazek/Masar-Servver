import type { Request } from 'express';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AuthService, type AuthUserShape, type TokenPair } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { OnboardingPassengerProfileDto, OnboardingProfileDto, OnboardingVehicleDto } from './dto/onboarding.dto.js';
import { PasswordDto } from './dto/password.dto.js';
import { RegisterPhoneDto } from './dto/register-phone.dto.js';
import { LogoutDto, PhoneDto, RefreshDto, ResendOtpDto } from './dto/simple-auth.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    registerPhone(dto: RegisterPhoneDto): Promise<{
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        registration_token: string;
        phone: string;
    }>;
    registerPassword(authorization: string | undefined, dto: PasswordDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: AuthUserShape;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: AuthUserShape;
    }>;
    refresh(dto: RefreshDto): Promise<TokenPair>;
    logout(req: Request, body: LogoutDto, user?: AuthUser): Promise<{
        message: string;
    }>;
    me(user?: AuthUser): Promise<Record<string, unknown>>;
    changePassword(req: Request, dto: ChangePasswordDto, user?: AuthUser): Promise<{
        message: string;
        requires_relogin: boolean;
    }>;
    forgotPassword(dto: PhoneDto): Promise<{
        message: string;
    }>;
    verifyForgotPasswordOTP(dto: VerifyOtpDto): Promise<{
        reset_token: string;
        phone: string;
    }>;
    resetPassword(authorization: string | undefined, dto: PasswordDto): Promise<{
        message: string;
    }>;
    resendOtp(dto: ResendOtpDto): Promise<{
        message: string;
    }>;
    submitDriverProfile(dto: OnboardingProfileDto, user?: AuthUser): Promise<{
        driverProfile: unknown;
    }>;
    getDriverProfile(user?: AuthUser): Promise<{
        driverProfile: unknown | null;
    }>;
    submitVehicle(dto: OnboardingVehicleDto, user?: AuthUser): Promise<{
        vehicle: unknown;
    }>;
    getVehicle(user?: AuthUser): Promise<{
        vehicles: unknown[];
    }>;
    getOnboardingStatus(user?: AuthUser): Promise<{
        role: string;
        passwordSet: boolean;
        profileSubmitted: boolean;
        profileVerified: boolean;
        vehicleSubmitted: boolean;
        vehicleVerified: boolean;
        fullyVerified: boolean;
    }>;
    submitPassengerProfile(dto: OnboardingPassengerProfileDto, user?: AuthUser): Promise<{
        passengerProfile: unknown;
    }>;
}
