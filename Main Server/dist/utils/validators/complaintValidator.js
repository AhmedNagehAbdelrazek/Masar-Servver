"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveComplaintValidation = exports.adminComplaintListValidation = exports.driverComplaintListValidation = exports.complaintValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
const COMPLAINT_CATEGORIES = [
    'no_show',
    'lateness',
    'misconduct',
    'fraud',
    'safety',
    'overcharging',
    'other',
];
exports.complaintValidation = [
    (0, express_validator_1.body)('accused_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.ACCUSED_USER_ID_MUST_BE_A_VALID_UUID)
        .custom((value, { req }) => {
        if (req.user && req.user.id === value) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.YOU_CANNOT_FILE_A_COMPLAINT_AGAINST_YOURSELF);
        }
        return true;
    }),
    (0, express_validator_1.body)('booking_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.BOOKING_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('category')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.CATEGORY_IS_REQUIRED)
        .isIn(COMPLAINT_CATEGORIES).withMessage(validation_keys_1.VALIDATION_KEYS.CATEGORY_MUST_BE_ONE_OF_NO_SHOW_LATENESS_MISCONDUCT_FRAUD_SAFETY_OVERCHARGING),
    (0, express_validator_1.body)('description')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.DESCRIPTION_IS_REQUIRED)
        .isLength({ max: 2000 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESCRIPTION_MUST_BE_AT_MOST_2000_CHARACTERS),
    (0, express_validator_1.body)('evidence_urls')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.EVIDENCE_URLS_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!Array.isArray(arr) || !arr.every((u) => typeof u === 'string' && /^https?:\/\//.test(u))) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.EACH_EVIDENCE_URL_MUST_BE_A_VALID_HTTP_S_URL);
        }
        return true;
    }),
];
exports.driverComplaintListValidation = [
    (0, express_validator_1.query)('direction')
        .optional()
        .isIn(['filed', 'against']).withMessage(validation_keys_1.VALIDATION_KEYS.DIRECTION_MUST_BE_FILED_OR_AGAINST),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.COMPLAINT_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_OPEN_REVIEWING_RESOLVED_DISMISSED),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.adminComplaintListValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.COMPLAINT_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_OPEN_REVIEWING_RESOLVED_DISMISSED),
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(COMPLAINT_CATEGORIES).withMessage(validation_keys_1.VALIDATION_KEYS.CATEGORY_MUST_BE_ONE_OF_NO_SHOW_LATENESS_MISCONDUCT_FRAUD_SAFETY_OVERCHARGING),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.resolveComplaintValidation = [
    (0, express_validator_1.param)('complaint_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.COMPLAINT_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('status')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_IS_REQUIRED)
        .isIn([constants_1.COMPLAINT_STATUS.REVIEWING, constants_1.COMPLAINT_STATUS.RESOLVED, constants_1.COMPLAINT_STATUS.DISMISSED])
        .withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_REVIEWING_RESOLVED_DISMISSED),
    (0, express_validator_1.body)('resolution')
        .custom((value, { req }) => {
        if (req.body.status === constants_1.COMPLAINT_STATUS.RESOLVED && !value) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.RESOLUTION_IS_REQUIRED_WHEN_RESOLVING_A_COMPLAINT);
        }
        return true;
    })
        .isLength({ max: 2000 }).withMessage(validation_keys_1.VALIDATION_KEYS.RESOLUTION_MUST_BE_AT_MOST_2000_CHARACTERS),
];
const _exported = { complaintValidation: exports.complaintValidation, driverComplaintListValidation: exports.driverComplaintListValidation, adminComplaintListValidation: exports.adminComplaintListValidation, resolveComplaintValidation: exports.resolveComplaintValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { complaintValidation: exports.complaintValidation, driverComplaintListValidation: exports.driverComplaintListValidation, adminComplaintListValidation: exports.adminComplaintListValidation, resolveComplaintValidation: exports.resolveComplaintValidation };
    // @ts-ignore
    module.exports.complaintValidation = exports.complaintValidation;
    // @ts-ignore
    module.exports.driverComplaintListValidation = exports.driverComplaintListValidation;
    // @ts-ignore
    module.exports.adminComplaintListValidation = exports.adminComplaintListValidation;
    // @ts-ignore
    module.exports.resolveComplaintValidation = exports.resolveComplaintValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=complaintValidator.js.map