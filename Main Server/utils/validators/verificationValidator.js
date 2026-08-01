const { body, param, query } = require('express-validator');

const verificationQueueValidation = [
  query('type')
    .optional()
    .isIn(['driver', 'vehicle']).withMessage('type must be driver or vehicle'),
  query('status')
    .optional()
    .isIn(['pending']).withMessage('status must be pending'),
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
];

module.exports = {
  verificationQueueValidation,
  driverParamValidation,
  vehicleParamValidation,
  rejectValidation,
};
