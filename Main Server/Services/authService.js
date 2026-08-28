const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, DriverProfile, Vehicle, UploadedImage, SubscriptionPlan, DriverSubscription, PassengerProfile } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { setKey, getKey, deleteKey } = require('../config/redis');
const otpService = require('./otpService');
const { validatePhone } = require('../utils/phoneValidator');
const { TEST_PHONES, SUBSCRIPTION_STATUS, FREE_OFFER_TYPE, VERIFICATION_STATUS } = require('../config/constants');
const balanceService = require('./balanceService');
const auditService = require('./auditService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 12;

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const REG_TOKEN_TTL = 600; // 10 minutes
const RESET_TOKEN_TTL = 600; // 10 minutes

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function generateRefreshToken(user) {
  const jti = crypto.randomUUID();
  return {
    token: jwt.sign(
      { id: user.id, role: user.role, type: 'refresh', jti },
      JWT_SECRET,
      { expiresIn: '7d' }
    ),
    jti,
  };
}

function generateRegistrationToken(phone, role, countryCode) {
  return jwt.sign(
    { phone, role, countryCode, type: 'registration' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function generateResetToken(phone) {
  return jwt.sign(
    { phone, type: 'reset' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function storeRefreshToken(userId, jti) {
  await setKey(`refresh:${userId}:${jti}`, '1', REFRESH_TOKEN_EXPIRY);
}

async function removeRefreshToken(userId, jti) {
  await deleteKey(`refresh:${userId}:${jti}`);
}

async function isRefreshTokenValid(userId, jti) {
  const key = `refresh:${userId}:${jti}`;
  const { exists } = require('../config/redis');
  return exists(key);
}

function normalizePhone(phone, countryCode) {
  if (phone.startsWith('+')) return phone;
  if (!countryCode) return phone;
  const result = validatePhone(countryCode, phone);
  if (result.valid) return result.fullPhone;
  return phone;
}

// ===== REGISTRATION STEP 1: Phone + OTP =====

async function registerPhone(countryCode, phone, role) {
  const normalizedPhone = normalizePhone(phone, countryCode);
  const existingUser = await User.findOne({ where: { phone: normalizedPhone } });
  if (existingUser) {
    if (TEST_PHONES.includes(normalizedPhone)) {
      await existingUser.destroy();
    } else {
      throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
    }
  }

  const otp = otpService.generateOTP(normalizedPhone);
  await otpService.storeOTP(normalizedPhone, otp, 'register');

  // Store registration data (countryCode, role) alongside OTP for later use
  await setKey(`reg_data:${normalizedPhone}`, JSON.stringify({ countryCode, role }), REG_TOKEN_TTL);

  console.log(`[OTP] Registration OTP for ${normalizedPhone}: ${otp}`);

  return { message: 'OTP_SENT' };
}

// ===== REGISTRATION STEP 1b: Verify OTP =====

async function verifyRegistrationOTP(phone, otp) {
  const result = await otpService.verifyOTP(phone, otp, 'register');

  if (!result.success) {
    if (result.reason === 'expired') {
      throw ApiErrors.badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
    }
    if (result.reason === 'max_attempts') {
      throw ApiErrors.badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
    }
    throw ApiErrors.badRequest('INVALID_OTP');
  }

  const existingUser = await User.findOne({ where: { phone } });
  if (existingUser) {
    throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
  }

  // Retrieve stored registration data
  const regDataRaw = await getKey(`reg_data:${phone}`);
  const regData = regDataRaw ? JSON.parse(regDataRaw) : {};
  await deleteKey(`reg_data:${phone}`);

  const token = generateRegistrationToken(phone, regData.role, regData.countryCode);
  await setKey(`reg_token:${phone}`, token, REG_TOKEN_TTL);

  return { registration_token: token, phone };
}

// ===== REGISTRATION STEP 2: Create Password =====

async function registerPassword(authHeader, password) {
  const token = authHeader?.split(' ')[1];
  if (!token) {
    throw ApiErrors.unauthorized('REGISTRATION_TOKEN_IS_REQUIRED');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiErrors.unauthorized('INVALID_OR_EXPIRED_REGISTRATION_TOKEN');
  }

  if (decoded.type !== 'registration') {
    throw ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
  }

  const storedToken = await getKey(`reg_token:${decoded.phone}`);
  if (!storedToken || storedToken !== token) {
    throw ApiErrors.unauthorized('REGISTRATION_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
  }

  await deleteKey(`reg_token:${decoded.phone}`);

  const existingUser = await User.findOne({ where: { phone: decoded.phone } });
  if (existingUser) {
    throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    phone: decoded.phone,
    countryCode: decoded.countryCode || null,
    role: decoded.role,
    passwordHash,
    locale: 'ar',
  });

  // Auto-assign the active free plan to new drivers.
  if (decoded.role === 'driver') {
    try {
      const freePlan = await SubscriptionPlan.findOne({
        where: { isFree: true, isActive: true },
      });

      if (freePlan) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + Number(freePlan.periodDays) * 24 * 60 * 60 * 1000);
        const sub = await DriverSubscription.create({
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

        auditService.track({
          action: 'subscription.auto_assigned',
          resourceType: 'driver_subscription',
          resourceId: sub.id,
          actorId: user.id,
          actorType: 'user',
          payload: { plan_id: freePlan.id, plan_name: freePlan.name },
        });

        // Credit free offer balance if the plan uses a credit offer.
        if (freePlan.freeOffer && freePlan.freeOffer.type === FREE_OFFER_TYPE.CREDIT) {
          const creditAmount = Number(freePlan.freeOffer.value) || 0;
          if (creditAmount > 0) {
            await balanceService.creditOnApproval(sub, {
              actorId: null,
              extraBalance: creditAmount,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[authService] failed to auto-assign free plan:', err.message);
    }
  }

  // Initialize default notification settings for all new users.
  try {
    const { initializeDefaults } = require('./notificationSettingService');
    await initializeDefaults(user.id);
  } catch (err) {
    console.warn('[authService] failed to initialize notification settings:', err.message);
  }

  // Create the passenger profile for new passengers (spec 009 US8).
  if (decoded.role === 'passenger') {
    try {
      await PassengerProfile.findOrCreate({
        where: { passengerId: user.id },
        defaults: { passengerId: user.id },
      });
    } catch (err) {
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
  const user = await User.findOne({ where: { phone } });
  if (!user) {
    throw ApiErrors.unauthorized('INVALID_PHONE_OR_PASSWORD');
  }

  if (user.status === 'banned') {
    throw ApiErrors.forbidden('ACCOUNT_HAS_BEEN_BANNED');
  }
  if (user.status === 'suspended') {
    throw ApiErrors.forbidden('ACCOUNT_HAS_BEEN_SUSPENDED');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiErrors.unauthorized('INVALID_PHONE_OR_PASSWORD');
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
  } catch {
    throw ApiErrors.unauthorized('INVALID_OR_EXPIRED_REFRESH_TOKEN');
  }

  if (decoded.type !== 'refresh') {
    throw ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
  }

  const valid = await isRefreshTokenValid(decoded.id, decoded.jti);
  if (!valid) {
    throw ApiErrors.unauthorized('REFRESH_TOKEN_HAS_BEEN_REVOKED');
  }

  await removeRefreshToken(decoded.id, decoded.jti);

  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw ApiErrors.unauthorized('USER_NOT_FOUND');
  }
  if (user.status === 'banned' || user.status === 'suspended') {
    throw ApiErrors.forbidden('ACCOUNT_IS_NOT_ACTIVE');
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
    if (decoded.type !== 'access') return;

    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn <= 0) return;

    await setKey(`blacklist:${token}`, '1', expiresIn);
  } catch {
    // token already invalid, ignore
  }
}

async function isAccessTokenBlacklisted(token) {
  const { exists } = require('../config/redis');
  return exists(`blacklist:${token}`);
}

async function logout(userId, refreshTokenValue, accessToken) {
  if (refreshTokenValue) {
    try {
      const decoded = verifyToken(refreshTokenValue);
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
  const user = await User.findByPk(id);
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

async function forgotPassword(phone) {
  const user = await User.findOne({ where: { phone } });
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
      throw ApiErrors.badRequest('OTP_HAS_EXPIRED_PLEASE_REQUEST_A_NEW_ONE');
    }
    if (result.reason === 'max_attempts') {
      throw ApiErrors.badRequest('MAXIMUM_OTP_ATTEMPTS_EXCEEDED_PLEASE_REQUEST_A_NEW_ONE');
    }
    throw ApiErrors.badRequest('INVALID_OTP');
  }

  const token = generateResetToken(phone);
  await setKey(`reset_token:${phone}`, token, RESET_TOKEN_TTL);

  return { reset_token: token, phone };
}

async function resetPassword(authHeader, password) {
  const token = authHeader?.split(' ')[1];
  if (!token) {
    throw ApiErrors.unauthorized('RESET_TOKEN_IS_REQUIRED');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiErrors.unauthorized('INVALID_OR_EXPIRED_RESET_TOKEN');
  }

  if (decoded.type !== 'reset') {
    throw ApiErrors.unauthorized('INVALID_TOKEN_TYPE');
  }

  const storedToken = await getKey(`reset_token:${decoded.phone}`);
  if (!storedToken || storedToken !== token) {
    throw ApiErrors.unauthorized('RESET_TOKEN_HAS_ALREADY_BEEN_USED_OR_EXPIRED');
  }

  await deleteKey(`reset_token:${decoded.phone}`);

  const user = await User.findOne({ where: { phone: decoded.phone } });
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await user.update({ passwordHash });

  // Revoke all refresh tokens for this user
  const { redis } = require('../config/redis');
  const keys = await redis.keys(`refresh:${user.id}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
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
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!isMatch) {
    throw ApiErrors.custom('CURRENT_PASSWORD_IS_INCORRECT', 400, 'INVALID_CURRENT_PASSWORD');
  }

  if (await bcrypt.compare(newPassword, user.passwordHash || '')) {
    throw ApiErrors.validation('NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.update({ passwordHash });

  // Revoke all refresh tokens for this user
  const { redis } = require('../config/redis');
  const keys = await redis.keys(`refresh:${user.id}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
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
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      throw ApiErrors.conflict('PHONE_NUMBER_IS_ALREADY_REGISTERED');
    }
  }

  if (purpose === 'forgot_password') {
    const user = await User.findOne({ where: { phone } });
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

// ===== ONBOARDING: Driver Profile =====

async function submitDriverProfile(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }
  if (user.role !== 'driver') {
    throw ApiErrors.forbidden('ONLY_DRIVERS_CAN_SUBMIT_A_DRIVER_PROFILE');
  }

  const existingProfile = await DriverProfile.findOne({ where: { driverId: userId } });
  if (existingProfile) {
    throw ApiErrors.conflict('DRIVER_PROFILE_ALREADY_EXISTS');
  }

  // Validate all image IDs exist
  const imageIds = [
    data.userIdentificationFront,
    data.userIdentificationBack,
    data.linceseFront,
    data.linceseBack,
    data.personalImageWithId,
  ];

  const images = await UploadedImage.findAll({
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
  const driverProfile = await DriverProfile.create({
    driverId: userId,
    userIdentificationFront: data.userIdentificationFront,
    userIdentificationBack: data.userIdentificationBack,
    linceseFront: data.linceseFront,
    linceseBack: data.linceseBack,
    personalImageWithId: data.personalImageWithId,
    nationalID: data.nationalID,
  });

  const vehicle = await Vehicle.findOne({ where: { driverId: userId } });
  if (vehicle) {
    await user.update({
      verificationStatus: VERIFICATION_STATUS.PENDING,
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
  const profile = await DriverProfile.findOne({ where: { driverId: userId } });
  return { driverProfile: profile || null };
}

// ===== ONBOARDING: Vehicle =====

async function submitVehicle(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }
  if (user.role !== 'driver') {
    throw ApiErrors.forbidden('ONLY_DRIVERS_CAN_ADD_VEHICLES');
  }

  const driverProfile = await DriverProfile.findOne({ where: { driverId: userId } });
  if (!driverProfile) {
    throw ApiErrors.badRequest('PLEASE_COMPLETE_YOUR_DRIVER_PROFILE_FIRST');
  }

  // Validate all image IDs
  const imageIds = [
    data.registrationDocFront,
    data.registrationDocBack,
    data.vehiclePhotoFront,
    data.vehiclePhotoBack,
  ];

  const images = await UploadedImage.findAll({
    where: { id: imageIds },
  });

  if (images.length !== imageIds.length) {
    throw ApiErrors.badRequest('ONE_OR_MORE_IMAGE_IDS_ARE_INVALID');
  }

  // Check plate number uniqueness
  const existingVehicle = await Vehicle.findOne({ where: { plateNumber: data.plateNumber } });
  if (existingVehicle) {
    throw ApiErrors.conflict('A_VEHICLE_WITH_THIS_PLATE_NUMBER_ALREADY_EXISTS');
  }

  // One vehicle per driver
  const ownedVehicle = await Vehicle.findOne({ where: { driverId: userId } });
  if (ownedVehicle) {
    throw ApiErrors.validation('YOU_ALREADY_HAVE_A_REGISTERED_VEHICLE_UPDATE_IT_INSTEAD');
  }

  const vehicle = await Vehicle.create({
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
  const vehicles = await Vehicle.findAll({ where: { driverId: userId } });
  return { vehicles };
}

// ===== ONBOARDING: Status =====

async function getOnboardingStatus(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('USER_NOT_FOUND');
  }

  const driverProfile = await DriverProfile.findOne({ where: { driverId: userId } });
  const vehicle = await Vehicle.findOne({ where: { driverId: userId } });

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

module.exports = {
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
  submitVehicle,
  getVehicle,
  getOnboardingStatus,
  isAccessTokenBlacklisted,
};
