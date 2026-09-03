"use strict";
const { body, param, query } = require('express-validator');
const { VERIFICATION_FIELD_KEYS } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');
const verificationQueueValidation = [
    query('status')
        .optional()
        .isIn(['pending', 'approved', 'rejected', 'unverified']).withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED),
    query('search')
        .optional()
        .isString().withMessage(V.SEARCH_MUST_BE_A_STRING)
        .trim()
        .isLength({ max: 100 }).withMessage(V.SEARCH_MUST_BE_AT_MOST_100_CHARACTERS),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
const driverParamValidation = [
    param('driver_id')
        .isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID),
];
const vehicleParamValidation = [
    param('vehicle_id')
        .isUUID().withMessage(V.VEHICLE_ID_MUST_BE_A_VALID_UUID),
];
const rejectValidation = [
    body('reason')
        .notEmpty().withMessage(V.REASON_IS_REQUIRED)
        .isLength({ max: 2000 }).withMessage(V.REASON_MUST_BE_AT_MOST_2000_CHARACTERS),
    body('fields_to_fix')
        .isArray({ min: 1 }).withMessage(V.FIELDS_TO_FIX_MUST_BE_A_NON_EMPTY_ARRAY)
        .custom((value) => value.every((field) => VERIFICATION_FIELD_KEYS.includes(field)))
        .withMessage(V.FIELDS_TO_FIX_MUST_ONLY_CONTAIN_ALLOWED_KEYS_NATIONAL_ID_LICENSE_PERSONAL),
];
module.exports = {
    verificationQueueValidation,
    driverParamValidation,
    vehicleParamValidation,
    rejectValidation,
};
//# sourceMappingURL=verificationValidator.js.map