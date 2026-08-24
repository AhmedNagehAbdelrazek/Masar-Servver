const { body, query } = require('express-validator');
const V = require('../../config/messages/validation-keys');

const ratingValidation = [
  body('booking_id')
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
  body('stars')
    .notEmpty().withMessage(V.STARS_ARE_REQUIRED)
    .isInt({ min: 1, max: 5 }).withMessage(V.STARS_MUST_BE_AN_INTEGER_BETWEEN_1_AND_5),
  body('was_late')
    .optional()
    .isBoolean().withMessage(V.WAS_LATE_MUST_BE_A_BOOLEAN),
  body('late_minutes')
    .optional()
    .isInt({ min: 0 }).withMessage(V.LATE_MINUTES_MUST_BE_A_NON_NEGATIVE_INTEGER),
  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage(V.REVIEW_MUST_BE_AT_MOST_500_CHARACTERS),
  body('tags')
    .optional()
    .isArray().withMessage(V.TAGS_MUST_BE_AN_ARRAY)
    .custom((arr) => {
      if (!arr.every((item) => typeof item === 'string' && item.trim().length > 0)) {
        throw new Error(V.EACH_TAG_MUST_BE_A_NON_EMPTY_STRING);
      }
      return true;
    }),
];

const ratingListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
  query('sort')
    .optional()
    .isIn(['recent', 'highest', 'lowest']).withMessage(V.SORT_MUST_BE_RECENT_HIGHEST_OR_LOWEST),
];

module.exports = {
  ratingValidation,
  ratingListValidation,
};
