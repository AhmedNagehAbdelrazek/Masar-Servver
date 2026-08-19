const authService = require('../Services/authService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const registerPhone = async (req, res, next) => {
  try {
    const { country_code, phone, role } = req.body;
    const result = await authService.registerPhone(country_code, phone, role);
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const verifyRegistrationOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyRegistrationOTP(phone, otp);
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const registerPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const result = await authService.registerPassword(req.headers.authorization, password);
    markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const result = await authService.login(phone, password);
    markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(req.user.id, refresh_token, accessToken);
    markResource(res, { type: 'user', id: req.user.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    successResponse(res, user);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await authService.forgotPassword(phone);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const verifyForgotPasswordOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyForgotPasswordOTP(phone, otp);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const result = await authService.resetPassword(req.headers.authorization, password);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { phone, purpose } = req.body;
    const result = await authService.resendOTP(phone, purpose);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const submitDriverProfile = async (req, res, next) => {
  try {
    const result = await authService.submitDriverProfile(req.user.id, req.body);
    markResource(res, { type: 'driver_profile', id: result.driverProfile.id });
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getDriverProfile = async (req, res, next) => {
  try {
    const result = await authService.getDriverProfile(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const submitVehicle = async (req, res, next) => {
  try {
    const result = await authService.submitVehicle(req.user.id, req.body);
    markResource(res, {
      type: 'vehicle',
      id: result.vehicle.id,
      label: result.vehicle.plateNumber,
    });
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getVehicle = async (req, res, next) => {
  try {
    const result = await authService.getVehicle(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getOnboardingStatus = async (req, res, next) => {
  try {
    const result = await authService.getOnboardingStatus(req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerPhone,
  verifyRegistrationOTP,
  registerPassword,
  login,
  refresh,
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
