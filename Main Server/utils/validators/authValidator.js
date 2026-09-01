const { body } = require('express-validator');
const { validatePhone } = require('../phoneValidator');
const V = require('../../config/messages/validation-keys');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerPhoneValidation = [
  body('country_code')
    .trim()
    .notEmpty().withMessage(V.COUNTRY_CODE_IS_REQUIRED)
    .isAlpha().withMessage(V.COUNTRY_CODE_MUST_CONTAIN_ONLY_LETTERS)
    .isLength({ min: 2, max: 2 }).withMessage(V.COUNTRY_CODE_MUST_BE_2_LETTERS_E_G_JO_AE),
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED)
    .custom((value, { req }) => {
      const countryCode = req.body.country_code;
      if (!countryCode) {
        throw new Error(V.COUNTRY_CODE_IS_REQUIRED);
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
    .notEmpty().withMessage(V.ROLE_IS_REQUIRED)
    .isIn(['passenger', 'driver']).withMessage(V.ROLE_MUST_BE_PASSENGER_OR_DRIVER),
];

const verifyOTPValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
  body('otp')
    .trim()
    .notEmpty().withMessage(V.OTP_IS_REQUIRED)
    .isLength({ min: 6, max: 6 }).withMessage(V.OTP_MUST_BE_6_DIGITS)
    .isNumeric().withMessage(V.OTP_MUST_BE_NUMERIC),
];

const registerPasswordValidation = [
  body('password')
    .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED)
    .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND),
  body('confirmPassword')
    .notEmpty().withMessage(V.CONFIRM_PASSWORD_IS_REQUIRED)
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(V.PASSWORDS_DO_NOT_MATCH);
      }
      return true;
    }),
];

const onboardingPassengerProfileValidation = [
  body('fullname')
    .trim()
    .notEmpty().withMessage(V.FULL_NAME_IS_REQUIRED)
    .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('national_id')
    .trim()
    .notEmpty().withMessage(V.NATIONAL_ID_IS_REQUIRED)
    .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
  body('age')
    .notEmpty().withMessage(V.AGE_IS_REQUIRED)
    .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100),
  body('home_address')
    .trim()
    .notEmpty().withMessage(V.HOME_ADDRESS_IS_REQUIRED)
    .isString().withMessage(V.HOME_ADDRESS_MUST_BE_A_STRING),
  body('gender')
    .notEmpty().withMessage(V.GENDER_IS_REQUIRED)
    .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE),
];

const loginValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
  body('password')
    .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED),
];

const forgotPasswordValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
];

const resetPasswordValidation = [
  body('password')
    .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED)
    .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND),
  body('confirmPassword')
    .notEmpty().withMessage(V.CONFIRM_PASSWORD_IS_REQUIRED)
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(V.PASSWORDS_DO_NOT_MATCH);
      }
      return true;
    }),
];

const resendOTPValidation = [
  body('phone')
    .trim()
    .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
  body('purpose')
    .notEmpty().withMessage(V.PURPOSE_IS_REQUIRED)
    .isIn(['register', 'forgot_password']).withMessage(V.PURPOSE_MUST_BE_REGISTER_OR_FORGOT_PASSWORD),
];

const refreshValidation = [
  body('refresh_token')
    .notEmpty().withMessage(V.REFRESH_TOKEN_IS_REQUIRED),
];

const onboardingProfileValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage(V.FULL_NAME_IS_REQUIRED)
    .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('age')
    .notEmpty().withMessage(V.AGE_IS_REQUIRED)
    .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_BETWEEN_18_AND_100),
  body('gender')
    .notEmpty().withMessage(V.GENDER_IS_REQUIRED)
    .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE),
  body('userIdentificationFront')
    .notEmpty().withMessage(V.FRONT_ID_IMAGE_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('userIdentificationBack')
    .notEmpty().withMessage(V.BACK_ID_IMAGE_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('linceseFront')
    .notEmpty().withMessage(V.FRONT_LICENSE_IMAGE_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('linceseBack')
    .notEmpty().withMessage(V.BACK_LICENSE_IMAGE_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('personalImageWithId')
    .notEmpty().withMessage(V.PERSONAL_IMAGE_WITH_ID_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('nationalID')
    .trim()
    .notEmpty().withMessage(V.NATIONAL_ID_IS_REQUIRED)
    .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_BETWEEN_5_AND_30_CHARACTERS),
];

const onboardingVehicleValidation = [
  body('vehicleType')
    .notEmpty().withMessage(V.VEHICLE_TYPE_IS_REQUIRED)
    .isIn(['sedan', 'suv', 'van', 'bus', 'hatchback']).withMessage(V.INVALID_VEHICLE_TYPE),
  body('manufacturer')
    .trim()
    .notEmpty().withMessage(V.MANUFACTURER_IS_REQUIRED)
    .isLength({ max: 80 }).withMessage(V.MANUFACTURER_MUST_BE_AT_MOST_80_CHARACTERS),
  body('model')
    .trim()
    .notEmpty().withMessage(V.MODEL_IS_REQUIRED)
    .isLength({ max: 80 }).withMessage(V.MODEL_MUST_BE_AT_MOST_80_CHARACTERS),
  body('modelYear')
    .optional()
    .isInt().withMessage(V.MODEL_YEAR_MUST_BE_A_VALID_YEAR)
    .custom((value) => {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 10;
      if (value < minYear || value > currentYear) {
        throw new Error(`Model year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
      }
      return true;
    }),
  body('color')
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage(V.COLOR_MUST_BE_AT_MOST_30_CHARACTERS),
  body('plateNumber')
    .trim()
    .notEmpty().withMessage(V.PLATE_NUMBER_IS_REQUIRED)
    .isLength({ max: 20 }).withMessage(V.PLATE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
  body('codeNumber')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage(V.CODE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
  body('seats')
    .notEmpty().withMessage(V.NUMBER_OF_SEATS_IS_REQUIRED)
    .isInt({ min: 1, max: 50 }).withMessage(V.SEATS_MUST_BE_BETWEEN_1_AND_50),
  body('registrationDocFront')
    .notEmpty().withMessage(V.FRONT_REGISTRATION_DOC_IMAGE_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('registrationDocBack')
    .notEmpty().withMessage(V.BACK_REGISTRATION_DOC_IMAGE_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('vehiclePhotoFront')
    .notEmpty().withMessage(V.FRONT_VEHICLE_PHOTO_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
  body('vehiclePhotoBack')
    .notEmpty().withMessage(V.BACK_VEHICLE_PHOTO_IS_REQUIRED)
    .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
];


const changePasswordValidation = [
  body('current_password')
    .notEmpty().withMessage(V.CURRENT_PASSWORD_IS_REQUIRED),
  body('new_password')
    .notEmpty().withMessage(V.NEW_PASSWORD_IS_REQUIRED)
    .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND)
    .custom((value, { req }) => {
      if (value === req.body.current_password) {
        throw new Error(V.NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD);
      }
      return true;
    }),
];
module.exports = {
  registerPhoneValidation,
  verifyOTPValidation,
  registerPasswordValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  resendOTPValidation,
  refreshValidation,
  onboardingProfileValidation,
  onboardingPassengerProfileValidation,
  onboardingVehicleValidation,
};
