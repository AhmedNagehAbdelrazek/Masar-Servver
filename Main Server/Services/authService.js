const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, DriverProfile, Vehicle, UploadedImage } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { setKey, getKey, deleteKey } = require('../config/redis');
const otpService = require('./otpService');
const { validatePhone } = require('../utils/phoneValidator');

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
    throw ApiErrors.conflict('Phone number is already registered');
  }

  const otp = otpService.generateOTP();
  await otpService.storeOTP(normalizedPhone, otp, 'register');

  // Store registration data (countryCode, role) alongside OTP for later use
  await setKey(`reg_data:${normalizedPhone}`, JSON.stringify({ countryCode, role }), REG_TOKEN_TTL);

  console.log(`[OTP] Registration OTP for ${normalizedPhone}: ${otp}`);

  return { message: 'OTP sent successfully' };
}

// ===== REGISTRATION STEP 1b: Verify OTP =====

async function verifyRegistrationOTP(phone, otp) {
  const result = await otpService.verifyOTP(phone, otp, 'register');

  if (!result.success) {
    if (result.reason === 'expired') {
      throw ApiErrors.badRequest('OTP has expired. Please request a new one.');
    }
    if (result.reason === 'max_attempts') {
      throw ApiErrors.badRequest('Maximum OTP attempts exceeded. Please request a new one.');
    }
    throw ApiErrors.badRequest('Invalid OTP');
  }

  const existingUser = await User.findOne({ where: { phone } });
  if (existingUser) {
    throw ApiErrors.conflict('Phone number is already registered');
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
    throw ApiErrors.unauthorized('Registration token is required');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiErrors.unauthorized('Invalid or expired registration token');
  }

  if (decoded.type !== 'registration') {
    throw ApiErrors.unauthorized('Invalid token type');
  }

  const storedToken = await getKey(`reg_token:${decoded.phone}`);
  if (!storedToken || storedToken !== token) {
    throw ApiErrors.unauthorized('Registration token has already been used or expired');
  }

  await deleteKey(`reg_token:${decoded.phone}`);

  const existingUser = await User.findOne({ where: { phone: decoded.phone } });
  if (existingUser) {
    throw ApiErrors.conflict('Phone number is already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    phone: decoded.phone,
    countryCode: decoded.countryCode || null,
    role: decoded.role,
    passwordHash,
    locale: 'ar',
  });

  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user);
  await storeRefreshToken(user.id, jti);

  await user.update({ lastLoginAt: new Date() });

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
    throw ApiErrors.unauthorized('Invalid phone or password');
  }

  if (user.status === 'banned') {
    throw ApiErrors.forbidden('Account has been banned');
  }
  if (user.status === 'suspended') {
    throw ApiErrors.forbidden('Account has been suspended');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw ApiErrors.unauthorized('Invalid phone or password');
  }

  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user);
  await storeRefreshToken(user.id, jti);

  await user.update({ lastLoginAt: new Date() });

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
    throw ApiErrors.unauthorized('Invalid or expired refresh token');
  }

  if (decoded.type !== 'refresh') {
    throw ApiErrors.unauthorized('Invalid token type');
  }

  const valid = await isRefreshTokenValid(decoded.id, decoded.jti);
  if (!valid) {
    throw ApiErrors.unauthorized('Refresh token has been revoked');
  }

  await removeRefreshToken(decoded.id, decoded.jti);

  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw ApiErrors.unauthorized('User not found');
  }
  if (user.status === 'banned' || user.status === 'suspended') {
    throw ApiErrors.forbidden('Account is not active');
  }

  const newAccessToken = generateAccessToken(user);
  const { token: newRefreshToken, jti } = generateRefreshToken(user);
  await storeRefreshToken(user.id, jti);

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
  };
}

// ===== LOGOUT =====

async function logout(userId, refreshTokenValue) {
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
  return { message: 'Logged out successfully' };
}

// ===== ME =====

async function me(id) {
  const user = await User.findByPk(id);
  if (!user) {
    throw ApiErrors.notFound('User not found');
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
    return { message: 'If the phone number is registered, an OTP has been sent' };
  }

  const otp = otpService.generateOTP();
  await otpService.storeOTP(phone, otp, 'forgot_password');

  console.log(`[OTP] Forgot password OTP for ${phone}: ${otp}`);

  return { message: 'If the phone number is registered, an OTP has been sent' };
}

async function verifyForgotPasswordOTP(phone, otp) {
  const result = await otpService.verifyOTP(phone, otp, 'forgot_password');

  if (!result.success) {
    if (result.reason === 'expired') {
      throw ApiErrors.badRequest('OTP has expired. Please request a new one.');
    }
    if (result.reason === 'max_attempts') {
      throw ApiErrors.badRequest('Maximum OTP attempts exceeded. Please request a new one.');
    }
    throw ApiErrors.badRequest('Invalid OTP');
  }

  const token = generateResetToken(phone);
  await setKey(`reset_token:${phone}`, token, RESET_TOKEN_TTL);

  return { reset_token: token, phone };
}

async function resetPassword(authHeader, password) {
  const token = authHeader?.split(' ')[1];
  if (!token) {
    throw ApiErrors.unauthorized('Reset token is required');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiErrors.unauthorized('Invalid or expired reset token');
  }

  if (decoded.type !== 'reset') {
    throw ApiErrors.unauthorized('Invalid token type');
  }

  const storedToken = await getKey(`reset_token:${decoded.phone}`);
  if (!storedToken || storedToken !== token) {
    throw ApiErrors.unauthorized('Reset token has already been used or expired');
  }

  await deleteKey(`reset_token:${decoded.phone}`);

  const user = await User.findOne({ where: { phone: decoded.phone } });
  if (!user) {
    throw ApiErrors.notFound('User not found');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await user.update({ passwordHash });

  // Revoke all refresh tokens for this user
  const { redis } = require('../config/redis');
  const keys = await redis.keys(`refresh:${user.id}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }

  return { message: 'Password reset successful' };
}

// ===== RESEND OTP =====

async function resendOTP(phone, purpose) {
  if (purpose === 'register') {
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      throw ApiErrors.conflict('Phone number is already registered');
    }
  }

  if (purpose === 'forgot_password') {
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return { message: 'If the phone number is registered, an OTP has been sent' };
    }
  }

  await otpService.deleteOTP(phone, purpose);

  const otp = otpService.generateOTP();
  await otpService.storeOTP(phone, otp, purpose);

  const logLabel = purpose === 'forgot_password' ? 'Forgot password' : 'Registration';
  console.log(`[OTP] ${logLabel} OTP for ${phone}: ${otp}`);

  return { message: 'OTP resent successfully' };
}

// ===== ONBOARDING: Driver Profile =====

async function submitDriverProfile(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiErrors.notFound('User not found');
  }
  if (user.role !== 'driver') {
    throw ApiErrors.forbidden('Only drivers can submit a driver profile');
  }

  const existingProfile = await DriverProfile.findOne({ where: { driverId: userId } });
  if (existingProfile) {
    throw ApiErrors.conflict('Driver profile already exists');
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
    throw ApiErrors.badRequest('One or more image IDs are invalid');
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
    throw ApiErrors.notFound('User not found');
  }
  if (user.role !== 'driver') {
    throw ApiErrors.forbidden('Only drivers can add vehicles');
  }

  const driverProfile = await DriverProfile.findOne({ where: { driverId: userId } });
  if (!driverProfile) {
    throw ApiErrors.badRequest('Please complete your driver profile first');
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
    throw ApiErrors.badRequest('One or more image IDs are invalid');
  }

  // Check plate number uniqueness
  const existingVehicle = await Vehicle.findOne({ where: { plateNumber: data.plateNumber } });
  if (existingVehicle) {
    throw ApiErrors.conflict('A vehicle with this plate number already exists');
  }

  const vehicle = await Vehicle.create({
    driverId: userId,
    vehicleType: data.vehicleType,
    manufacturer: data.manufacturer,
    model: data.model,
    modelYear: data.modelYear || null,
    color: data.color || null,
    plateNumber: data.plateNumber,
    seats: data.seats,
    registrationDocFront: data.registrationDocFront,
    registrationDocBack: data.registrationDocBack,
    vehiclePhotoFront: data.vehiclePhotoFront,
    vehiclePhotoBack: data.vehiclePhotoBack,
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
    throw ApiErrors.notFound('User not found');
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
  resendOTP,
  submitDriverProfile,
  getDriverProfile,
  submitVehicle,
  getVehicle,
  getOnboardingStatus,
};
