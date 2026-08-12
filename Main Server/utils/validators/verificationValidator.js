const { body, param, query } = require('express-validator');
const { VERIFICATION_FIELD_KEYS } = require('../../config/constants');

const verificationQueueValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'unverified']).withMessage('status must be one of pending, approved, rejected, unverified'),
  query('search')
    .optional()
    .isString().withMessage('search must be a string')
    .trim()
    .isLength({ max: 100 }).withMessage('search must be at most 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const driverParamValidation = [
  param('driver_id')
    .isUUID().withMessage('Driver ID must be a valid UUID'),
];

const vehicleParamValidation = [
  param('vehicle_id')
    .isUUID().withMessage('Vehicle ID must be a valid UUID'),
];

const rejectValidation = [
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isLength({ max: 2000 }).withMessage('Reason must be at most 2000 characters'),
  body('fields_to_fix')
    .isArray({ min: 1 }).withMessage('fields_to_fix must be a non-empty array')
    .custom((value) => value.every((field) => VERIFICATION_FIELD_KEYS.includes(field)))
    .withMessage(`fields_to_fix must only contain allowed keys: ${VERIFICATION_FIELD_KEYS.join(', ')}`),
];

module.exports = {
  verificationQueueValidation,
  driverParamValidation,
  vehicleParamValidation,
  rejectValidation,
};
