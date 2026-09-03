"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordValidation = exports.onboardingVehicleValidation = exports.onboardingProfileValidation = exports.refreshValidation = exports.resendOTPValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.loginValidation = exports.onboardingPassengerProfileValidation = exports.registerPasswordValidation = exports.verifyOTPValidation = exports.registerPhoneValidation = void 0;
const express_validator_1 = require("express-validator");
const phoneValidator_1 = require("../phoneValidator");
const validation_keys_1 = require("../../config/messages/validation-keys");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
exports.registerPhoneValidation = [
    (0, express_validator_1.body)('country_code')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.COUNTRY_CODE_IS_REQUIRED)
        .isAlpha().withMessage(validation_keys_1.VALIDATION_KEYS.COUNTRY_CODE_MUST_CONTAIN_ONLY_LETTERS)
        .isLength({ min: 2, max: 2 }).withMessage(validation_keys_1.VALIDATION_KEYS.COUNTRY_CODE_MUST_BE_2_LETTERS_E_G_JO_AE),
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_NUMBER_IS_REQUIRED)
        .custom((value, meta) => {
        const req = meta.req;
        const countryCode = req.body.country_code;
        if (!countryCode) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.COUNTRY_CODE_IS_REQUIRED);
        }
        const result = (0, phoneValidator_1.validatePhone)(countryCode, value);
        if (!result.valid) {
            throw new Error(result.error);
        }
        // Store the normalized full phone on the request for downstream use
        req.body.phone = result.fullPhone;
        req.body.country_code = result.countryCode;
        return true;
    }),
    (0, express_validator_1.body)('role')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.ROLE_IS_REQUIRED)
        .isIn(['passenger', 'driver']).withMessage(validation_keys_1.VALIDATION_KEYS.ROLE_MUST_BE_PASSENGER_OR_DRIVER),
];
exports.verifyOTPValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_NUMBER_IS_REQUIRED),
    (0, express_validator_1.body)('otp')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.OTP_IS_REQUIRED)
        .isLength({ min: 6, max: 6 }).withMessage(validation_keys_1.VALIDATION_KEYS.OTP_MUST_BE_6_DIGITS)
        .isNumeric().withMessage(validation_keys_1.VALIDATION_KEYS.OTP_MUST_BE_NUMERIC),
];
exports.registerPasswordValidation = [
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PASSWORD_IS_REQUIRED)
        .matches(passwordRegex).withMessage(validation_keys_1.VALIDATION_KEYS.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND),
    (0, express_validator_1.body)('confirmPassword')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.CONFIRM_PASSWORD_IS_REQUIRED)
        .custom((value, meta) => {
        const req = meta.req;
        if (value !== req.body.password) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.PASSWORDS_DO_NOT_MATCH);
        }
        return true;
    }),
];
exports.onboardingPassengerProfileValidation = [
    (0, express_validator_1.body)('fullname')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_IS_REQUIRED)
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('national_id')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_IS_REQUIRED)
        .isLength({ min: 5, max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
    (0, express_validator_1.body)('age')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.AGE_IS_REQUIRED)
        .isInt({ min: 18, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100),
    (0, express_validator_1.body)('home_address')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.HOME_ADDRESS_IS_REQUIRED)
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.HOME_ADDRESS_MUST_BE_A_STRING),
    (0, express_validator_1.body)('gender')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.GENDER_IS_REQUIRED)
        .isIn(['male', 'female']).withMessage(validation_keys_1.VALIDATION_KEYS.GENDER_MUST_BE_MALE_OR_FEMALE),
];
exports.loginValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_NUMBER_IS_REQUIRED),
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PASSWORD_IS_REQUIRED),
];
exports.forgotPasswordValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_NUMBER_IS_REQUIRED),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PASSWORD_IS_REQUIRED)
        .matches(passwordRegex).withMessage(validation_keys_1.VALIDATION_KEYS.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND),
    (0, express_validator_1.body)('confirmPassword')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.CONFIRM_PASSWORD_IS_REQUIRED)
        .custom((value, meta) => {
        const req = meta.req;
        if (value !== req.body.password) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.PASSWORDS_DO_NOT_MATCH);
        }
        return true;
    }),
];
exports.resendOTPValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_NUMBER_IS_REQUIRED),
    (0, express_validator_1.body)('purpose')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PURPOSE_IS_REQUIRED)
        .isIn(['register', 'forgot_password']).withMessage(validation_keys_1.VALIDATION_KEYS.PURPOSE_MUST_BE_REGISTER_OR_FORGOT_PASSWORD),
];
exports.refreshValidation = [
    (0, express_validator_1.body)('refresh_token')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.REFRESH_TOKEN_IS_REQUIRED),
];
exports.onboardingProfileValidation = [
    (0, express_validator_1.body)('fullName')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_IS_REQUIRED)
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('age')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.AGE_IS_REQUIRED)
        .isInt({ min: 18, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.AGE_MUST_BE_BETWEEN_18_AND_100),
    (0, express_validator_1.body)('gender')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.GENDER_IS_REQUIRED)
        .isIn(['male', 'female']).withMessage(validation_keys_1.VALIDATION_KEYS.GENDER_MUST_BE_MALE_OR_FEMALE),
    (0, express_validator_1.body)('userIdentificationFront')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FRONT_ID_IMAGE_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('userIdentificationBack')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.BACK_ID_IMAGE_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('linceseFront')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FRONT_LICENSE_IMAGE_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('linceseBack')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.BACK_LICENSE_IMAGE_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('personalImageWithId')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PERSONAL_IMAGE_WITH_ID_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('nationalID')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_IS_REQUIRED)
        .isLength({ min: 5, max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_MUST_BE_BETWEEN_5_AND_30_CHARACTERS),
];
exports.onboardingVehicleValidation = [
    (0, express_validator_1.body)('vehicleType')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_TYPE_IS_REQUIRED)
        .isIn(['sedan', 'suv', 'van', 'bus', 'hatchback']).withMessage(validation_keys_1.VALIDATION_KEYS.INVALID_VEHICLE_TYPE),
    (0, express_validator_1.body)('manufacturer')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.MANUFACTURER_IS_REQUIRED)
        .isLength({ max: 80 }).withMessage(validation_keys_1.VALIDATION_KEYS.MANUFACTURER_MUST_BE_AT_MOST_80_CHARACTERS),
    (0, express_validator_1.body)('model')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.MODEL_IS_REQUIRED)
        .isLength({ max: 80 }).withMessage(validation_keys_1.VALIDATION_KEYS.MODEL_MUST_BE_AT_MOST_80_CHARACTERS),
    (0, express_validator_1.body)('modelYear')
        .optional()
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.MODEL_YEAR_MUST_BE_A_VALID_YEAR)
        .custom((value) => {
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 10;
        const numValue = Number(value);
        if (numValue < minYear || numValue > currentYear) {
            throw new Error(`Model year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
        }
        return true;
    }),
    (0, express_validator_1.body)('color')
        .optional()
        .trim()
        .isLength({ max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.COLOR_MUST_BE_AT_MOST_30_CHARACTERS),
    (0, express_validator_1.body)('plateNumber')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PLATE_NUMBER_IS_REQUIRED)
        .isLength({ max: 20 }).withMessage(validation_keys_1.VALIDATION_KEYS.PLATE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
    (0, express_validator_1.body)('codeNumber')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage(validation_keys_1.VALIDATION_KEYS.CODE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
    (0, express_validator_1.body)('seats')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NUMBER_OF_SEATS_IS_REQUIRED)
        .isInt({ min: 1, max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEATS_MUST_BE_BETWEEN_1_AND_50),
    (0, express_validator_1.body)('registrationDocFront')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FRONT_REGISTRATION_DOC_IMAGE_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('registrationDocBack')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.BACK_REGISTRATION_DOC_IMAGE_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('vehiclePhotoFront')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FRONT_VEHICLE_PHOTO_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('vehiclePhotoBack')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.BACK_VEHICLE_PHOTO_IS_REQUIRED)
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
];
exports.changePasswordValidation = [
    (0, express_validator_1.body)('current_password')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.CURRENT_PASSWORD_IS_REQUIRED),
    (0, express_validator_1.body)('new_password')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.NEW_PASSWORD_IS_REQUIRED)
        .matches(passwordRegex).withMessage(validation_keys_1.VALIDATION_KEYS.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND)
        .custom((value, meta) => {
        const req = meta.req;
        if (value === req.body.current_password) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD);
        }
        return true;
    }),
];
const authValidator = {
    registerPhoneValidation: exports.registerPhoneValidation,
    verifyOTPValidation: exports.verifyOTPValidation,
    registerPasswordValidation: exports.registerPasswordValidation,
    loginValidation: exports.loginValidation,
    forgotPasswordValidation: exports.forgotPasswordValidation,
    resetPasswordValidation: exports.resetPasswordValidation,
    changePasswordValidation: exports.changePasswordValidation,
    resendOTPValidation: exports.resendOTPValidation,
    refreshValidation: exports.refreshValidation,
    onboardingProfileValidation: exports.onboardingProfileValidation,
    onboardingPassengerProfileValidation: exports.onboardingPassengerProfileValidation,
    onboardingVehicleValidation: exports.onboardingVehicleValidation,
};
exports.default = authValidator;
module.exports = authValidator;
//# sourceMappingURL=authValidator.js.map