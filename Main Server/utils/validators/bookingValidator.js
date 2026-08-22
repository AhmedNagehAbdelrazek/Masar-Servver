const { body, query, param } = require('express-validator');
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

const createBookingValidation = [
  body('trip_id')
    .isUUID().withMessage('Trip ID must be a valid UUID'),
  body('seat_number')
    .isInt({ min: 1 }).withMessage('Seat number must be a positive integer'),
  body('seats')
    .optional()
    .isInt({ min: 1, max: 1 }).withMessage('Seats must be 1'),
  body('agreed_fare')
    .notEmpty().withMessage('agreed_fare is required')
    .isFloat({ min: 0 }).withMessage('agreed_fare must be a non-negative number'),
  body('dropoff_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage('dropoff_place must be at most 255 characters'),
  body('dropoff_deadline')
    .optional()
    .isISO8601().withMessage('dropoff_deadline must be a valid ISO-8601 datetime'),
];

const passengerBookingListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(BOOKING_STATUS)).withMessage(`Status must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`),
  query('trip_id')
    .optional()
    .isUUID().withMessage('trip_id must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const cancelBookingValidation = [
  param('booking_id')
    .isUUID().withMessage('Booking ID must be a valid UUID'),
];

const delayParamValidation = [
  param('booking_id')
    .isUUID().withMessage('Booking ID must be a valid UUID'),
];

const reportDelayValidation = [
  ...delayParamValidation,
  body('party')
    .notEmpty().withMessage('party is required')
    .isIn(['driver', 'passenger']).withMessage('party must be "driver" or "passenger"'),
  body('delay_minutes')
    .notEmpty().withMessage('delay_minutes is required')
    .isInt({ min: 1, max: 720 }).withMessage('delay_minutes must be an integer between 1 and 720'),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 1000 }).withMessage('reason must be at most 1000 characters'),
];

const delayListValidation = [
  ...delayParamValidation,
  query('party')
    .optional()
    .isIn(['driver', 'passenger']).withMessage('party must be "driver" or "passenger"'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

module.exports = {
  bookingListValidation,
  bookingParamValidation,
  createBookingValidation,
  passengerBookingListValidation,
  cancelBookingValidation,
  delayParamValidation,
  reportDelayValidation,
  delayListValidation,
};
