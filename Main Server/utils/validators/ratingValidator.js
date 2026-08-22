const { body, query } = require('express-validator');

const ratingValidation = [
  body('booking_id')
    .isUUID().withMessage('Booking ID must be a valid UUID'),
  body('stars')
    .notEmpty().withMessage('Stars are required')
    .isInt({ min: 1, max: 5 }).withMessage('Stars must be an integer between 1 and 5'),
  body('was_late')
    .optional()
    .isBoolean().withMessage('was_late must be a boolean'),
  body('late_minutes')
    .optional()
    .isInt({ min: 0 }).withMessage('late_minutes must be a non-negative integer'),
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Review must be at most 500 characters'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((arr) => {
      if (!arr.every((item) => typeof item === 'string' && item.trim().length > 0)) {
        throw new Error('Each tag must be a non-empty string');
      }
      return true;
    }),
];

const ratingListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['recent', 'highest', 'lowest']).withMessage('Sort must be recent, highest or lowest'),
];

module.exports = {
  ratingValidation,
  ratingListValidation,
};
