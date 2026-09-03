import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, DriverProfile, Vehicle, UploadedImage, SubscriptionPlan, DriverSubscription, PassengerProfile } from '../Models';
import { ApiErrors } from '../utils/ApiError';
import { setKey, getKey, deleteKey, exists, redis } from '../config/redis';
import * as otpService from './otpService';
import { validatePhone } from '../utils/phoneValidator';
import { TEST_PHONES, SUBSCRIPTION_STATUS, FREE_OFFER_TYPE, VERIFICATION_STATUS } from '../config/constants';
import * as balanceService from './balanceService';
import * as auditService from './auditService';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS || '12', 10) || 12;

const REFRESH_TOKEN_EXPIRY: number = 7 * 24 * 60 * 60; // 7 days in seconds
const REG_TOKEN_TTL: number = 600; // 10 minutes
const RESET_TOKEN_TTL: number = 600; // 10 minutes

// ----- JWT payload types -----
export interface AccessTokenPayload extends JwtPayload {
  id: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  id: string;
  role: string;
  type: 'refresh';
  jti: string;
}

export interface RegistrationTokenPayload extends JwtPayload {
  phone: string;
  role: string;
  countryCode?: string | null;
  type: 'registration';
}

export interface ResetTokenPayload extends JwtPayload {
  phone: string;
  type: 'reset';
}

export type AnyAuthPayload = AccessTokenPayload | RefreshTokenPayload | RegistrationTokenPayload | ResetTokenPayload;

interface TokenUser {
  id: string;
  role: string;
}

interface RefreshTokenResult {
  token: string;
  jti: string;
}

export function generateAccessToken(user: TokenUser): string {
  return jwt.sign(
    { id: user.id, role: user.role, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY } as jwt.SignOptions
  );
}

export function generateRefreshToken(user: TokenUser): RefreshTokenResult {
  const jti: string = crypto.randomUUID();
  return {
    token: jwt.sign(
      { id: user.id, role: user.role, type: 'refresh', jti },
      JWT_SECRET,
      { expiresIn: '7d' } as jwt.SignOptions
    ),
    jti,
  };
}

export function generateRegistrationToken(phone: string, role: string, countryCode?: string | null): string {
  return jwt.sign(
    { phone, role, countryCode, type: 'registration' },
    JWT_SECRET,
    { expiresIn: '10m' } as jwt.SignOptions
  );
}

export function generateResetToken(phone: string): string {
  return jwt.sign(
    { phone, type: 'reset' },
    JWT_SECRET,
    { expiresIn: '10m' } as jwt.SignOptions
  );
}

export function verifyToken(token: string): AnyAuthPayload {
  return jwt.verify(token, JWT_SECRET) as AnyAuthPayload;
}

export async function storeRefreshToken(userId: string, jti: string): Promise<void> {
  await setKey(`refresh:${userId}:${jti}`, '1', REFRESH_TOKEN_EXPIRY);
}

export async function removeRefreshToken(userId: string, jti: string): Promise<void> {
  await deleteKey(`refresh:${userId}:${jti}`);
}

export async function isRefreshTokenValid(userId: string, jti: string): Promise<boolean> {
  const key = `refresh:${userId}:${jti}`;
  return exists(key);
}

export function normalizePhone(phone: string, countryCode?: string | null): string {
  if (phone.startsWith('+')) return phone;
  if (!countryCode) return phone;
  const result = validatePhone(countryCode, phone) as { valid: boolean; fullPhone?: string };
  if (result.valid && result.fullPhone) return result.fullPhone;
  return phone;
}

// ===== REGISTRATION STEP 1: Phone + OTP =====

export async function registerPhone(countryCode: string, phone: string, role: string): Promise<{ message: string }> {
  const normalizedPhone: string = normalizePhone(phone, countryCode);
  const existingUser = await (User as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { phone: normalizedPhone } });
  if (existingUser) {
    if ((TEST_PHONES as readonly string[]).includes(normalizedPhone)) {
      await (existingUser as unknown as { destroy: () => Promise<void> }).destroy();
    } else {
      throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
    }
  }

  const otp: string = (otpService as unknown as { generateOTP: (phone: string) => string }).generateOTP(normalizedPhone);
  await (otpService as unknown as { storeOTP: (phone: string, otp: string, purpose: string) => Promise<void> }).storeOTP(normalizedPhone, otp, 'register');

  // Store registration data (countryCode, role) alongside OTP for later use
  await setKey(`reg_data:${normalizedPhone}`, JSON.stringify({ countryCode, role }), REG_TOKEN_TTL);

  console.log(`[OTP] Registration OTP for ${normalizedPhone}: ${otp}`);

  return { message: 'OTP_SENT' };
}

// ===== REGISTRATION STEP 1b: Verify OTP =====

export async function verifyRegistrationOTP(phone: string, otp: string): Promise<{ registration_token: string; phone: string }> {
  const result = await (otpService as unknown as { verifyOTP: (phone: string, otp: string, purpose: string) => Promise<{ success: boolean; reason?: string }> }).verifyOTP(phone, otp, 'register');

  if (!result.success) {
    if (result.reason === 'expired') {
      throw ApiErrors.badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
    }
    if (result.reason === 'max_attempts') {
      throw ApiErrors.badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
    }
    throw ApiErrors.badRequest('INVALID_OTP');
  }

  const existingUser = await (User as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { phone } });
  if (existingUser) {
    throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
  }

  // Retrieve stored registration data
  const regDataRaw: string | null = await getKey(`reg_data:${phone}`);
  const regData: { role?: string; countryCode?: string } = regDataRaw ? JSON.parse(regDataRaw) as { role?: string; countryCode?: string } : {};
  await deleteKey(`reg_data:${phone}`);

  const token: string = generateRegistrationToken(phone, regData.role as string, regData.countryCode as string);
  await setKey(`reg_token:${phone}`, token, REG_TOKEN_TTL);

  return { registration_token: token, phone };
}

// ===== REGISTRATION STEP 2: Create Password =====

export async function registerPassword(authHeader: string | undefined, data: { password: string }): Promise<{ access_token: string; refresh_token: string; user: { id: string; phone: string; countryCode: string | null | undefined; role: string; fullName: string | null | undefined; isVerified: boolean } }> {
  const password: string = data.password;
  const token: string | undefined = authHeader?.split(' ')[1];
  if (!token) {
    throw ApiErrors.unauthorized('REGISTRATION_TOKEN_IS_REQUIRED');
  }

  let decoded: AnyAuthPayload;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiErrors.unauthorized('INVALID_OR_EXPIRED_REGISTRATION_TOKEN');
  }

  if ((decoded as RegistrationTokenPayload).type !== 'registration') {
    throw ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
  }
  const regPayload = decoded as RegistrationTokenPayload;

  const storedToken: string | null = await getKey(`reg_token:${regPayload.phone}`);
  if (!storedToken || storedToken !== token) {
    throw ApiErrors.unauthorized('REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
  }

  await deleteKey(`reg_token:${regPayload.phone}`);

  const existingUser = await (User as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { phone: regPayload.phone } });
  if (existingUser) {
    throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
  }

  const passwordHash: string = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await (User as unknown as { create: (data: unknown) => Promise<unknown> }).create({
    phone: regPayload.phone,
    countryCode: regPayload.countryCode || null,
    role: regPayload.role,
    passwordHash,
    locale: 'ar',
  }) as unknown & { id: string; phone: string; countryCode: string | null; role: string; fullName: string | null; isVerified: boolean; update: (data: unknown) => Promise<void> };

  // Auto-assign the active free plan to new drivers.
  if (regPayload.role === 'driver') {
    try {
      const freePlan = await (SubscriptionPlan as unknown as { findOne: (opts: unknown) => Promise<{ id: string; periodDays: number; name: string; percentageCut: number; cost: number; freeOffer: { type: string; value?: number } | null } | null> }).findOne({
        where: { isFree: true, isActive: true },
      });

      if (freePlan) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + Number(freePlan.periodDays) * 24 * 60 * 60 * 1000);
        const sub = await (DriverSubscription as unknown as { create: (data: unknown) => Promise<{ id: string }> }).create({
          driverId: user.id,
          planId: freePlan.id,
          planName: freePlan.name,
          planPeriodDays: freePlan.periodDays,
          planPercentageCut: freePlan.percentageCut,
          planCost: freePlan.cost,
          balance: 0,
          paymentMethod: { type: 'auto_assigned', name: 'Free Plan' },
          status: SUBSCRIPTION_STATUS.ACTIVE,
          activatedAt: now,
          expiresAt,
          freeOffer: freePlan.freeOffer || null,
        });

        (auditService as unknown as { track: (data: unknown) => void }).track({
          action: 'subscription.auto_assigned',
          resourceType: 'driver_subscription',
          resourceId: (sub as { id: string }).id,
          actorId: user.id,
          actorType: 'user',
          payload: { plan_id: freePlan.id, plan_name: freePlan.name },
        });

        // Credit free offer balance if the plan uses a credit offer.
        if (freePlan.freeOffer && freePlan.freeOffer.type === FREE_OFFER_TYPE.CREDIT) {
          const creditAmount: number = Number(freePlan.freeOffer.value) || 0;
          if (creditAmount > 0) {
            await (balanceService as unknown as { creditOnApproval: (sub: unknown, opts: unknown) => Promise<void> }).creditOnApproval(sub, {
              actorId: null,
              extraBalance: creditAmount,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[authService] failed to auto-assign free plan:', (err as Error).message);
    }
  }

  // Initialize default notification settings for all new users.
  try {
    const { initializeDefaults } = require('./notificationSettingService') as { initializeDefaults: (userId: string) => Promise<void> };
    await initializeDefaults(user.id);
  } catch (err) {
    console.warn('[authService] failed to initialize notification settings:', (err as Error).message);
  }

  // Create the passenger profile placeholder for new passengers (spec 009 US8).
  // The passenger supplies their profile data via the passenger onboarding
  // endpoint after registration: fullname, national_id, age, home_address, gender.
  if (regPayload.role === 'passenger') {
    try {
      await (PassengerProfile as unknown as { findOrCreate: (opts: unknown) => Promise<unknown> }).findOrCreate({
        where: { passengerId: user.id },
        defaults: { passengerId: user.id },
      });
    } catch (err) {
      console.warn('[authService] failed to create passenger profile:', (err as Error).message);
    }
  }

  const accessToken: string = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user);
  await storeRefreshToken(user.id, jti);

  await user.update({ lastLoginAt: new Date() });

  (auditService as unknown as { track: (data: unknown) => void }).track({
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

export async function login(phone: string, password: string): Promise<{ access_token: string; refresh_token: string; user: { id: string; phone: string; countryCode: string | null | undefined; role: string; fullName: string | null | undefined; isVerified: boolean } }> {
  const user = await (User as unknown as { findOne: (opts: unknown) => Promise<(unknown & { id: string; phone: string; countryCode: string | null; role: string; fullName: string | null; isVerified: boolean; status: string; passwordHash: string; update: (data: unknown) => Promise<void> }) | null> }).findOne({ where: { phone } });
  if (!user) {
    throw ApiErrors.unauthorized('INVALID_PHONE_OR_PASSWORD');
  }

  if (user.status === 'banned') {
    throw ApiErrors.forbidden('ACCOUNT_HAS_BEEN_BANNED');
  }
  if (user.status === 'suspended') {
    throw ApiErrors.forbidden('ACCOUNT_HAS_BEEN_SUSPENDED');
  }

  const isMatch: boolean = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiErrors.unauthorized('INVALID_PHONE_OR_PASSWORD');
  }

  const accessToken: string = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user);
  await storeRefreshToken(user.id, jti);

  await user.update({ lastLoginAt: new Date() });

  (auditService as unknown as { track: (data: unknown) => void }).track({
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

export async function refreshToken(refreshTokenValue: string): Promise<{ access_token: string; refresh_token: string }> {
  let decoded: AnyAuthPayload;
  try {
    decoded = verifyToken(refreshTokenValue);
  } catch {
    throw ApiErrors.unauthorized('INVALID_OR_EXPIRED_REFRESH_TOKEN');
  }

  if ((decoded as RefreshTokenPayload).type !== 'refresh') {
    throw ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
  }
  const payload = decoded as RefreshTokenPayload;

  const valid: boolean = await isRefreshTokenValid(payload.id, payload.jti);
  if (!valid) {
    throw ApiErrors.unauthorized('REFRESH_TOKEN_HAS_BEEN_REVOKED');
  }

  await removeRefreshToken(payload.id, payload.jti);

  const user = await (User as unknown as { findByPk: (id: string) => Promise<(unknown & { id: string; phone: string; status: string }) | null> }).findByPk(payload.id);
  if (!user) {
    throw ApiErrors.unauthorized('USER_NOT_FOUND');
  }
  if (user.status === 'banned' || user.status === 'suspended') {
    throw ApiErrors.forbidden('ACCOUNT_IS_NOT_ACTIVE');
  }

  const newAccessToken: string = generateAccessToken(user as unknown as TokenUser);
  const { token: newRefreshToken, jti } = generateRefreshToken(user as unknown as TokenUser);
  await storeRefreshToken(user.id, jti);

  (auditService as unknown as { track: (data: unknown) => void }).track({
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

export async function blacklistAccessToken(token: string): Promise<void> {
  try {
    const decoded = verifyToken(token) as AccessTokenPayload;
    if (decoded.type !== 'access') return;

    const expiresIn: number = (decoded.exp as number) - Math.floor(Date.now() / 1000);
    if (expiresIn <= 0) return;

    await setKey(`blacklist:${token}`, '1', expiresIn);
  } catch {
    // token already invalid, ignore
  }
}

export async function isAccessTokenBlacklisted(token: string): Promise<boolean> {
  return exists(`blacklist:${token}`);
}

export async function logout(userId: string, refreshTokenValue: string | null | undefined, accessToken: string | null | undefined): Promise<{ message: string }> {
  if (refreshTokenValue) {
    try {
      const decoded = verifyToken(refreshTokenValue) as RefreshTokenPayload;
      if (decoded.type === 'refresh' && decoded.id === userId) {
        await removeRefreshToken(userId, decoded.jti);
      }
    } catch {
      // token already invalid, ignore
    }
  }

  if (accessToken) {
    await blacklistAccessToken(accessToken);
  }

  (auditService as unknown as { track: (data: unknown) => void }).track({
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

export async function me(id: string): Promise<{ id: string; phone: string; countryCode: string | null | undefined; fullName: string | null | undefined; email: string | null | undefined; role: string; gender: string | undefined; age: number | null | undefined; avatarUrl: string | null | undefined; isVerified: boolean; avgRating: number | undefined; status: string; locale: string }> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<unknown | null> }).findByPk(id) as (unknown & { id: string; phone: string; countryCode: string | null | undefined; fullName: string | null | undefined; email: string | null | undefined; role: string; gender: string | undefined; age: number | null | undefined; avatarUrl: string | null | undefined; isVerified: boolean; avgRating: number | undefined; status: string; locale: string }) | null;
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
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

export async function forgotPassword(phone: string): Promise<{ message: string }> {
  const user = await (User as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { phone } });
  if (!user) {
    return { message: 'OTP_IF_REGISTERED' };
  }

  const otp: string = (otpService as unknown as { generateOTP: (phone: string) => string }).generateOTP(phone);
  await (otpService as unknown as { storeOTP: (phone: string, otp: string, purpose: string) => Promise<void> }).storeOTP(phone, otp, 'forgot_password');

  console.log(`[OTP] Forgot password OTP for ${phone}: ${otp}`);

  return { message: 'OTP_IF_REGISTERED' };
}

export async function verifyForgotPasswordOTP(phone: string, otp: string): Promise<{ reset_token: string; phone: string }> {
  const result = await (otpService as unknown as { verifyOTP: (phone: string, otp: string, purpose: string) => Promise<{ success: boolean; reason?: string }> }).verifyOTP(phone, otp, 'forgot_password');

  if (!result.success) {
    if (result.reason === 'expired') {
      throw ApiErrors.badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
    }
    if (result.reason === 'max_attempts') {
      throw ApiErrors.badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
    }
    throw ApiErrors.badRequest('INVALID_OTP');
  }

  const token: string = generateResetToken(phone);
  await setKey(`reset_token:${phone}`, token, RESET_TOKEN_TTL);

  return { reset_token: token, phone };
}

export async function resetPassword(authHeader: string | undefined, password: string): Promise<{ message: string }> {
  const token: string | undefined = authHeader?.split(' ')[1];
  if (!token) {
    throw ApiErrors.unauthorized('RESET_TOKEN_IS_REQUIRED');
  }

  let decoded: AnyAuthPayload;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiErrors.unauthorized('INVALID_OR_EXPIRED_RESET_TOKEN');
  }

  if ((decoded as ResetTokenPayload).type !== 'reset') {
    throw ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
  }
  const payload = decoded as ResetTokenPayload;

  const storedToken: string | null = await getKey(`reset_token:${payload.phone}`);
  if (!storedToken || storedToken !== token) {
    throw ApiErrors.unauthorized('RESET_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
  }

  await deleteKey(`reset_token:${payload.phone}`);

  const user = await (User as unknown as { findOne: (opts: unknown) => Promise<(unknown & { id: string; phone: string; update: (data: unknown) => Promise<void> }) | null> }).findOne({ where: { phone: payload.phone } });
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }

  const passwordHash: string = await bcrypt.hash(password, SALT_ROUNDS);
  await user.update({ passwordHash });

  // Revoke all refresh tokens for this user
  const keys: string[] = await (redis as unknown as { keys: (pattern: string) => Promise<string[]> }).keys(`refresh:${user.id}:*`);
  if (keys.length > 0) {
    await (redis as unknown as { del: (...keys: string[]) => Promise<number> }).del(...keys);
  }

  (auditService as unknown as { track: (data: unknown) => void }).track({
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
export async function changePassword(userId: string, currentPassword: string, newPassword: string, accessToken?: string | null): Promise<{ message: string; requires_relogin: boolean }> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<(unknown & { id: string; phone: string; passwordHash: string; update: (data: unknown) => Promise<void> }) | null> }).findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }

  const isMatch: boolean = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!isMatch) {
    throw ApiErrors.custom('CURRENT_PASSWORD_IS_INCORRECT', 400, 'INVALID_CURRENT_PASSWORD');
  }

  if (await bcrypt.compare(newPassword, user.passwordHash || '')) {
    throw ApiErrors.validation('NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD');
  }

  const passwordHash: string = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.update({ passwordHash });

  // Revoke all refresh tokens for this user
  const keys: string[] = await (redis as unknown as { keys: (pattern: string) => Promise<string[]> }).keys(`refresh:${user.id}:*`);
  if (keys.length > 0) {
    await (redis as unknown as { del: (...keys: string[]) => Promise<number> }).del(...keys);
  }

  // The token used for this request stays valid until expiry unless blacklisted
  if (accessToken) {
    await blacklistAccessToken(accessToken);
  }

  (auditService as unknown as { track: (data: unknown) => void }).track({
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

export async function resendOTP(phone: string, purpose: string): Promise<{ message: string }> {
  if (purpose === 'register') {
    const existingUser = await (User as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { phone } });
    if (existingUser) {
      throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
    }
  }

  if (purpose === 'forgot_password') {
    const user = await (User as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { phone } });
    if (!user) {
      return { message: 'OTP_IF_REGISTERED' };
    }
  }

  await (otpService as unknown as { deleteOTP: (phone: string, purpose: string) => Promise<void> }).deleteOTP(phone, purpose);

  const otp: string = (otpService as unknown as { generateOTP: (phone: string) => string }).generateOTP(phone);
  await (otpService as unknown as { storeOTP: (phone: string, otp: string, purpose: string) => Promise<void> }).storeOTP(phone, otp, purpose);

  const logLabel: string = purpose === 'forgot_password' ? 'Forgot password' : 'Registration';
  console.log(`[OTP] ${logLabel} OTP for ${phone}: ${otp}`);

  return { message: 'OTP_RESENT' };
}

// ===== ONBOARDING: Driver Profile =====

interface DriverProfileData {
  fullName: string;
  age: number;
  gender: string;
  userIdentificationFront: number;
  userIdentificationBack: number;
  linceseFront: number;
  linceseBack: number;
  personalImageWithId: number;
  nationalID: string;
}

export async function submitDriverProfile(userId: string, data: DriverProfileData): Promise<{ driverProfile: unknown }> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<(unknown & { id: string; role: string; fullName: string | null; update: (data: unknown) => Promise<void>; verificationStatus: string }) | null> }).findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }
  if (user.role !== 'driver') {
    throw ApiErrors.forbidden('ONLY_DRIVERS_CAN_SUBMIT_A_DRIVER_PROFILE');
  }

  const existingProfile = await (DriverProfile as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { driverId: userId } });
  if (existingProfile) {
    throw ApiErrors.conflict('DRIVER_PROFILE_ALREADY_EXISTS');
  }

  // Validate all image IDs exist
  const imageIds: number[] = [
    data.userIdentificationFront,
    data.userIdentificationBack,
    data.linceseFront,
    data.linceseBack,
    data.personalImageWithId,
  ];

  const images = await (UploadedImage as unknown as { findAll: (opts: unknown) => Promise<unknown[]> }).findAll({
    where: { id: imageIds },
  });

  if (images.length !== imageIds.length) {
    throw ApiErrors.badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
  }

  // Update user info
  await user.update({
    fullName: data.fullName,
    age: data.age,
    gender: data.gender,
  });

  // Create driver profile
  const driverProfile = await (DriverProfile as unknown as { create: (data: unknown) => Promise<{ id: string }> }).create({
    driverId: userId,
    userIdentificationFront: data.userIdentificationFront,
    userIdentificationBack: data.userIdentificationBack,
    linceseFront: data.linceseFront,
    linceseBack: data.linceseBack,
    personalImageWithId: data.personalImageWithId,
    nationalID: data.nationalID,
  });

  const vehicle = await (Vehicle as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { driverId: userId } });
  if (vehicle) {
    await user.update({
      verificationStatus: VERIFICATION_STATUS.PENDING,
      verificationSubmittedAt: new Date(),
    });
  }

  (auditService as unknown as { track: (data: unknown) => void }).track({
    action: 'driver_profile.submitted',
    resourceType: 'driver_profile',
    resourceId: (driverProfile as { id: string }).id,
    resourceLabel: user.fullName,
    actorId: userId,
    actorType: 'driver',
  });

  return { driverProfile };
}

export async function getDriverProfile(userId: string): Promise<{ driverProfile: unknown | null }> {
  const profile = await (DriverProfile as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { driverId: userId } });
  return { driverProfile: profile || null };
}

// ===== ONBOARDING: Passenger Profile =====

interface PassengerProfileData {
  fullname: string;
  national_id: string;
  age: number | string;
  home_address: string;
  gender: string;
}

export async function submitPassengerProfile(userId: string, data: PassengerProfileData): Promise<{ passengerProfile: unknown }> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<(unknown & { id: string; role: string; fullName: string | null; update: (data: unknown) => Promise<void> }) | null> }).findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }
  if (user.role !== 'passenger') {
    throw ApiErrors.forbidden('ONLY_PASSENGERS_CAN_SUBMIT_A_PASSENGER_PROFILE');
  }

  const [profile] = await (PassengerProfile as unknown as { findOrCreate: (opts: unknown) => Promise<[ { id: string; nationalID?: string | null; homeAddress?: string | null; update: (data: unknown) => Promise<void> }, boolean]> }).findOrCreate({
    where: { passengerId: userId },
    defaults: { passengerId: userId },
  }) as unknown as [{ id: string; nationalID?: string | null; homeAddress?: string | null; update: (data: unknown) => Promise<void> }, boolean];
  if (profile.nationalID || profile.homeAddress) {
    throw ApiErrors.conflict('PASSENGER_PROFILE_ALREADY_EXISTS');
  }

  const numericAge: number = Number(data.age);

  await user.update({
    fullName: data.fullname,
    age: numericAge,
    gender: data.gender,
  });

  await profile.update({
    nationalID: data.national_id,
    homeAddress: data.home_address,
  });

  (auditService as unknown as { track: (data: unknown) => void }).track({
    action: 'passenger_profile.submitted',
    resourceType: 'passenger_profile',
    resourceId: profile.id,
    resourceLabel: user.fullName,
    actorId: userId,
    actorType: 'passenger',
  });

  return { passengerProfile: profile };
}

// ===== ONBOARDING: Vehicle =====

interface VehicleData {
  vehicleType: string;
  manufacturer: string;
  model: string;
  modelYear?: number | null;
  color?: string | null;
  plateNumber: string;
  codeNumber?: string | null;
  seats: number;
  registrationDocFront: number;
  registrationDocBack: number;
  vehiclePhotoFront: number;
  vehiclePhotoBack: number;
}

export async function submitVehicle(userId: string, data: VehicleData): Promise<{ vehicle: unknown }> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<(unknown & { id: string; role: string; update: (data: unknown) => Promise<void> }) | null> }).findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }
  if (user.role !== 'driver') {
    throw ApiErrors.forbidden('ONLY_DRIVERS_CAN_ADD_VEHICLES');
  }

  const driverProfile = await (DriverProfile as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { driverId: userId } });
  if (!driverProfile) {
    throw ApiErrors.badRequest('PLEASE_COMPLETE_YOUR_DRIVER_PROFILE_FIRST');
  }

  // Validate all image IDs
  const imageIds: number[] = [
    data.registrationDocFront,
    data.registrationDocBack,
    data.vehiclePhotoFront,
    data.vehiclePhotoBack,
  ];

  const images = await (UploadedImage as unknown as { findAll: (opts: unknown) => Promise<unknown[]> }).findAll({
    where: { id: imageIds },
  });

  if (images.length !== imageIds.length) {
    throw ApiErrors.badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
  }

  // Check plate number uniqueness
  const existingVehicle = await (Vehicle as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { plateNumber: data.plateNumber } });
  if (existingVehicle) {
    throw ApiErrors.conflict('A_VEHICLE_WITH_THIS_PLATE_NUMBER_ALREADY_EXISTS');
  }

  // One vehicle per driver
  const ownedVehicle = await (Vehicle as unknown as { findOne: (opts: unknown) => Promise<unknown | null> }).findOne({ where: { driverId: userId } });
  if (ownedVehicle) {
    throw ApiErrors.validation('YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD');
  }

  const vehicle = await (Vehicle as unknown as { create: (data: unknown) => Promise<{ id: string; plateNumber: string; model: string }> }).create({
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
    verificationStatus: VERIFICATION_STATUS.PENDING,
    verificationSubmittedAt: new Date(),
  });

  (auditService as unknown as { track: (data: unknown) => void }).track({
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

export async function getVehicle(userId: string): Promise<{ vehicles: unknown[] }> {
  const vehicles = await (Vehicle as unknown as { findAll: (opts: unknown) => Promise<unknown[]> }).findAll({ where: { driverId: userId } });
  return { vehicles };
}

// ===== ONBOARDING: Status =====

export async function getOnboardingStatus(userId: string): Promise<{ role: string; passwordSet: boolean; profileSubmitted: boolean; profileVerified: boolean; vehicleSubmitted: boolean; vehicleVerified: boolean; fullyVerified: boolean }> {
  const user = await (User as unknown as { findByPk: (id: string) => Promise<(unknown & { id: string; role: string; passwordHash: string; isVerified: boolean }) | null> }).findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }

  const driverProfile = await (DriverProfile as unknown as { findOne: (opts: unknown) => Promise<{ idVerified?: boolean } | null> }).findOne({ where: { driverId: userId } });
  const vehicle = await (Vehicle as unknown as { findOne: (opts: unknown) => Promise<{ isVerified?: boolean } | null> }).findOne({ where: { driverId: userId } });

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

export default authService;
module.exports = authService;
