"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationsQueryValidation = exports.driverTripsQueryValidation = exports.driversListValidation = exports.recentTripsQueryValidation = exports.paginationQueryValidation = exports.rejectReasonBodyValidation = exports.accountActionBodyValidation = exports.statusBodyValidation = exports.documentKeyParamValidation = exports.driverIdParamValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = require("../../config/messages/validation-keys");
exports.driverIdParamValidation = [
    (0, express_validator_1.param)('driver_id').isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.DRIVER_ID_MUST_BE_A_VALID_UUID),
];
exports.documentKeyParamValidation = [
    (0, express_validator_1.param)('document_key')
        .isString()
        .trim()
        .isLength({ min: 2, max: 40 })
        .withMessage(validation_keys_1.VALIDATION_KEYS['DOCUMENT_KEY_MUST_BE_VALID'] || 'DOCUMENT_KEY_NOT_RECOGNIZED'),
];
exports.statusBodyValidation = [
    (0, express_validator_1.body)('status')
        .isIn(['active', 'suspended', 'pending', 'blocked'])
        .withMessage(validation_keys_1.VALIDATION_KEYS['STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED'] || 'INVALID_DRIVER_STATUS_VALUE'),
];
exports.accountActionBodyValidation = [
    (0, express_validator_1.body)('action')
        .isIn(['suspend', 'reactivate', 'unblock'])
        .withMessage('INVALID_ACCOUNT_ACTION'),
    (0, express_validator_1.body)('reason')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('REASON_MUST_BE_AT_MOST_2000_CHARACTERS'),
];
exports.rejectReasonBodyValidation = [
    (0, express_validator_1.body)('reason')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage(validation_keys_1.VALIDATION_KEYS.REASON_MUST_BE_AT_MOST_2000_CHARACTERS || 'REASON_MUST_BE_AT_MOST_2000_CHARACTERS'),
];
exports.paginationQueryValidation = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.recentTripsQueryValidation = [
    ...exports.paginationQueryValidation,
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled', 'canceled'])
        .withMessage('STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED'),
];
exports.driversListValidation = [
    ...exports.paginationQueryValidation,
    (0, express_validator_1.query)('search')
        .optional()
        .isString().trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEARCH_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'suspended', 'pending', 'blocked'])
        .withMessage('INVALID_DRIVER_STATUS_VALUE'),
    (0, express_validator_1.query)('registration_from')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('INVALID_MONTH_FILTER'),
    (0, express_validator_1.query)('registration_to')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('INVALID_MONTH_FILTER'),
    (0, express_validator_1.query)('sort_by')
        .optional()
        .isIn(['created_at', 'full_name', 'avg_rating']).withMessage('VALIDATION_FAILED'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc']).withMessage('VALIDATION_FAILED'),
];
exports.driverTripsQueryValidation = [
    ...exports.paginationQueryValidation,
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['all', 'pending', 'completed', 'canceled', 'cancelled', 'active'])
        .withMessage('VALIDATION_FAILED'),
    (0, express_validator_1.query)('month')
        .optional()
        .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('INVALID_MONTH_FILTER'),
];
exports.reservationsQueryValidation = [
    ...exports.paginationQueryValidation,
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['pending', 'confirmed', 'cancelled', 'canceled', 'completed', 'no_show'])
        .withMessage('VALIDATION_FAILED'),
];
const _exported = { driverIdParamValidation: exports.driverIdParamValidation, documentKeyParamValidation: exports.documentKeyParamValidation, statusBodyValidation: exports.statusBodyValidation, accountActionBodyValidation: exports.accountActionBodyValidation, rejectReasonBodyValidation: exports.rejectReasonBodyValidation, paginationQueryValidation: exports.paginationQueryValidation, recentTripsQueryValidation: exports.recentTripsQueryValidation, driversListValidation: exports.driversListValidation, driverTripsQueryValidation: exports.driverTripsQueryValidation, reservationsQueryValidation: exports.reservationsQueryValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { driverIdParamValidation: exports.driverIdParamValidation, documentKeyParamValidation: exports.documentKeyParamValidation, statusBodyValidation: exports.statusBodyValidation, accountActionBodyValidation: exports.accountActionBodyValidation, rejectReasonBodyValidation: exports.rejectReasonBodyValidation, paginationQueryValidation: exports.paginationQueryValidation, recentTripsQueryValidation: exports.recentTripsQueryValidation, driversListValidation: exports.driversListValidation, driverTripsQueryValidation: exports.driverTripsQueryValidation, reservationsQueryValidation: exports.reservationsQueryValidation };
    // @ts-ignore
    module.exports.driverIdParamValidation = exports.driverIdParamValidation;
    // @ts-ignore
    module.exports.documentKeyParamValidation = exports.documentKeyParamValidation;
    // @ts-ignore
    module.exports.statusBodyValidation = exports.statusBodyValidation;
    // @ts-ignore
    module.exports.accountActionBodyValidation = exports.accountActionBodyValidation;
    // @ts-ignore
    module.exports.rejectReasonBodyValidation = exports.rejectReasonBodyValidation;
    // @ts-ignore
    module.exports.paginationQueryValidation = exports.paginationQueryValidation;
    // @ts-ignore
    module.exports.recentTripsQueryValidation = exports.recentTripsQueryValidation;
    // @ts-ignore
    module.exports.driversListValidation = exports.driversListValidation;
    // @ts-ignore
    module.exports.driverTripsQueryValidation = exports.driverTripsQueryValidation;
    // @ts-ignore
    module.exports.reservationsQueryValidation = exports.reservationsQueryValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=adminDashboardValidator.js.map