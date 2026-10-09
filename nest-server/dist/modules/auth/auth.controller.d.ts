import type { Request } from 'express';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterPhoneDto } from './dto/register-phone.dto.js';
import type { VerifyOtpDto } from './dto/verify-otp.dto.js';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    registerPhone(_dto: RegisterPhoneDto): {
        status: string;
        message: string;
    };
    verifyOtp(_dto: VerifyOtpDto): {
        status: string;
        message: string;
    };
    login(_dto: LoginDto): {
        status: string;
        message: string;
    };
    refresh(body: {
        refresh_token: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    me(user?: AuthUser): Promise<unknown>;
    logout(req: Request, body: {
        refresh_token?: string;
    }): Promise<{
        status: string;
    }>;
}
