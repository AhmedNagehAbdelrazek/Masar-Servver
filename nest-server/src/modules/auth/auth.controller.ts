import { Body, Controller, Get, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AuthService, type AuthUserShape, type TokenPair } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import {
  OnboardingPassengerProfileDto,
  OnboardingProfileDto,
  OnboardingVehicleDto,
} from './dto/onboarding.dto.js';
import { PasswordDto } from './dto/password.dto.js';
import { RegisterPhoneDto } from './dto/register-phone.dto.js';
import { LogoutDto, PhoneDto, RefreshDto, ResendOtpDto } from './dto/simple-auth.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

// Full parity with Main Server/Routes/authRoutes.ts mounted at /api/auth.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register/phone')
  @HttpCode(201)
  registerPhone(@Body() dto: RegisterPhoneDto): Promise<{ message: string }> {
    return this.auth.registerPhone(dto.country_code, dto.phone, dto.role);
  }

  @Public()
  @Post('register/verify-otp')
  @HttpCode(201)
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ registration_token: string; phone: string }> {
    return this.auth.verifyRegistrationOTP(dto.phone, dto.otp);
  }

  @Public()
  @Post('register/password')
  @HttpCode(201)
  registerPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: PasswordDto,
  ): Promise<{ access_token: string; refresh_token: string; user: AuthUserShape }> {
    return this.auth.registerPassword(authorization, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: AuthUserShape;
  }> {
    return this.auth.login(dto.phone, dto.password, dto.role ?? null);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto): Promise<TokenPair> {
    return this.auth.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(200)
  logout(
    @Req() req: Request,
    @Body() body: LogoutDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string }> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.auth.logout(user?.id ?? '', body.refresh_token ?? null, token ?? null);
  }

  @Get('me')
  me(@CurrentUser() user?: AuthUser): Promise<Record<string, unknown>> {
    return this.auth.me(user?.id ?? '');
  }

  @Post('change-password')
  @HttpCode(200)
  changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ message: string; requires_relogin: boolean }> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.auth.changePassword(user?.id ?? '', dto.current_password, dto.new_password, token ?? null);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: PhoneDto): Promise<{ message: string }> {
    return this.auth.forgotPassword(dto.phone);
  }

  @Public()
  @Post('forgot-password/verify-otp')
  @HttpCode(200)
  verifyForgotPasswordOTP(
    @Body() dto: VerifyOtpDto,
  ): Promise<{ reset_token: string; phone: string }> {
    return this.auth.verifyForgotPasswordOTP(dto.phone, dto.otp);
  }

  @Public()
  @Post('forgot-password/reset')
  @HttpCode(200)
  resetPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: PasswordDto,
  ): Promise<{ message: string }> {
    return this.auth.resetPassword(authorization, dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(200)
  resendOtp(@Body() dto: ResendOtpDto): Promise<{ message: string }> {
    return this.auth.resendOTP(dto.phone, dto.purpose);
  }

  @Post('onboarding/profile')
  @HttpCode(201)
  @Roles('driver')
  submitDriverProfile(
    @Body() dto: OnboardingProfileDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ driverProfile: unknown }> {
    return this.auth.submitDriverProfile(user?.id ?? '', dto);
  }

  @Get('onboarding/profile')
  @Roles('driver')
  getDriverProfile(@CurrentUser() user?: AuthUser): Promise<{ driverProfile: unknown | null }> {
    return this.auth.getDriverProfile(user?.id ?? '');
  }

  @Post('onboarding/vehicle')
  @HttpCode(201)
  @Roles('driver')
  submitVehicle(
    @Body() dto: OnboardingVehicleDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ vehicle: unknown }> {
    return this.auth.submitVehicle(user?.id ?? '', dto);
  }

  @Get('onboarding/vehicle')
  @Roles('driver')
  getVehicle(@CurrentUser() user?: AuthUser): Promise<{ vehicles: unknown[] }> {
    return this.auth.getVehicle(user?.id ?? '');
  }

  @Get('onboarding/status')
  @Roles('driver')
  getOnboardingStatus(@CurrentUser() user?: AuthUser): Promise<{
    role: string;
    passwordSet: boolean;
    profileSubmitted: boolean;
    profileVerified: boolean;
    vehicleSubmitted: boolean;
    vehicleVerified: boolean;
    fullyVerified: boolean;
  }> {
    return this.auth.getOnboardingStatus(user?.id ?? '');
  }

  @Post('onboarding/profile/passenger')
  @HttpCode(201)
  @Roles('passenger')
  submitPassengerProfile(
    @Body() dto: OnboardingPassengerProfileDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ passengerProfile: unknown }> {
    return this.auth.submitPassengerProfile(user?.id ?? '', dto);
  }
}
