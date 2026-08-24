const authService = require('../Services/authService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const { markResource } = require('../Services/auditService');

const registerPhone = catchAsync(async (req, res) => {
  const { country_code, phone, role } = req.body;
  const result = await authService.registerPhone(country_code, phone, role);
  successResponse(res, result, 201);
});

const verifyRegistrationOTP = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  const result = await authService.verifyRegistrationOTP(phone, otp);
  successResponse(res, result, 201);
});

const registerPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  const result = await authService.registerPassword(req.headers.authorization, password);
  markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
  successResponse(res, result, 201);
});

const login = catchAsync(async (req, res) => {
  const { phone, password } = req.body;
  const result = await authService.login(phone, password);
  markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
  successResponse(res, result);
});

const refresh = catchAsync(async (req, res) => {
  const { refresh_token } = req.body;
  const result = await authService.refreshToken(refresh_token);
  successResponse(res, result);
});

const logout = catchAsync(async (req, res) => {
  const { refresh_token } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];
  const result = await authService.logout(req.user.id, refresh_token, accessToken);
  markResource(res, { type: 'user', id: req.user.id });
  successResponse(res, result);
});


const changePassword = catchAsync(async (req, res) => {
  const { current_password, new_password } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];
  const result = await authService.changePassword(req.user.id, current_password, new_password, accessToken);
  markResource(res, { type: 'user', id: req.user.id });
  successResponse(res, result);
});
const me = catchAsync(async (req, res) => {
  const user = await authService.me(req.user.id);
  successResponse(res, user);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { phone } = req.body;
  const result = await authService.forgotPassword(phone);
  successResponse(res, result);
});

const verifyForgotPasswordOTP = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;
  const result = await authService.verifyForgotPasswordOTP(phone, otp);
  successResponse(res, result);
});

const resetPassword = catchAsync(async (req, res) => {
  const { password } = req.body;
  const result = await authService.resetPassword(req.headers.authorization, password);
  successResponse(res, result);
});

const resendOTP = catchAsync(async (req, res) => {
  const { phone, purpose } = req.body;
  const result = await authService.resendOTP(phone, purpose);
  successResponse(res, result);
});

const submitDriverProfile = catchAsync(async (req, res) => {
  const result = await authService.submitDriverProfile(req.user.id, req.body);
  markResource(res, { type: 'driver_profile', id: result.driverProfile.id });
  successResponse(res, result, 201);
});

const getDriverProfile = catchAsync(async (req, res) => {
  const result = await authService.getDriverProfile(req.user.id);
  successResponse(res, result);
});

const submitVehicle = catchAsync(async (req, res) => {
  const result = await authService.submitVehicle(req.user.id, req.body);
  markResource(res, {
    type: 'vehicle',
    id: result.vehicle.id,
    label: result.vehicle.plateNumber,
  });
  successResponse(res, result, 201);
});

const getVehicle = catchAsync(async (req, res) => {
  const result = await authService.getVehicle(req.user.id);
  successResponse(res, result);
});

const getOnboardingStatus = catchAsync(async (req, res) => {
  const result = await authService.getOnboardingStatus(req.user.id);
  successResponse(res, result);
});

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
  changePassword,
  resendOTP,
  submitDriverProfile,
  getDriverProfile,
  submitVehicle,
  getVehicle,
  getOnboardingStatus,
};
