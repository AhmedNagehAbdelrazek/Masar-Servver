import { RedisService } from '../../redis/redis.service.js';
export declare const OTP_TTL = 300;
export declare const OTP_MAX_ATTEMPTS = 3;
export declare const TEST_PHONES: readonly ["+962700000000", "+962711111111"];
export declare const TEST_OTP = "000000";
export declare class OtpService {
    private readonly redis;
    constructor(redis: RedisService);
    generateOTP(phone: string): string;
    storeOTP(phone: string, otp: string, purpose?: string): Promise<void>;
    verifyOTP(phone: string, otp: string, purpose?: string): Promise<{
        success: boolean;
        reason?: string;
    }>;
    deleteOTP(phone: string, purpose?: string): Promise<void>;
    otpExists(phone: string, purpose?: string): Promise<boolean>;
}
