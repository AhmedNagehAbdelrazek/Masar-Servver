"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.generateRegistrationToken = generateRegistrationToken;
exports.generateResetToken = generateResetToken;
exports.verifyToken = verifyToken;
exports.storeRefreshToken = storeRefreshToken;
exports.removeRefreshToken = removeRefreshToken;
exports.isRefreshTokenValid = isRefreshTokenValid;
exports.normalizePhone = normalizePhone;
exports.registerPhone = registerPhone;
exports.verifyRegistrationOTP = verifyRegistrationOTP;
exports.registerPassword = registerPassword;
exports.login = login;
exports.refreshToken = refreshToken;
exports.blacklistAccessToken = blacklistAccessToken;
exports.isAccessTokenBlacklisted = isAccessTokenBlacklisted;
exports.logout = logout;
exports.me = me;
exports.forgotPassword = forgotPassword;
exports.verifyForgotPasswordOTP = verifyForgotPasswordOTP;
exports.resetPassword = resetPassword;
exports.changePassword = changePassword;
exports.resendOTP = resendOTP;
exports.submitDriverProfile = submitDriverProfile;
exports.getDriverProfile = getDriverProfile;
exports.submitPassengerProfile = submitPassengerProfile;
exports.submitVehicle = submitVehicle;
exports.getVehicle = getVehicle;
exports.getOnboardingStatus = getOnboardingStatus;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const Models_1 = require("../Models");
const ApiError_1 = require("../utils/ApiError");
const redis_1 = require("../config/redis");
const otpService = __importStar(require("./otpService"));
const phoneValidator_1 = require("../utils/phoneValidator");
const constants_1 = require("../config/constants");
const balanceService = __importStar(require("./balanceService"));
const auditService = __importStar(require("./auditService"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12', 10) || 12;
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const REG_TOKEN_TTL = 600; // 10 minutes
const RESET_TOKEN_TTL = 600; // 10 minutes
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, role: user.role, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
function generateRefreshToken(user) {
    const jti = crypto_1.default.randomUUID();
    return {
        token: jsonwebtoken_1.default.sign({ id: user.id, role: user.role, type: 'refresh', jti }, JWT_SECRET, { expiresIn: '7d' }),
        jti,
    };
}
function generateRegistrationToken(phone, role, countryCode) {
    return jsonwebtoken_1.default.sign({ phone, role, countryCode, type: 'registration' }, JWT_SECRET, { expiresIn: '10m' });
}
function generateResetToken(phone) {
    return jsonwebtoken_1.default.sign({ phone, type: 'reset' }, JWT_SECRET, { expiresIn: '10m' });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
async function storeRefreshToken(userId, jti) {
    await (0, redis_1.setKey)(`refresh:${userId}:${jti}`, '1', REFRESH_TOKEN_EXPIRY);
}
async function removeRefreshToken(userId, jti) {
    await (0, redis_1.deleteKey)(`refresh:${userId}:${jti}`);
}
async function isRefreshTokenValid(userId, jti) {
    const key = `refresh:${userId}:${jti}`;
    return (0, redis_1.exists)(key);
}
function normalizePhone(phone, countryCode) {
    if (phone.startsWith('+'))
        return phone;
    if (!countryCode)
        return phone;
    const result = (0, phoneValidator_1.validatePhone)(countryCode, phone);
    if (result.valid && result.fullPhone)
        return result.fullPhone;
    return phone;
}
// ===== REGISTRATION STEP 1: Phone + OTP =====
async function registerPhone(countryCode, phone, role) {
    const normalizedPhone = normalizePhone(phone, countryCode);
    const existingUser = await Models_1.User.findOne({ where: { phone: normalizedPhone } });
    if (existingUser) {
        if (constants_1.TEST_PHONES.includes(normalizedPhone)) {
            await existingUser.destroy();
        }
        else {
            throw ApiError_1.ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
        }
    }
    const otp = otpService.generateOTP(normalizedPhone);
    await otpService.storeOTP(normalizedPhone, otp, 'register');
    // Store registration data (countryCode, role) alongside OTP for later use
    await (0, redis_1.setKey)(`reg_data:${normalizedPhone}`, JSON.stringify({ countryCode, role }), REG_TOKEN_TTL);
    console.log(`[OTP] Registration OTP for ${normalizedPhone}: ${otp}`);
    return { message: 'OTP_SENT' };
}
// ===== REGISTRATION STEP 1b: Verify OTP =====
async function verifyRegistrationOTP(phone, otp) {
    const result = await otpService.verifyOTP(phone, otp, 'register');
    if (!result.success) {
        if (result.reason === 'expired') {
            throw ApiError_1.ApiErrors.badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
        }
        if (result.reason === 'max_attempts') {
            throw ApiError_1.ApiErrors.badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
        }
        throw ApiError_1.ApiErrors.badRequest('INVALID_OTP');
    }
    const existingUser = await Models_1.User.findOne({ where: { phone } });
    if (existingUser) {
        throw ApiError_1.ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
    }
    // Retrieve stored registration data
    const regDataRaw = await (0, redis_1.getKey)(`reg_data:${phone}`);
    const regData = regDataRaw ? JSON.parse(regDataRaw) : {};
    await (0, redis_1.deleteKey)(`reg_data:${phone}`);
    const token = generateRegistrationToken(phone, regData.role, regData.countryCode);
    await (0, redis_1.setKey)(`reg_token:${phone}`, token, REG_TOKEN_TTL);
    return { registration_token: token, phone };
}
// ===== REGISTRATION STEP 2: Create Password =====
async function registerPassword(authHeader, data) {
    const password = data.password;
    const token = authHeader?.split(' ')[1];
    if (!token) {
        throw ApiError_1.ApiErrors.unauthorized('REGISTRATION_TOKEN_IS_REQUIRED');
    }
    let decoded;
    try {
        decoded = verifyToken(token);
    }
    catch {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_OR_EXPIRED_REGISTRATION_TOKEN');
    }
    if (decoded.type !== 'registration') {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
    }
    const regPayload = decoded;
    const storedToken = await (0, redis_1.getKey)(`reg_token:${regPayload.phone}`);
    if (!storedToken || storedToken !== token) {
        throw ApiError_1.ApiErrors.unauthorized('REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
    }
    await (0, redis_1.deleteKey)(`reg_token:${regPayload.phone}`);
    const existingUser = await Models_1.User.findOne({ where: { phone: regPayload.phone } });
    if (existingUser) {
        throw ApiError_1.ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
    }
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const user = await Models_1.User.create({
        phone: regPayload.phone,
        countryCode: regPayload.countryCode || null,
        role: regPayload.role,
        passwordHash,
        locale: 'ar',
    });
    // Auto-assign the active free plan to new drivers.
    if (regPayload.role === 'driver') {
        try {
            const freePlan = await Models_1.SubscriptionPlan.findOne({
                where: { isFree: true, isActive: true },
            });
            if (freePlan) {
                const now = new Date();
                const expiresAt = new Date(now.getTime() + Number(freePlan.periodDays) * 24 * 60 * 60 * 1000);
                const sub = await Models_1.DriverSubscription.create({
                    driverId: user.id,
                    planId: freePlan.id,
                    planName: freePlan.name,
                    planPeriodDays: freePlan.periodDays,
                    planPercentageCut: freePlan.percentageCut,
                    planCost: freePlan.cost,
                    balance: 0,
                    paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
                    status: constants_1.SUBSCRIPTION_STATUS.ACTIVE,
                    activatedAt: now,
                    expiresAt,
                    freeOffer: freePlan.freeOffer || null,
                });
                auditService.track({
                    action: 'subscription.auto_assigned',
                    resourceType: 'driver_subscription',
                    resourceId: sub.id,
                    actorId: user.id,
                    actorType: 'user',
                    payload: { plan_id: freePlan.id, plan_name: freePlan.name },
                });
                // Credit free offer balance if the plan uses a credit offer.
                if (freePlan.freeOffer && freePlan.freeOffer.type === constants_1.FREE_OFFER_TYPE.CREDIT) {
                    const creditAmount = Number(freePlan.freeOffer.value) || 0;
                    if (creditAmount > 0) {
                        await balanceService.creditOnApproval(sub, {
                            actorId: null,
                            extraBalance: creditAmount,
                        });
                    }
                }
            }
        }
        catch (err) {
            console.warn('[authService] failed to auto-assign free plan:', err.message);
        }
    }
    // Initialize default notification settings for all new users.
    try {
        const { initializeDefaults } = require('./notificationSettingService');
        await initializeDefaults(user.id);
    }
    catch (err) {
        console.warn('[authService] failed to initialize notification settings:', err.message);
    }
    // Create the passenger profile placeholder for new passengers (spec 009 US8).
    // The passenger supplies their profile data via the passenger onboarding
    // endpoint after registration: fullname, national_id, age, home_address, gender.
    if (regPayload.role === 'passenger') {
        try {
            await Models_1.PassengerProfile.findOrCreate({
                where: { passengerId: user.id },
                defaults: { passengerId: user.id },
            });
        }
        catch (err) {
            console.warn('[authService] failed to create passenger profile:', err.message);
        }
    }
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, jti } = generateRefreshToken(user);
    await storeRefreshToken(user.id, jti);
    await user.update({ lastLoginAt: new Date() });
    auditService.track({
        eventType: 'security.event',
        action: 'user.register',
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
    });
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
            id: user.id,
            phone: user.phone,
            countryCode: user.countryCode,
            role: user.role,
            fullName: user.fullName,
            isVerified: user.isVerified,
        },
    };
}
// ===== LOGIN =====
async function login(phone, password) {
    const user = await Models_1.User.findOne({ where: { phone } });
    if (!user) {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_PHONE_OR_PASSWORD');
    }
    if (user.status === 'banned') {
        throw ApiError_1.ApiErrors.forbidden('ACCOUNT_HAS_BEEN_BANNED');
    }
    if (user.status === 'suspended') {
        throw ApiError_1.ApiErrors.forbidden('ACCOUNT_HAS_BEEN_SUSPENDED');
    }
    const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isMatch) {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_PHONE_OR_PASSWORD');
    }
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, jti } = generateRefreshToken(user);
    await storeRefreshToken(user.id, jti);
    await user.update({ lastLoginAt: new Date() });
    auditService.track({
        eventType: 'security.event',
        action: 'auth.login',
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
        payload: { role: user.role },
    });
    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
            id: user.id,
            phone: user.phone,
            countryCode: user.countryCode,
            role: user.role,
            fullName: user.fullName,
            isVerified: user.isVerified,
        },
    };
}
// ===== REFRESH TOKEN =====
async function refreshToken(refreshTokenValue) {
    let decoded;
    try {
        decoded = verifyToken(refreshTokenValue);
    }
    catch {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }
    if (decoded.type !== 'refresh') {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
    }
    const payload = decoded;
    const valid = await isRefreshTokenValid(payload.id, payload.jti);
    if (!valid) {
        throw ApiError_1.ApiErrors.unauthorized('REFRESH_TOKEN_HAS_BEEN_REVOKED');
    }
    await removeRefreshToken(payload.id, payload.jti);
    const user = await Models_1.User.findByPk(payload.id);
    if (!user) {
        throw ApiError_1.ApiErrors.unauthorized('USER_NOT_FOUND');
    }
    if (user.status === 'banned' || user.status === 'suspended') {
        throw ApiError_1.ApiErrors.forbidden('ACCOUNT_IS_NOT_ACTIVE');
    }
    const newAccessToken = generateAccessToken(user);
    const { token: newRefreshToken, jti } = generateRefreshToken(user);
    await storeRefreshToken(user.id, jti);
    auditService.track({
        eventType: 'security.event',
        action: 'auth.refresh',
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
    });
    return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
    };
}
// ===== LOGOUT =====
async function blacklistAccessToken(token) {
    try {
        const decoded = verifyToken(token);
        if (decoded.type !== 'access')
            return;
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn <= 0)
            return;
        await (0, redis_1.setKey)(`blacklist:${token}`, '1', expiresIn);
    }
    catch {
        // token already invalid, ignore
    }
}
async function isAccessTokenBlacklisted(token) {
    return (0, redis_1.exists)(`blacklist:${token}`);
}
async function logout(userId, refreshTokenValue, accessToken) {
    if (refreshTokenValue) {
        try {
            const decoded = verifyToken(refreshTokenValue);
            if (decoded.type === 'refresh' && decoded.id === userId) {
                await removeRefreshToken(userId, decoded.jti);
            }
        }
        catch {
            // token already invalid, ignore
        }
    }
    if (accessToken) {
        await blacklistAccessToken(accessToken);
    }
    auditService.track({
        eventType: 'security.event',
        action: 'auth.logout',
        resourceType: 'user',
        resourceId: userId,
        actorId: userId,
        actorType: 'user',
    });
    return { message: 'LOGGED_OUT' };
}
// ===== ME =====
async function me(id) {
    const user = await Models_1.User.findByPk(id);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    return {
        id: user.id,
        phone: user.phone,
        countryCode: user.countryCode,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        gender: user.gender,
        age: user.age,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        avgRating: user.avgRating,
        status: user.status,
        locale: user.locale,
    };
}
// ===== FORGOT PASSWORD =====
async function forgotPassword(phone) {
    const user = await Models_1.User.findOne({ where: { phone } });
    if (!user) {
        return { message: 'OTP_IF_REGISTERED' };
    }
    const otp = otpService.generateOTP(phone);
    await otpService.storeOTP(phone, otp, 'forgot_password');
    console.log(`[OTP] Forgot password OTP for ${phone}: ${otp}`);
    return { message: 'OTP_IF_REGISTERED' };
}
async function verifyForgotPasswordOTP(phone, otp) {
    const result = await otpService.verifyOTP(phone, otp, 'forgot_password');
    if (!result.success) {
        if (result.reason === 'expired') {
            throw ApiError_1.ApiErrors.badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
        }
        if (result.reason === 'max_attempts') {
            throw ApiError_1.ApiErrors.badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
        }
        throw ApiError_1.ApiErrors.badRequest('INVALID_OTP');
    }
    const token = generateResetToken(phone);
    await (0, redis_1.setKey)(`reset_token:${phone}`, token, RESET_TOKEN_TTL);
    return { reset_token: token, phone };
}
async function resetPassword(authHeader, password) {
    const token = authHeader?.split(' ')[1];
    if (!token) {
        throw ApiError_1.ApiErrors.unauthorized('RESET_TOKEN_IS_REQUIRED');
    }
    let decoded;
    try {
        decoded = verifyToken(token);
    }
    catch {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_OR_EXPIRED_RESET_TOKEN');
    }
    if (decoded.type !== 'reset') {
        throw ApiError_1.ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
    }
    const payload = decoded;
    const storedToken = await (0, redis_1.getKey)(`reset_token:${payload.phone}`);
    if (!storedToken || storedToken !== token) {
        throw ApiError_1.ApiErrors.unauthorized('RESET_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
    }
    await (0, redis_1.deleteKey)(`reset_token:${payload.phone}`);
    const user = await Models_1.User.findOne({ where: { phone: payload.phone } });
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    await user.update({ passwordHash });
    // Revoke all refresh tokens for this user
    const keys = await redis_1.redis.keys(`refresh:${user.id}:*`);
    if (keys.length > 0) {
        await redis_1.redis.del(...keys);
    }
    auditService.track({
        eventType: 'security.event',
        action: 'auth.password_reset',
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
    });
    return { message: 'PASSWORD_RESET_SUCCESSFUL' };
}
// ===== CHANGE PASSWORD (spec 010) =====
/**
 * Authenticated password change from the settings screen (contracts §5).
 * Wrong current password -> 400 INVALID_CURRENT_PASSWORD. On success every
 * refresh token is revoked and the presenting access token is blacklisted,
 * forcing a fresh login on other devices (`requires_relogin`).
 */
async function changePassword(userId, currentPassword, newPassword, accessToken) {
    const user = await Models_1.User.findByPk(userId);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    const isMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash || '');
    if (!isMatch) {
        throw ApiError_1.ApiErrors.custom('CURRENT_PASSWORD_IS_INCORRECT', 400, 'INVALID_CURRENT_PASSWORD');
    }
    if (await bcrypt_1.default.compare(newPassword, user.passwordHash || '')) {
        throw ApiError_1.ApiErrors.validation('NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD');
    }
    const passwordHash = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
    await user.update({ passwordHash });
    // Revoke all refresh tokens for this user
    const keys = await redis_1.redis.keys(`refresh:${user.id}:*`);
    if (keys.length > 0) {
        await redis_1.redis.del(...keys);
    }
    // The token used for this request stays valid until expiry unless blacklisted
    if (accessToken) {
        await blacklistAccessToken(accessToken);
    }
    auditService.track({
        eventType: 'security.event',
        action: 'auth.password_changed',
        resourceType: 'user',
        resourceId: user.id,
        resourceLabel: user.phone,
        actorId: user.id,
        actorType: 'user',
    });
    return { message: 'PASSWORD_CHANGED_SUCCESSFULLY', requires_relogin: true };
}
// ===== RESEND OTP =====
async function resendOTP(phone, purpose) {
    if (purpose === 'register') {
        const existingUser = await Models_1.User.findOne({ where: { phone } });
        if (existingUser) {
            throw ApiError_1.ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
        }
    }
    if (purpose === 'forgot_password') {
        const user = await Models_1.User.findOne({ where: { phone } });
        if (!user) {
            return { message: 'OTP_IF_REGISTERED' };
        }
    }
    await otpService.deleteOTP(phone, purpose);
    const otp = otpService.generateOTP(phone);
    await otpService.storeOTP(phone, otp, purpose);
    const logLabel = purpose === 'forgot_password' ? 'Forgot password' : 'Registration';
    console.log(`[OTP] ${logLabel} OTP for ${phone}: ${otp}`);
    return { message: 'OTP_RESENT' };
}
async function submitDriverProfile(userId, data) {
    const user = await Models_1.User.findByPk(userId);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    if (user.role !== 'driver') {
        throw ApiError_1.ApiErrors.forbidden('ONLY_DRIVERS_CAN_SUBMIT_A_DRIVER_PROFILE');
    }
    const existingProfile = await Models_1.DriverProfile.findOne({ where: { driverId: userId } });
    if (existingProfile) {
        throw ApiError_1.ApiErrors.conflict('DRIVER_PROFILE_ALREADY_EXISTS');
    }
    // Validate all image IDs exist
    const imageIds = [
        data.userIdentificationFront,
        data.userIdentificationBack,
        data.linceseFront,
        data.linceseBack,
        data.personalImageWithId,
    ];
    const images = await Models_1.UploadedImage.findAll({
        where: { id: imageIds },
    });
    if (images.length !== imageIds.length) {
        throw ApiError_1.ApiErrors.badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
    }
    // Update user info
    await user.update({
        fullName: data.fullName,
        age: data.age,
        gender: data.gender,
    });
    // Create driver profile
    const driverProfile = await Models_1.DriverProfile.create({
        driverId: userId,
        userIdentificationFront: data.userIdentificationFront,
        userIdentificationBack: data.userIdentificationBack,
        linceseFront: data.linceseFront,
        linceseBack: data.linceseBack,
        personalImageWithId: data.personalImageWithId,
        nationalID: data.nationalID,
    });
    const vehicle = await Models_1.Vehicle.findOne({ where: { driverId: userId } });
    if (vehicle) {
        await user.update({
            verificationStatus: constants_1.VERIFICATION_STATUS.PENDING,
            verificationSubmittedAt: new Date(),
        });
    }
    auditService.track({
        action: 'driver_profile.submitted',
        resourceType: 'driver_profile',
        resourceId: driverProfile.id,
        resourceLabel: user.fullName,
        actorId: userId,
        actorType: 'driver',
    });
    return { driverProfile };
}
async function getDriverProfile(userId) {
    const profile = await Models_1.DriverProfile.findOne({ where: { driverId: userId } });
    return { driverProfile: profile || null };
}
async function submitPassengerProfile(userId, data) {
    const user = await Models_1.User.findByPk(userId);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    if (user.role !== 'passenger') {
        throw ApiError_1.ApiErrors.forbidden('ONLY_PASSENGERS_CAN_SUBMIT_A_PASSENGER_PROFILE');
    }
    const [profile] = await Models_1.PassengerProfile.findOrCreate({
        where: { passengerId: userId },
        defaults: { passengerId: userId },
    });
    if (profile.nationalID || profile.homeAddress) {
        throw ApiError_1.ApiErrors.conflict('PASSENGER_PROFILE_ALREADY_EXISTS');
    }
    const numericAge = Number(data.age);
    await user.update({
        fullName: data.fullname,
        age: numericAge,
        gender: data.gender,
    });
    await profile.update({
        nationalID: data.national_id,
        homeAddress: data.home_address,
    });
    auditService.track({
        action: 'passenger_profile.submitted',
        resourceType: 'passenger_profile',
        resourceId: profile.id,
        resourceLabel: user.fullName,
        actorId: userId,
        actorType: 'passenger',
    });
    return { passengerProfile: profile };
}
async function submitVehicle(userId, data) {
    const user = await Models_1.User.findByPk(userId);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    if (user.role !== 'driver') {
        throw ApiError_1.ApiErrors.forbidden('ONLY_DRIVERS_CAN_ADD_VEHICLES');
    }
    const driverProfile = await Models_1.DriverProfile.findOne({ where: { driverId: userId } });
    if (!driverProfile) {
        throw ApiError_1.ApiErrors.badRequest('PLEASE_COMPLETE_YOUR_DRIVER_PROFILE_FIRST');
    }
    // Validate all image IDs
    const imageIds = [
        data.registrationDocFront,
        data.registrationDocBack,
        data.vehiclePhotoFront,
        data.vehiclePhotoBack,
    ];
    const images = await Models_1.UploadedImage.findAll({
        where: { id: imageIds },
    });
    if (images.length !== imageIds.length) {
        throw ApiError_1.ApiErrors.badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
    }
    // Check plate number uniqueness
    const existingVehicle = await Models_1.Vehicle.findOne({ where: { plateNumber: data.plateNumber } });
    if (existingVehicle) {
        throw ApiError_1.ApiErrors.conflict('A_VEHICLE_WITH_THIS_PLATE_NUMBER_ALREADY_EXISTS');
    }
    // One vehicle per driver
    const ownedVehicle = await Models_1.Vehicle.findOne({ where: { driverId: userId } });
    if (ownedVehicle) {
        throw ApiError_1.ApiErrors.validation('YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD');
    }
    const vehicle = await Models_1.Vehicle.create({
        driverId: userId,
        vehicleType: data.vehicleType,
        manufacturer: data.manufacturer,
        model: data.model,
        modelYear: data.modelYear || null,
        color: data.color || null,
        plateNumber: data.plateNumber,
        codeNumber: data.codeNumber || null,
        seats: data.seats,
        registrationDocFront: data.registrationDocFront,
        registrationDocBack: data.registrationDocBack,
        vehiclePhotoFront: data.vehiclePhotoFront,
        vehiclePhotoBack: data.vehiclePhotoBack,
    });
    await user.update({
        verificationStatus: constants_1.VERIFICATION_STATUS.PENDING,
        verificationSubmittedAt: new Date(),
    });
    auditService.track({
        action: 'vehicle.submitted',
        resourceType: 'vehicle',
        resourceId: vehicle.id,
        resourceLabel: vehicle.plateNumber,
        actorId: userId,
        actorType: 'driver',
        payload: { plate_number: vehicle.plateNumber, model: vehicle.model },
    });
    return { vehicle };
}
async function getVehicle(userId) {
    const vehicles = await Models_1.Vehicle.findAll({ where: { driverId: userId } });
    return { vehicles };
}
// ===== ONBOARDING: Status =====
async function getOnboardingStatus(userId) {
    const user = await Models_1.User.findByPk(userId);
    if (!user) {
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    }
    const driverProfile = await Models_1.DriverProfile.findOne({ where: { driverId: userId } });
    const vehicle = await Models_1.Vehicle.findOne({ where: { driverId: userId } });
    return {
        role: user.role,
        passwordSet: !!user.passwordHash,
        profileSubmitted: !!driverProfile,
        profileVerified: driverProfile?.idVerified || false,
        vehicleSubmitted: !!vehicle,
        vehicleVerified: vehicle?.isVerified || false,
        fullyVerified: user.isVerified,
    };
}
const authService = {
    registerPhone,
    verifyRegistrationOTP,
    registerPassword,
    login,
    refreshToken,
    logout,
    me,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
    changePassword,
    resendOTP,
    submitDriverProfile,
    getDriverProfile,
    submitPassengerProfile,
    submitVehicle,
    getVehicle,
    getOnboardingStatus,
    isAccessTokenBlacklisted,
    generateAccessToken,
    generateRefreshToken,
    generateRegistrationToken,
    generateResetToken,
    verifyToken,
    storeRefreshToken,
    removeRefreshToken,
    isRefreshTokenValid,
    blacklistAccessToken,
    normalizePhone,
};
exports.default = authService;
module.exports = authService;
//# sourceMappingURL=authService.js.map