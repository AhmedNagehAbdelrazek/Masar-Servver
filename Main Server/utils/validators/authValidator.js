const { body, header, param } = require('express-validator');
const { validatePhone } = require('../phoneValidator');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerPhoneValidation = [
  body('country_code')
    .trim()
    .notEmpty().withMessage('Country code is required')
    .isAlpha().withMessage('Country code must contain only letters')
    .isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 letters (e.g., JO, AE)'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .custom((value, { req }) => {
      const countryCode = req.body.country_code;
      if (!countryCode) {
        throw new Error('Country code is required');
      }
      const result = validatePhone(countryCode, value);
      if (!result.valid) {
        throw new Error(result.error);
      }
      // Store the normalized full phone on the request for downstream use
      req.body.phone = result.fullPhone;
      req.body.country_code = result.countryCode;
      return true;
    }),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['passenger', 'driver']).withMessage('Role must be passenger or driver'),
];

const verifyOTPValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
];

const registerPasswordValidation = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .matches(passwordRegex).withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const loginValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
];

const resetPasswordValidation = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .matches(passwordRegex).withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

const resendOTPValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
  body('purpose')
    .notEmpty().withMessage('Purpose is required')
    .isIn(['register', 'forgot_password']).withMessage('Purpose must be register or forgot_password'),
];

const refreshValidation = [
  body('refresh_token')
    .notEmpty().withMessage('Refresh token is required'),
];

const onboardingProfileValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 120 }).withMessage('Full name must be at most 120 characters'),
  body('age')
    .notEmpty().withMessage('Age is required')
    .isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('userIdentificationFront')
    .notEmpty().withMessage('Front ID image is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('userIdentificationBack')
    .notEmpty().withMessage('Back ID image is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('linceseFront')
    .notEmpty().withMessage('Front license image is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('linceseBack')
    .notEmpty().withMessage('Back license image is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('personalImageWithId')
    .notEmpty().withMessage('Personal image with ID is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('nationalID')
    .trim()
    .notEmpty().withMessage('National ID is required')
    .isLength({ min: 5, max: 30 }).withMessage('National ID must be between 5 and 30 characters'),
];

const onboardingVehicleValidation = [
  body('vehicleType')
    .notEmpty().withMessage('Vehicle type is required')
    .isIn(['sedan', 'suv', 'van', 'bus', 'hatchback']).withMessage('Invalid vehicle type'),
  body('manufacturer')
    .trim()
    .notEmpty().withMessage('Manufacturer is required')
    .isLength({ max: 80 }).withMessage('Manufacturer must be at most 80 characters'),
  body('model')
    .trim()
    .notEmpty().withMessage('Model is required')
    .isLength({ max: 80 }).withMessage('Model must be at most 80 characters'),
  body('modelYear')
    .optional()
    .isInt({ min: 1900, max: 2030 }).withMessage('Invalid model year'),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage('Color must be at most 30 characters'),
  body('plateNumber')
    .trim()
    .notEmpty().withMessage('Plate number is required')
    .isLength({ max: 20 }).withMessage('Plate number must be at most 20 characters'),
  body('seats')
    .notEmpty().withMessage('Number of seats is required')
    .isInt({ min: 1, max: 50 }).withMessage('Seats must be between 1 and 50'),
  body('registrationDocFront')
    .notEmpty().withMessage('Front registration doc image is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('registrationDocBack')
    .notEmpty().withMessage('Back registration doc image is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('vehiclePhotoFront')
    .notEmpty().withMessage('Front vehicle photo is required')
    .isInt().withMessage('Image ID must be a valid integer'),
  body('vehiclePhotoBack')
    .notEmpty().withMessage('Back vehicle photo is required')
    .isInt().withMessage('Image ID must be a valid integer'),
];

module.exports = {
  registerPhoneValidation,
  verifyOTPValidation,
  registerPasswordValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  resendOTPValidation,
  refreshValidation,
  onboardingProfileValidation,
  onboardingVehicleValidation,
};
