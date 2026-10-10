import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../../redis/redis.service.js';

// Port of Main Server/Services/otpService.ts.
export const OTP_TTL = 300; // 5 minutes
export const OTP_MAX_ATTEMPTS = 3;

export const TEST_PHONES = ['+962700000000', '+962711111111'] as const;
export const TEST_OTP = '000000';

function otpKey(phone: string, purpose = 'register'): string {
  return `${purpose === 'forgot_password' ? 'otp_reset' : 'otp'}:${phone}`;
}

function attemptsKey(phone: string, purpose = 'register'): string {
  return `${purpose === 'forgot_password' ? 'otp_reset_attempts' : 'otp_attempts'}:${phone}`;
}

@Injectable()
export class OtpService {
  constructor(private readonly redis: RedisService) {}

  generateOTP(phone: string): string {
    if ((TEST_PHONES as readonly string[]).includes(phone)) return TEST_OTP;
    const num = parseInt(randomBytes(3).toString('hex'), 16) % 1_000_000;
    return num.toString().padStart(6, '0');
  }

  async storeOTP(phone: string, otp: string, purpose = 'register'): Promise<void> {
    await this.redis.setKey(otpKey(phone, purpose), otp, OTP_TTL);
    await this.redis.setKey(attemptsKey(phone, purpose), '0', OTP_TTL);
  }

  async verifyOTP(
    phone: string,
    otp: string,
    purpose = 'register',
  ): Promise<{ success: boolean; reason?: string }> {
    const key = otpKey(phone, purpose);
    const aKey = attemptsKey(phone, purpose);
    const stored = await this.redis.getKey(key);
    if (!stored) return { success: false, reason: 'expired' };

    const attempts = parseInt((await this.redis.getKey(aKey)) ?? '0', 10);
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await this.redis.deleteKey(key, aKey);
      return { success: false, reason: 'max_attempts' };
    }
    if (stored !== otp) {
      await this.redis.incr(aKey);
      return { success: false, reason: 'invalid' };
    }
    await this.redis.deleteKey(key, aKey);
    return { success: true };
  }

  async deleteOTP(phone: string, purpose = 'register'): Promise<void> {
    await this.redis.deleteKey(otpKey(phone, purpose), attemptsKey(phone, purpose));
  }

  async otpExists(phone: string, purpose = 'register'): Promise<boolean> {
    return this.redis.exists(otpKey(phone, purpose));
  }
}
