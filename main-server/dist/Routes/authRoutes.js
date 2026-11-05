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
const express_1 = require("express");
const router = (0, express_1.Router)();
const c = __importStar(require("../Controllers/authController"));
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const authValidator_1 = require("../utils/validators/authValidator");
// Registration
router.post('/register/phone', ...authValidator_1.registerPhoneValidation, validatorMiddleware_1.default, c.registerPhone);
router.post('/register/verify-otp', ...authValidator_1.verifyOTPValidation, validatorMiddleware_1.default, c.verifyRegistrationOTP);
router.post('/register/password', ...authValidator_1.registerPasswordValidation, validatorMiddleware_1.default, c.registerPassword);
// Login
router.post('/login', ...authValidator_1.loginValidation, validatorMiddleware_1.default, c.login);
// Token
router.post('/refresh', ...authValidator_1.refreshValidation, validatorMiddleware_1.default, c.refresh);
router.post('/logout', protect_1.default, c.logout);
// Me
router.get('/me', protect_1.default, c.me);
// Change password (spec 010, settings screen)
router.post('/change-password', protect_1.default, ...authValidator_1.changePasswordValidation, validatorMiddleware_1.default, c.changePassword);
// Forgot password
router.post('/forgot-password', ...authValidator_1.forgotPasswordValidation, validatorMiddleware_1.default, c.forgotPassword);
router.post('/forgot-password/verify-otp', ...authValidator_1.verifyOTPValidation, validatorMiddleware_1.default, c.verifyForgotPasswordOTP);
router.post('/forgot-password/reset', ...authValidator_1.resetPasswordValidation, validatorMiddleware_1.default, c.resetPassword);
// Resend OTP
router.post('/resend-otp', ...authValidator_1.resendOTPValidation, validatorMiddleware_1.default, c.resendOTP);
// Onboarding - Driver
router.post('/onboarding/profile', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...authValidator_1.onboardingProfileValidation, validatorMiddleware_1.default, c.submitDriverProfile);
router.get('/onboarding/profile', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getDriverProfile);
router.post('/onboarding/vehicle', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...authValidator_1.onboardingVehicleValidation, validatorMiddleware_1.default, c.submitVehicle);
router.get('/onboarding/vehicle', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getVehicle);
router.get('/onboarding/status', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getOnboardingStatus);
// Onboarding - Passenger
router.post('/onboarding/profile/passenger', protect_1.default, (0, roleGuard_1.roleGuard)(['passenger']), ...authValidator_1.onboardingPassengerProfileValidation, validatorMiddleware_1.default, c.submitPassengerProfile);
exports.default = router;
module.exports = router;
//# sourceMappingURL=authRoutes.js.map