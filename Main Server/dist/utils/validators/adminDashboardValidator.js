"use strict";
const { body, param, query } = require('express-validator');
const V = require('../../config/messages/validation-keys');
const driverIdParamValidation = [
    param('driver_id').isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID),
];
const documentKeyParamValidation = [
    param('document_key')
        .isString()
        .trim()
        .isLength({ min: 2, max: 40 })
        .withMessage(V.DOCUMENT_KEY_MUST_BE_VALID || 'DOCUMENT_KEY_NOT_RECOGNIZED'),
];
const statusBodyValidation = [
    body('status')
        .isIn(['active', 'suspended', 'pending', 'blocked'])
        .withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED || 'INVALID_DRIVER_STATUS_VALUE'),
];
const accountActionBodyValidation = [
    body('action')
        .isIn(['suspend', 'reactivate', 'unblock'])
        .withMessage('INVALID_ACCOUNT_ACTION'),
    body('reason')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('REASON_MUST_BE_AT_MOST_2000_CHARACTERS'),
];
const rejectReasonBodyValidation = [
    body('reason')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage(V.REASON_MUST_BE_AT_MOST_2000_CHARACTERS || 'REASON_MUST_BE_AT_MOST_2000_CHARACTERS'),
];
const paginationQueryValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
const recentTripsQueryValidation = [
    ...paginationQueryValidation,
    query('status')
        .optional()
        .isIn(['published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled', 'canceled'])
        .withMessage('STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED'),
];
const driversListValidation = [
    ...paginationQueryValidation,
    query('search')
        .optional()
        .isString().trim()
        .isLength({ max: 120 }).withMessage(V.SEARCH_MUST_BE_AT_MOST_100_CHARACTERS),
    query('status')
        .optional()
        .isIn(['active', 'suspended', 'pending', 'blocked'])
        .withMessage('INVALID_DRIVER_STATUS_VALUE'),
    query('registration_from')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('INVALID_MONTH_FILTER'),
    query('registration_to')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('INVALID_MONTH_FILTER'),
    query('sort_by')
        .optional()
        .isIn(['created_at', 'full_name', 'avg_rating']).withMessage('VALIDATION_FAILED'),
    query('sort_order')
        .optional()
        .isIn(['asc', 'desc']).withMessage('VALIDATION_FAILED'),
];
const driverTripsQueryValidation = [
    ...paginationQueryValidation,
    query('status')
        .optional()
        .isIn(['all', 'pending', 'completed', 'canceled', 'cancelled', 'active'])
        .withMessage('VALIDATION_FAILED'),
    query('month')
        .optional()
        .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('INVALID_MONTH_FILTER'),
];
const reservationsQueryValidation = [
    ...paginationQueryValidation,
    query('status')
        .optional()
        .isIn(['pending', 'confirmed', 'cancelled', 'canceled', 'completed', 'no_show'])
        .withMessage('VALIDATION_FAILED'),
];
module.exports = {
    driverIdParamValidation,
    documentKeyParamValidation,
    statusBodyValidation,
    accountActionBodyValidation,
    rejectReasonBodyValidation,
    paginationQueryValidation,
    recentTripsQueryValidation,
    driversListValidation,
    driverTripsQueryValidation,
    reservationsQueryValidation,
};
//# sourceMappingURL=adminDashboardValidator.js.map