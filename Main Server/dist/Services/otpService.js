"use strict";
const crypto = require('crypto');
const { setKey, getKey, deleteKey, incr, exists } = require('../config/redis');
const { TEST_PHONES, TEST_OTP } = require('../config/constants');
const OTP_LENGTH = 6;
const OTP_TTL = 300; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const OTP_ATTEMPT_TTL = 300;
function generateOTP(phone) {
    if (TEST_PHONES.includes(phone)) {
        return TEST_OTP;
    }
    const buffer = crypto.randomBuffer ? crypto.randomBuffer(3) : crypto.randomBytes(3);
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
    await setKey(key, otp, OTP_TTL);
    await setKey(attemptsKey, '0', OTP_ATTEMPT_TTL);
}
async function verifyOTP(phone, otp, purpose = 'register') {
    const key = getOTPKey(phone, purpose);
    const attemptsKey = getOTPAttemptsKey(phone, purpose);
    const storedOTP = await getKey(key);
    if (!storedOTP) {
        return { success: false, reason: 'expired' };
    }
    const attempts = parseInt(await getKey(attemptsKey) || '0', 10);
    if (attempts >= OTP_MAX_ATTEMPTS) {
        await deleteKey(key);
        await deleteKey(attemptsKey);
        return { success: false, reason: 'max_attempts' };
    }
    if (storedOTP !== otp) {
        await incr(attemptsKey);
        return { success: false, reason: 'invalid' };
    }
    await deleteKey(key);
    await deleteKey(attemptsKey);
    return { success: true };
}
async function deleteOTP(phone, purpose = 'register') {
    await deleteKey(getOTPKey(phone, purpose));
    await deleteKey(getOTPAttemptsKey(phone, purpose));
}
async function otpExists(phone, purpose = 'register') {
    return exists(getOTPKey(phone, purpose));
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
//# sourceMappingURL=otpService.js.map