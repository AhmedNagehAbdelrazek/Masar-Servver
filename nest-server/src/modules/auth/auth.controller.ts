import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterPhoneDto } from './dto/register-phone.dto.js';
import type { VerifyOtpDto } from './dto/verify-otp.dto.js';

// Route parity target: Main Server/Routes/authRoutes.ts mounted at /api/auth.
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register/phone')
  @HttpCode(200)
  registerPhone(@Body() _dto: RegisterPhoneDto): { status: string; message: string } {
    void _dto;
    // TODO(phase-3): port OTP dispatch (TEST_OTP=000000 in test, Twilio/log otherwise).
    return { status: 'success', message: 'OTP sent.' };
  }

  @Public()
  @Post('register/verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() _dto: VerifyOtpDto): { status: string; message: string } {
    void _dto;
    // TODO(phase-3): verify OTP -> registration_token (10m) + Redis reg_token/reg_data.
    return { status: 'success', message: 'OTP verified.' };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() _dto: LoginDto): { status: string; message: string } {
    void _dto;
    // TODO(phase-3): port Services/authService.login (phone+password+role gate).
    return { status: 'success', message: 'Not implemented yet.' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: { refresh_token: string }): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.refresh(body.refresh_token);
  }

  @Get('me')
  me(@CurrentUser() user?: AuthUser): Promise<unknown> {
    // Guarded globally; @Public() on class is overridden per-route via APP_GUARD bypass check.
    return this.auth.me(user!.id);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Body() body: { refresh_token?: string }): Promise<{ status: string }> {
    const token = (req.headers.authorization ?? '').replace('Bearer ', '');
    const user = (req as Request & { user?: AuthUser }).user;
    return this.auth.logout(token, user!.id, body.refresh_token).then(() => ({ status: 'success' }));
  }
}
