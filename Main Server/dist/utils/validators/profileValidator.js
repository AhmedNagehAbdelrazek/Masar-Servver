"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassengerProfileValidation = exports.updateDriverPersonalDataValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = require("../../config/messages/validation-keys");
// Driver personal-data screen (spec 010). Identity/vehicle fields are only
// accepted while verification is unverified/rejected; the service enforces
// the lock and this validator just checks shapes.
exports.updateDriverPersonalDataValidation = [
    (0, express_validator_1.body)('full_name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_MUST_BE_3_120_CHARACTERS),
    (0, express_validator_1.body)('display_name')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.DISPLAY_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('email')
        .optional({ nullable: true })
        .trim()
        .isEmail().withMessage(validation_keys_1.VALIDATION_KEYS.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS_2)
        .normalizeEmail(),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_CANNOT_BE_EMPTY),
    (0, express_validator_1.body)('age')
        .optional({ nullable: true })
        .isInt({ min: 18, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100),
    (0, express_validator_1.body)('avatar_url')
        .optional({ nullable: true })
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.AVATAR_URL_MUST_BE_A_STRING),
    (0, express_validator_1.body)('national_id')
        .optional()
        .trim()
        .isLength({ min: 5, max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
    (0, express_validator_1.body)('vehicle')
        .optional()
        .isObject().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MUST_BE_AN_OBJECT_2),
    (0, express_validator_1.body)('vehicle.manufacturer')
        .optional()
        .trim()
        .isLength({ min: 2, max: 60 }).withMessage(validation_keys_1.VALIDATION_KEYS.MANUFACTURER_MUST_BE_2_60_CHARACTERS),
    (0, express_validator_1.body)('vehicle.model')
        .optional()
        .trim()
        .isLength({ min: 1, max: 60 }).withMessage(validation_keys_1.VALIDATION_KEYS.MODEL_MUST_BE_1_60_CHARACTERS),
    (0, express_validator_1.body)('vehicle.model_year')
        .optional()
        .isInt({ min: 1990, max: 2100 }).withMessage(validation_keys_1.VALIDATION_KEYS.MODEL_YEAR_MUST_BE_A_VALID_YEAR),
    (0, express_validator_1.body)('vehicle.color')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 40 }).withMessage(validation_keys_1.VALIDATION_KEYS.COLOR_MUST_BE_AT_MOST_40_CHARACTERS),
    (0, express_validator_1.body)('vehicle.plate_number')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage(validation_keys_1.VALIDATION_KEYS.PLATE_NUMBER_MUST_BE_3_20_CHARACTERS),
    (0, express_validator_1.body)('vehicle.total_seats')
        .optional()
        .isInt({ min: 1, max: 15 }).withMessage(validation_keys_1.VALIDATION_KEYS.TOTAL_SEATS_MUST_BE_BETWEEN_1_AND_15),
];
exports.updatePassengerProfileValidation = [
    (0, express_validator_1.body)('preferred_gender')
        .optional()
        .isIn(['male', 'female', 'any']).withMessage(validation_keys_1.VALIDATION_KEYS.PREFERRED_GENDER_MUST_BE_MALE_FEMALE_OR_ANY),
    (0, express_validator_1.body)('smoking_preference')
        .optional()
        .isIn(['no_preference', 'non_smoking', 'smoking_allowed']).withMessage(validation_keys_1.VALIDATION_KEYS.SMOKING_PREFERENCE_MUST_BE_ONE_OF_NO_PREFERENCE_NON_SMOKING_SMOKING_ALLOWED),
    (0, express_validator_1.body)('national_id')
        .optional()
        .trim()
        .isLength({ min: 5, max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
    (0, express_validator_1.body)('home_address')
        .optional()
        .trim()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.HOME_ADDRESS_MUST_BE_A_STRING),
    (0, express_validator_1.body)('saved_routes')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.SAVED_ROUTES_MUST_BE_AN_ARRAY),
    (0, express_validator_1.body)('emergency_contacts')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.EMERGENCY_CONTACTS_MUST_BE_AN_ARRAY),
];
const _exported = { updatePassengerProfileValidation: exports.updatePassengerProfileValidation, updateDriverPersonalDataValidation: exports.updateDriverPersonalDataValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { updatePassengerProfileValidation: exports.updatePassengerProfileValidation, updateDriverPersonalDataValidation: exports.updateDriverPersonalDataValidation };
    // @ts-ignore
    module.exports.updatePassengerProfileValidation = exports.updatePassengerProfileValidation;
    // @ts-ignore
    module.exports.updateDriverPersonalDataValidation = exports.updateDriverPersonalDataValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=profileValidator.js.map