"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectValidation = exports.vehicleParamValidation = exports.driverParamValidation = exports.verificationQueueValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
exports.verificationQueueValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected', 'unverified']).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED),
    (0, express_validator_1.query)('search')
        .optional()
        .isString().withMessage(validation_keys_1.VALIDATION_KEYS.SEARCH_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEARCH_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.driverParamValidation = [
    (0, express_validator_1.param)('driver_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.DRIVER_ID_MUST_BE_A_VALID_UUID),
];
exports.vehicleParamValidation = [
    (0, express_validator_1.param)('vehicle_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_ID_MUST_BE_A_VALID_UUID),
];
exports.rejectValidation = [
    (0, express_validator_1.body)('reason')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.REASON_IS_REQUIRED)
        .isLength({ max: 2000 }).withMessage(validation_keys_1.VALIDATION_KEYS.REASON_MUST_BE_AT_MOST_2000_CHARACTERS),
    (0, express_validator_1.body)('fields_to_fix')
        .isArray({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.FIELDS_TO_FIX_MUST_BE_A_NON_EMPTY_ARRAY)
        .custom((value) => Array.isArray(value) && value.every((field) => constants_1.VERIFICATION_FIELD_KEYS.includes(field)))
        .withMessage(validation_keys_1.VALIDATION_KEYS.FIELDS_TO_FIX_MUST_ONLY_CONTAIN_ALLOWED_KEYS_NATIONAL_ID_LICENSE_PERSONAL),
];
const _exported = { verificationQueueValidation: exports.verificationQueueValidation, driverParamValidation: exports.driverParamValidation, vehicleParamValidation: exports.vehicleParamValidation, rejectValidation: exports.rejectValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { verificationQueueValidation: exports.verificationQueueValidation, driverParamValidation: exports.driverParamValidation, vehicleParamValidation: exports.vehicleParamValidation, rejectValidation: exports.rejectValidation };
    // @ts-ignore
    module.exports.verificationQueueValidation = exports.verificationQueueValidation;
    // @ts-ignore
    module.exports.driverParamValidation = exports.driverParamValidation;
    // @ts-ignore
    module.exports.vehicleParamValidation = exports.vehicleParamValidation;
    // @ts-ignore
    module.exports.rejectValidation = exports.rejectValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=verificationValidator.js.map