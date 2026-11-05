"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP_MAX_ATTEMPTS = exports.OTP_TTL = void 0;
exports.generateOTP = generateOTP;
exports.storeOTP = storeOTP;
exports.verifyOTP = verifyOTP;
exports.deleteOTP = deleteOTP;
exports.otpExists = otpExists;
// @ts-nocheck
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../config/redis");
const constants_1 = require("../config/constants");
const OTP_LENGTH = 6;
const OTP_TTL = 300; // 5 minutes
exports.OTP_TTL = OTP_TTL;
const OTP_MAX_ATTEMPTS = 3;
exports.OTP_MAX_ATTEMPTS = OTP_MAX_ATTEMPTS;
const OTP_ATTEMPT_TTL = 300;
function generateOTP(phone) {
    if (constants_1.TEST_PHONES.includes(phone)) {
        return constants_1.TEST_OTP;
    }
    const buffer = crypto_1.default.randomBuffer ? crypto_1.default.randomBuffer(3) : crypto_1.default.randomBytes(3);
    const num = parseInt(buffer.toString('hex'), 16) % Math.pow(10, OTP_LENGTH);
    return num.toString().padStart(OTP_LENGTH, '0');
}
function getOTPKey(phone, purpose = 'register') {
    const prefix = purpose === 'forgot_password' ? 'otp_reset' : 'otp';
    return `${prefix}:${phone}`;
}
function getOTPAttemptsKey(phone, purpose = 'register') {
    const prefix = purpose === 'forgot_password' ? 'otp_reset_attempts' : 'otp_attempts';
    return `${prefix}:${phone}`;
}
async function storeOTP(phone, otp, purpose = 'register') {
    const key = getOTPKey(phone, purpose);
    const attemptsKey = getOTPAttemptsKey(phone, purpose);
    await (0, redis_1.setKey)(key, otp, OTP_TTL);
    await (0, redis_1.setKey)(attemptsKey, '0', OTP_ATTEMPT_TTL);
}
async function verifyOTP(phone, otp, purpose = 'register') {
    const key = getOTPKey(phone, purpose);
    const attemptsKey = getOTPAttemptsKey(phone, purpose);
    const storedOTP = await (0, redis_1.getKey)(key);
    if (!storedOTP) {
        return { success: false, reason: 'expired' };
    }
    const attempts = parseInt(await (0, redis_1.getKey)(attemptsKey) || '0', 10);
    if (attempts >= OTP_MAX_ATTEMPTS) {
        await (0, redis_1.deleteKey)(key);
        await (0, redis_1.deleteKey)(attemptsKey);
        return { success: false, reason: 'max_attempts' };
    }
    if (storedOTP !== otp) {
        await (0, redis_1.incr)(attemptsKey);
        return { success: false, reason: 'invalid' };
    }
    await (0, redis_1.deleteKey)(key);
    await (0, redis_1.deleteKey)(attemptsKey);
    return { success: true };
}
async function deleteOTP(phone, purpose = 'register') {
    await (0, redis_1.deleteKey)(getOTPKey(phone, purpose));
    await (0, redis_1.deleteKey)(getOTPAttemptsKey(phone, purpose));
}
async function otpExists(phone, purpose = 'register') {
    return (0, redis_1.exists)(getOTPKey(phone, purpose));
}
module.exports = {
    generateOTP,
    storeOTP,
    verifyOTP,
    deleteOTP,
    otpExists,
    OTP_TTL,
    OTP_MAX_ATTEMPTS,
};
exports.default = module.exports;
//# sourceMappingURL=otpService.js.map