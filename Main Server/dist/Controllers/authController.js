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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnboardingStatus = exports.getVehicle = exports.submitVehicle = exports.submitPassengerProfile = exports.getDriverProfile = exports.submitDriverProfile = exports.resendOTP = exports.changePassword = exports.resetPassword = exports.verifyForgotPasswordOTP = exports.forgotPassword = exports.me = exports.logout = exports.refresh = exports.login = exports.registerPassword = exports.verifyRegistrationOTP = exports.registerPhone = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const authService = __importStar(require("../Services/authService"));
const auditService = __importStar(require("../Services/auditService"));
const registerPhone = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { country_code, phone, role } = req.body;
    const result = await authService.registerPhone(country_code, phone, role);
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.registerPhone = registerPhone;
const verifyRegistrationOTP = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { phone, otp } = req.body;
    const result = await authService.verifyRegistrationOTP(phone, otp);
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.verifyRegistrationOTP = verifyRegistrationOTP;
const registerPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.registerPassword(req.headers.authorization, req.body);
    auditService.markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.registerPassword = registerPassword;
const login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { phone, password } = req.body;
    const result = await authService.login(phone, password);
    auditService.markResource(res, { type: 'user', id: result.user.id, label: result.user.phone });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.login = login;
const refresh = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.refresh = refresh;
const logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { refresh_token } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await authService.logout(String(authReq.user?.id), refresh_token, accessToken);
    auditService.markResource(res, { type: 'user', id: authReq.user?.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.logout = logout;
const changePassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { current_password, new_password } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];
    const result = await authService.changePassword(String(authReq.user?.id), current_password, new_password, accessToken);
    auditService.markResource(res, { type: 'user', id: authReq.user?.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.changePassword = changePassword;
const me = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const user = await authService.me(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, user);
});
exports.me = me;
const forgotPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { phone } = req.body;
    const result = await authService.forgotPassword(phone);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.forgotPassword = forgotPassword;
const verifyForgotPasswordOTP = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { phone, otp } = req.body;
    const result = await authService.verifyForgotPasswordOTP(phone, otp);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.verifyForgotPasswordOTP = verifyForgotPasswordOTP;
const resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { password } = req.body;
    const result = await authService.resetPassword(req.headers.authorization, password);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.resetPassword = resetPassword;
const resendOTP = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { phone, purpose } = req.body;
    const result = await authService.resendOTP(phone, purpose);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.resendOTP = resendOTP;
const submitDriverProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await authService.submitDriverProfile(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'driver_profile', id: result.driverProfile.id });
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.submitDriverProfile = submitDriverProfile;
const getDriverProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await authService.getDriverProfile(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getDriverProfile = getDriverProfile;
const submitPassengerProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await authService.submitPassengerProfile(String(authReq.user?.id), req.body);
    const { fullname } = req.body;
    auditService.markResource(res, { type: 'passenger_profile', id: result.passengerProfile.id, label: fullname });
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.submitPassengerProfile = submitPassengerProfile;
const submitVehicle = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await authService.submitVehicle(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'vehicle', id: result.vehicle.id, label: result.vehicle.plateNumber });
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.submitVehicle = submitVehicle;
const getVehicle = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await authService.getVehicle(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getVehicle = getVehicle;
const getOnboardingStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await authService.getOnboardingStatus(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getOnboardingStatus = getOnboardingStatus;
exports.default = {
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
    submitPassengerProfile,
    submitVehicle,
    getVehicle,
    getOnboardingStatus,
};
//# sourceMappingURL=authController.js.map