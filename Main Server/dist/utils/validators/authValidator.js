"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordValidation = exports.onboardingVehicleValidation = exports.onboardingProfileValidation = exports.refreshValidation = exports.resendOTPValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.loginValidation = exports.onboardingPassengerProfileValidation = exports.registerPasswordValidation = exports.verifyOTPValidation = exports.registerPhoneValidation = void 0;
const express_validator_1 = require("express-validator");
const phoneValidator_1 = require("../phoneValidator");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const V = require("../../config/messages/validation-keys");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
exports.registerPhoneValidation = [
    (0, express_validator_1.body)('country_code')
        .trim()
        .notEmpty().withMessage(V.COUNTRY_CODE_IS_REQUIRED)
        .isAlpha().withMessage(V.COUNTRY_CODE_MUST_CONTAIN_ONLY_LETTERS)
        .isLength({ min: 2, max: 2 }).withMessage(V.COUNTRY_CODE_MUST_BE_2_LETTERS_E_G_JO_AE),
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED)
        .custom((value, meta) => {
        const req = meta.req;
        const countryCode = req.body.country_code;
        if (!countryCode) {
            throw new Error(V.COUNTRY_CODE_IS_REQUIRED);
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
        .notEmpty().withMessage(V.ROLE_IS_REQUIRED)
        .isIn(['passenger', 'driver']).withMessage(V.ROLE_MUST_BE_PASSENGER_OR_DRIVER),
];
exports.verifyOTPValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
    (0, express_validator_1.body)('otp')
        .trim()
        .notEmpty().withMessage(V.OTP_IS_REQUIRED)
        .isLength({ min: 6, max: 6 }).withMessage(V.OTP_MUST_BE_6_DIGITS)
        .isNumeric().withMessage(V.OTP_MUST_BE_NUMERIC),
];
exports.registerPasswordValidation = [
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED)
        .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND),
    (0, express_validator_1.body)('confirmPassword')
        .notEmpty().withMessage(V.CONFIRM_PASSWORD_IS_REQUIRED)
        .custom((value, meta) => {
        const req = meta.req;
        if (value !== req.body.password) {
            throw new Error(V.PASSWORDS_DO_NOT_MATCH);
        }
        return true;
    }),
];
exports.onboardingPassengerProfileValidation = [
    (0, express_validator_1.body)('fullname')
        .trim()
        .notEmpty().withMessage(V.FULL_NAME_IS_REQUIRED)
        .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('national_id')
        .trim()
        .notEmpty().withMessage(V.NATIONAL_ID_IS_REQUIRED)
        .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
    (0, express_validator_1.body)('age')
        .notEmpty().withMessage(V.AGE_IS_REQUIRED)
        .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100),
    (0, express_validator_1.body)('home_address')
        .trim()
        .notEmpty().withMessage(V.HOME_ADDRESS_IS_REQUIRED)
        .isString().withMessage(V.HOME_ADDRESS_MUST_BE_A_STRING),
    (0, express_validator_1.body)('gender')
        .notEmpty().withMessage(V.GENDER_IS_REQUIRED)
        .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE),
];
exports.loginValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED),
];
exports.forgotPasswordValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
];
exports.resetPasswordValidation = [
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage(V.PASSWORD_IS_REQUIRED)
        .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND),
    (0, express_validator_1.body)('confirmPassword')
        .notEmpty().withMessage(V.CONFIRM_PASSWORD_IS_REQUIRED)
        .custom((value, meta) => {
        const req = meta.req;
        if (value !== req.body.password) {
            throw new Error(V.PASSWORDS_DO_NOT_MATCH);
        }
        return true;
    }),
];
exports.resendOTPValidation = [
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty().withMessage(V.PHONE_NUMBER_IS_REQUIRED),
    (0, express_validator_1.body)('purpose')
        .notEmpty().withMessage(V.PURPOSE_IS_REQUIRED)
        .isIn(['register', 'forgot_password']).withMessage(V.PURPOSE_MUST_BE_REGISTER_OR_FORGOT_PASSWORD),
];
exports.refreshValidation = [
    (0, express_validator_1.body)('refresh_token')
        .notEmpty().withMessage(V.REFRESH_TOKEN_IS_REQUIRED),
];
exports.onboardingProfileValidation = [
    (0, express_validator_1.body)('fullName')
        .trim()
        .notEmpty().withMessage(V.FULL_NAME_IS_REQUIRED)
        .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('age')
        .notEmpty().withMessage(V.AGE_IS_REQUIRED)
        .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_BETWEEN_18_AND_100),
    (0, express_validator_1.body)('gender')
        .notEmpty().withMessage(V.GENDER_IS_REQUIRED)
        .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE),
    (0, express_validator_1.body)('userIdentificationFront')
        .notEmpty().withMessage(V.FRONT_ID_IMAGE_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('userIdentificationBack')
        .notEmpty().withMessage(V.BACK_ID_IMAGE_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('linceseFront')
        .notEmpty().withMessage(V.FRONT_LICENSE_IMAGE_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('linceseBack')
        .notEmpty().withMessage(V.BACK_LICENSE_IMAGE_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('personalImageWithId')
        .notEmpty().withMessage(V.PERSONAL_IMAGE_WITH_ID_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('nationalID')
        .trim()
        .notEmpty().withMessage(V.NATIONAL_ID_IS_REQUIRED)
        .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_BETWEEN_5_AND_30_CHARACTERS),
];
exports.onboardingVehicleValidation = [
    (0, express_validator_1.body)('vehicleType')
        .notEmpty().withMessage(V.VEHICLE_TYPE_IS_REQUIRED)
        .isIn(['sedan', 'suv', 'van', 'bus', 'hatchback']).withMessage(V.INVALID_VEHICLE_TYPE),
    (0, express_validator_1.body)('manufacturer')
        .trim()
        .notEmpty().withMessage(V.MANUFACTURER_IS_REQUIRED)
        .isLength({ max: 80 }).withMessage(V.MANUFACTURER_MUST_BE_AT_MOST_80_CHARACTERS),
    (0, express_validator_1.body)('model')
        .trim()
        .notEmpty().withMessage(V.MODEL_IS_REQUIRED)
        .isLength({ max: 80 }).withMessage(V.MODEL_MUST_BE_AT_MOST_80_CHARACTERS),
    (0, express_validator_1.body)('modelYear')
        .optional()
        .isInt().withMessage(V.MODEL_YEAR_MUST_BE_A_VALID_YEAR)
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
        .isLength({ max: 30 }).withMessage(V.COLOR_MUST_BE_AT_MOST_30_CHARACTERS),
    (0, express_validator_1.body)('plateNumber')
        .trim()
        .notEmpty().withMessage(V.PLATE_NUMBER_IS_REQUIRED)
        .isLength({ max: 20 }).withMessage(V.PLATE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
    (0, express_validator_1.body)('codeNumber')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage(V.CODE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
    (0, express_validator_1.body)('seats')
        .notEmpty().withMessage(V.NUMBER_OF_SEATS_IS_REQUIRED)
        .isInt({ min: 1, max: 50 }).withMessage(V.SEATS_MUST_BE_BETWEEN_1_AND_50),
    (0, express_validator_1.body)('registrationDocFront')
        .notEmpty().withMessage(V.FRONT_REGISTRATION_DOC_IMAGE_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('registrationDocBack')
        .notEmpty().withMessage(V.BACK_REGISTRATION_DOC_IMAGE_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('vehiclePhotoFront')
        .notEmpty().withMessage(V.FRONT_VEHICLE_PHOTO_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
    (0, express_validator_1.body)('vehiclePhotoBack')
        .notEmpty().withMessage(V.BACK_VEHICLE_PHOTO_IS_REQUIRED)
        .isInt().withMessage(V.IMAGE_ID_MUST_BE_A_VALID_INTEGER),
];
exports.changePasswordValidation = [
    (0, express_validator_1.body)('current_password')
        .notEmpty().withMessage(V.CURRENT_PASSWORD_IS_REQUIRED),
    (0, express_validator_1.body)('new_password')
        .notEmpty().withMessage(V.NEW_PASSWORD_IS_REQUIRED)
        .matches(passwordRegex).withMessage(V.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS_WITH_UPPERCASE_LOWERCASE_NUMBER_AND)
        .custom((value, meta) => {
        const req = meta.req;
        if (value === req.body.current_password) {
            throw new Error(V.NEW_PASSWORD_MUST_BE_DIFFERENT_FROM_THE_CURRENT_PASSWORD);
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
module.exports = authValidator;
//# sourceMappingURL=authValidator.js.map