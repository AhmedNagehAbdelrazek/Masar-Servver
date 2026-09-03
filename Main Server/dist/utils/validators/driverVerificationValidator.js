"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverVerificationValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
const documentId = (field, label) => (0, express_validator_1.body)(field)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${label} must be a valid uploaded image id (positive integer)`);
exports.driverVerificationValidation = [
    (0, express_validator_1.body)('full_name')
        .optional()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS_2),
    (0, express_validator_1.body)('national_id')
        .optional()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.NATIONAL_ID_MUST_BE_AT_MOST_30_CHARACTERS),
    (0, express_validator_1.body)('license_number')
        .optional()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.LICENSE_NUMBER_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.LICENSE_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS),
    (0, express_validator_1.body)('license_expiry')
        .optional()
        .isDate().withMessage(validation_keys_1.VALIDATION_KEYS.LICENSE_EXPIRY_MUST_BE_A_VALID_DATE),
    (0, express_validator_1.body)('phone')
        .not().exists().withMessage(validation_keys_1.VALIDATION_KEYS.PHONE_CANNOT_BE_CHANGED_DURING_VERIFICATION),
    documentId('user_identification_front', 'user_identification_front'),
    documentId('user_identification_back', 'user_identification_back'),
    documentId('lincese_front', 'lincese_front'),
    documentId('lincese_back', 'lincese_back'),
    documentId('personal_image_with_id', 'personal_image_with_id'),
    (0, express_validator_1.body)('vehicle')
        .exists().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_IS_REQUIRED)
        .isObject().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MUST_BE_AN_OBJECT),
    (0, express_validator_1.body)('vehicle.manufacturer')
        .exists().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MANUFACTURER_IS_REQUIRED)
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MANUFACTURER_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 80 }).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MANUFACTURER_MUST_BE_AT_MOST_80_CHARACTERS),
    (0, express_validator_1.body)('vehicle.model')
        .exists().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MODEL_IS_REQUIRED)
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MODEL_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 80 }).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MODEL_MUST_BE_AT_MOST_80_CHARACTERS),
    (0, express_validator_1.body)('vehicle.vehicle_type')
        .exists().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_VEHICLE_TYPE_IS_REQUIRED)
        .isIn(Object.values(constants_1.VEHICLE_TYPES)).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_VEHICLE_TYPE_MUST_BE_ONE_OF_SEDAN_SUV_VAN_BUS_HATCHBACK),
    (0, express_validator_1.body)('vehicle.model_year')
        .optional()
        .isInt().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_MODEL_YEAR_MUST_BE_A_VALID_YEAR)
        .custom((value) => {
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 10;
        if (Number(value) < minYear || Number(value) > currentYear) {
            throw new Error(`vehicle.model_year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
        }
        return true;
    }),
    (0, express_validator_1.body)('vehicle.plate_number')
        .exists().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_PLATE_NUMBER_IS_REQUIRED)
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_PLATE_NUMBER_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 20 }).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_PLATE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
    (0, express_validator_1.body)('vehicle.code_number')
        .optional()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_CODE_NUMBER_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 20 }).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_CODE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
    (0, express_validator_1.body)('vehicle.color')
        .optional()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_COLOR_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 30 }).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_COLOR_MUST_BE_AT_MOST_30_CHARACTERS),
    (0, express_validator_1.body)('vehicle.seats')
        .exists().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_SEATS_IS_REQUIRED)
        .isInt({ min: 1, max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_SEATS_MUST_BE_AN_INTEGER_BETWEEN_1_AND_50),
    documentId('vehicle.registration_doc_front', 'vehicle.registration_doc_front'),
    documentId('vehicle.registration_doc_back', 'vehicle.registration_doc_back'),
    documentId('vehicle.vehicle_photo_front', 'vehicle.vehicle_photo_front'),
    documentId('vehicle.vehicle_photo_back', 'vehicle.vehicle_photo_back'),
];
const _exported = { driverVerificationValidation: exports.driverVerificationValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { driverVerificationValidation: exports.driverVerificationValidation };
    // @ts-ignore
    module.exports.driverVerificationValidation = exports.driverVerificationValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=driverVerificationValidator.js.map