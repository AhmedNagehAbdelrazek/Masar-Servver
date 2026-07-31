const { body, param, query } = require('express-validator');
const { TRIP_STATUS, GENDER_PREFERENCE } = require('../../config/constants');

const createTripValidation = [
  body('origin_city')
    .trim()
    .notEmpty().withMessage('Origin city is required')
    .isLength({ max: 100 }).withMessage('Origin city must be at most 100 characters'),

  body('origin_area')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Origin area must be at most 120 characters'),

  body('origin_lat')
    .optional()
    .isDecimal().withMessage('Origin latitude must be a decimal')
    .custom((value) => {
      const lat = parseFloat(value);
      if (lat < -90 || lat > 90) throw new Error('Origin latitude must be between -90 and 90');
      return true;
    }),

  body('origin_lng')
    .optional()
    .isDecimal().withMessage('Origin longitude must be a decimal')
    .custom((value) => {
      const lng = parseFloat(value);
      if (lng < -180 || lng > 180) throw new Error('Origin longitude must be between -180 and 180');
      return true;
    }),

  body('destination_city')
    .trim()
    .notEmpty().withMessage('Destination city is required')
    .isLength({ max: 100 }).withMessage('Destination city must be at most 100 characters'),

  body('destination_area')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Destination area must be at most 120 characters'),

  body('destination_lat')
    .optional()
    .isDecimal().withMessage('Destination latitude must be a decimal')
    .custom((value) => {
      const lat = parseFloat(value);
      if (lat < -90 || lat > 90) throw new Error('Destination latitude must be between -90 and 90');
      return true;
    }),

  body('destination_lng')
    .optional()
    .isDecimal().withMessage('Destination longitude must be a decimal')
    .custom((value) => {
      const lng = parseFloat(value);
      if (lng < -180 || lng > 180) throw new Error('Destination longitude must be between -180 and 180');
      return true;
    }),

  body('waypoints')
    .optional()
    .isArray().withMessage('Waypoints must be an array'),
  body('waypoints.*.stop_name')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage('Stop name must be at most 120 characters'),
  body('waypoints.*.stop_lat')
    .optional()
    .isDecimal().withMessage('Stop latitude must be a decimal'),
  body('waypoints.*.stop_lng')
    .optional()
    .isDecimal().withMessage('Stop longitude must be a decimal'),

  body('departure_date')
    .notEmpty().withMessage('Departure date is required')
    .isDate().withMessage('Departure date must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error('Departure date must be today or in the future');
      return true;
    }),

  body('departure_time')
    .notEmpty().withMessage('Departure time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Departure time must be in HH:MM format'),

  body('type_of_trip')
    .notEmpty().withMessage('Trip type is required')
    .isIn(['once', 'repeated']).withMessage('Trip type must be once or repeated'),

  body('repeated_days')
    .if(body('type_of_trip').equals('repeated'))
    .notEmpty().withMessage('Repeated days are required for recurring trips')
    .isArray({ min: 1 }).withMessage('At least one day must be selected')
    .custom((days) => {
      if (!days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
        throw new Error('Repeated days must be integers between 0 (Sunday) and 6 (Saturday)');
      }
      return true;
    }),

  body('repeated_end_date')
    .if(body('type_of_trip').equals('repeated'))
    .notEmpty().withMessage('End date is required for recurring trips')
    .isDate().withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.departure_date);
      if (endDate <= startDate) throw new Error('End date must be after departure date');
      return true;
    }),

  body('allowed_type')
    .optional()
    .isIn(Object.values(GENDER_PREFERENCE)).withMessage(`Allowed type must be one of: ${Object.values(GENDER_PREFERENCE).join(', ')}`),

  body('fare_per_seat')
    .notEmpty().withMessage('Fare per seat is required')
    .isDecimal({ decimal_digits: '1,2' }).withMessage('Fare must be a decimal with up to 2 decimal places')
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error('Fare cannot be negative');
      return true;
    }),

  body('seats')
    .notEmpty().withMessage('Seats configuration is required')
    .isArray({ min: 1 }).withMessage('At least one seat must be configured'),
  body('seats.*.seat_number')
    .isInt({ min: 1 }).withMessage('Seat number must be a positive integer'),
  body('seats.*.type')
    .isIn(['driver', 'available', 'unavailable']).withMessage('Seat type must be driver, available, or unavailable'),

  body('instructions')
    .optional()
    .isArray({ min: 1 }).withMessage('Instructions must be a non-empty array')
    .custom((arr) => {
      if (!arr.every((item) => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= 1000)) {
        throw new Error('Each instruction must be a non-empty string of at most 1000 characters');
      }
      return true;
    })
    .customSanitizer((arr) => arr.map((s) => s.trim())),

  body('additional_instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Additional instructions must be at most 1000 characters'),
];

const lockSeatValidation = [
  param('trip_id')
    .isUUID().withMessage('Trip ID must be a valid UUID'),
  body('seat_number')
    .notEmpty().withMessage('Seat number is required')
    .isInt({ min: 1 }).withMessage('Seat number must be a positive integer'),
];

const releaseSeatLockValidation = [
  param('trip_id')
    .isUUID().withMessage('Trip ID must be a valid UUID'),
  param('seat_number')
    .isInt({ min: 1 }).withMessage('Seat number must be a positive integer'),
];

module.exports = {
  createTripValidation,
  lockSeatValidation,
  releaseSeatLockValidation,
};
