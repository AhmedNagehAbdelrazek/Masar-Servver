var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { RedisService } from '../../redis/redis.service.js';
export const OTP_TTL = 300;
export const OTP_MAX_ATTEMPTS = 3;
export const TEST_PHONES = ['+962700000000', '+962711111111'];
export const TEST_OTP = '000000';
function otpKey(phone, purpose = 'register') {
    return `${purpose === 'forgot_password' ? 'otp_reset' : 'otp'}:${phone}`;
}
function attemptsKey(phone, purpose = 'register') {
    return `${purpose === 'forgot_password' ? 'otp_reset_attempts' : 'otp_attempts'}:${phone}`;
}
let OtpService = class OtpService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    generateOTP(phone) {
        if (TEST_PHONES.includes(phone))
            return TEST_OTP;
        const num = parseInt(randomBytes(3).toString('hex'), 16) % 1_000_000;
        return num.toString().padStart(6, '0');
    }
    async storeOTP(phone, otp, purpose = 'register') {
        await this.redis.setKey(otpKey(phone, purpose), otp, OTP_TTL);
        await this.redis.setKey(attemptsKey(phone, purpose), '0', OTP_TTL);
    }
    async verifyOTP(phone, otp, purpose = 'register') {
        const key = otpKey(phone, purpose);
        const aKey = attemptsKey(phone, purpose);
        const stored = await this.redis.getKey(key);
        if (!stored)
            return { success: false, reason: 'expired' };
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
    async deleteOTP(phone, purpose = 'register') {
        await this.redis.deleteKey(otpKey(phone, purpose), attemptsKey(phone, purpose));
    }
    async otpExists(phone, purpose = 'register') {
        return this.redis.exists(otpKey(phone, purpose));
    }
};
OtpService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], OtpService);
export { OtpService };
//# sourceMappingURL=otp.service.js.map