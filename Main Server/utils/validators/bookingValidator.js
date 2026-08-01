const { query, param } = require('express-validator');
const { BOOKING_STATUS } = require('../../config/constants');

const bookingListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(BOOKING_STATUS)).withMessage(`Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`),
  query('date_from')
    .optional()
    .isISO8601().withMessage('date_from must be a valid ISO-8601 date'),
  query('date_to')
    .optional()
    .isISO8601().withMessage('date_to must be a valid ISO-8601 date'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const bookingParamValidation = [
  param('booking_id')
    .isUUID().withMessage('Booking ID must be a valid UUID'),
];

module.exports = {
  bookingListValidation,
  bookingParamValidation,
};
