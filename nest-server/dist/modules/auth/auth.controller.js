var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { OnboardingPassengerProfileDto, OnboardingProfileDto, OnboardingVehicleDto, } from './dto/onboarding.dto.js';
import { PasswordDto } from './dto/password.dto.js';
import { RegisterPhoneDto } from './dto/register-phone.dto.js';
import { LogoutDto, PhoneDto, RefreshDto, ResendOtpDto } from './dto/simple-auth.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    registerPhone(dto) {
        return this.auth.registerPhone(dto.country_code, dto.phone, dto.role);
    }
    verifyOtp(dto) {
        return this.auth.verifyRegistrationOTP(dto.phone, dto.otp);
    }
    registerPassword(authorization, dto) {
        return this.auth.registerPassword(authorization, dto);
    }
    login(dto) {
        return this.auth.login(dto.phone, dto.password, dto.role ?? null);
    }
    refresh(dto) {
        return this.auth.refresh(dto.refresh_token);
    }
    logout(req, body, user) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        return this.auth.logout(user?.id ?? '', body.refresh_token ?? null, token ?? null);
    }
    me(user) {
        return this.auth.me(user?.id ?? '');
    }
    changePassword(req, dto, user) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        return this.auth.changePassword(user?.id ?? '', dto.current_password, dto.new_password, token ?? null);
    }
    forgotPassword(dto) {
        return this.auth.forgotPassword(dto.phone);
    }
    verifyForgotPasswordOTP(dto) {
        return this.auth.verifyForgotPasswordOTP(dto.phone, dto.otp);
    }
    resetPassword(authorization, dto) {
        return this.auth.resetPassword(authorization, dto);
    }
    resendOtp(dto) {
        return this.auth.resendOTP(dto.phone, dto.purpose);
    }
    submitDriverProfile(dto, user) {
        return this.auth.submitDriverProfile(user?.id ?? '', dto);
    }
    getDriverProfile(user) {
        return this.auth.getDriverProfile(user?.id ?? '');
    }
    submitVehicle(dto, user) {
        return this.auth.submitVehicle(user?.id ?? '', dto);
    }
    getVehicle(user) {
        return this.auth.getVehicle(user?.id ?? '');
    }
    getOnboardingStatus(user) {
        return this.auth.getOnboardingStatus(user?.id ?? '');
    }
    submitPassengerProfile(dto, user) {
        return this.auth.submitPassengerProfile(user?.id ?? '', dto);
    }
};
__decorate([
    Public(),
    Post('register/phone'),
    HttpCode(201),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterPhoneDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerPhone", null);
__decorate([
    Public(),
    Post('register/verify-otp'),
    HttpCode(201),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    Public(),
    Post('register/password'),
    HttpCode(201),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerPassword", null);
__decorate([
    Public(),
    Post('login'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    Public(),
    Post('refresh'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    Post('logout'),
    HttpCode(200),
    __param(0, Req()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, LogoutDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    Get('me'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    Post('change-password'),
    HttpCode(200),
    __param(0, Req()),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    Public(),
    Post('forgot-password'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PhoneDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    Public(),
    Post('forgot-password/verify-otp'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyForgotPasswordOTP", null);
__decorate([
    Public(),
    Post('forgot-password/reset'),
    HttpCode(200),
    __param(0, Headers('authorization')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, PasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    Public(),
    Post('resend-otp'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResendOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendOtp", null);
__decorate([
    Post('onboarding/profile'),
    HttpCode(201),
    Roles('driver'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OnboardingProfileDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "submitDriverProfile", null);
__decorate([
    Get('onboarding/profile'),
    Roles('driver'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getDriverProfile", null);
__decorate([
    Post('onboarding/vehicle'),
    HttpCode(201),
    Roles('driver'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OnboardingVehicleDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "submitVehicle", null);
__decorate([
    Get('onboarding/vehicle'),
    Roles('driver'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getVehicle", null);
__decorate([
    Get('onboarding/status'),
    Roles('driver'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getOnboardingStatus", null);
__decorate([
    Post('onboarding/profile/passenger'),
    HttpCode(201),
    Roles('passenger'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OnboardingPassengerProfileDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "submitPassengerProfile", null);
AuthController = __decorate([
    Controller('auth'),
    __metadata("design:paramtypes", [AuthService])
], AuthController);
export { AuthController };
//# sourceMappingURL=auth.controller.js.map