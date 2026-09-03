import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/authController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { registerPhoneValidation, verifyOTPValidation, registerPasswordValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, resendOTPValidation, refreshValidation, changePasswordValidation, onboardingProfileValidation, onboardingPassengerProfileValidation, onboardingVehicleValidation, } from '../utils/validators/authValidator';

// Registration
router.post('/register/phone', ...registerPhoneValidation, validate, c.registerPhone);
router.post('/register/verify-otp', ...verifyOTPValidation, validate, c.verifyRegistrationOTP);
router.post('/register/password', ...registerPasswordValidation, validate, c.registerPassword);

// Login
router.post('/login', ...loginValidation, validate, c.login);

// Token
router.post('/refresh', ...refreshValidation, validate, c.refresh);
router.post('/logout', protect, c.logout);

// Me
router.get('/me', protect, c.me);

// Change password (spec 010, settings screen)
router.post('/change-password', protect, ...changePasswordValidation, validate, c.changePassword);

// Forgot password
router.post('/forgot-password', ...forgotPasswordValidation, validate, c.forgotPassword);
router.post('/forgot-password/verify-otp', ...verifyOTPValidation, validate, c.verifyForgotPasswordOTP);
router.post('/forgot-password/reset', ...resetPasswordValidation, validate, c.resetPassword);

// Resend OTP
router.post('/resend-otp', ...resendOTPValidation, validate, c.resendOTP);

// Onboarding - Driver
router.post('/onboarding/profile', protect, roleGuard(['driver']), ...onboardingProfileValidation, validate, c.submitDriverProfile);
router.get('/onboarding/profile', protect, roleGuard(['driver']), c.getDriverProfile);
router.post('/onboarding/vehicle', protect, roleGuard(['driver']), ...onboardingVehicleValidation, validate, c.submitVehicle);
router.get('/onboarding/vehicle', protect, roleGuard(['driver']), c.getVehicle);
router.get('/onboarding/status', protect, roleGuard(['driver']), c.getOnboardingStatus);

// Onboarding - Passenger
router.post('/onboarding/profile/passenger', protect, roleGuard(['passenger']), ...onboardingPassengerProfileValidation, validate, c.submitPassengerProfile);

export default router;
module.exports = router;
