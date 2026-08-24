const { body, query } = require('express-validator');
const { PENALTY_TYPES } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');

const penaltyListValidation = [
  query('active')
    .optional()
    .isIn(['true', 'false']).withMessage(V.ACTIVE_MUST_BE_TRUE_OR_FALSE),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

const penaltyValidation = [
  body('user_id')
    .isUUID().withMessage(V.USER_ID_MUST_BE_A_VALID_UUID),
  body('type')
    .notEmpty().withMessage(V.PENALTY_TYPE_IS_REQUIRED)
    .isIn(Object.values(PENALTY_TYPES)).withMessage(V.TYPE_MUST_BE_ONE_OF_WARNING_SUSPENSION_BAN),
  body('reason')
    .notEmpty().withMessage(V.REASON_IS_REQUIRED)
    .isLength({ max: 2000 }).withMessage(V.REASON_MUST_BE_AT_MOST_2000_CHARACTERS),
  body('complaint_id')
    .optional()
    .isUUID().withMessage(V.COMPLAINT_ID_MUST_BE_A_VALID_UUID),
  body('details')
    .optional()
    .isString().trim().isLength({ max: 4000 }).withMessage(V.DETAILS_MUST_BE_AT_MOST_4000_CHARACTERS),
  body('ends_at')
    .optional()
    .isISO8601().withMessage(V.ENDS_AT_MUST_BE_A_VALID_ISO_8601_DATETIME)
    .custom((value, { req }) => {
      const type = req.body.type;
      if (type === PENALTY_TYPES.SUSPENSION && !value) {
        throw new Error(V.ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION);
      }
      if (type === PENALTY_TYPES.BAN && value) {
        throw new Error(V.ENDS_AT_IS_FORBIDDEN_FOR_A_BAN_PERMANENT);
      }
      if (value && new Date(value) <= new Date()) {
        throw new Error(V.ENDS_AT_MUST_BE_IN_THE_FUTURE);
      }
      return true;
    }),
];

module.exports = {
  penaltyListValidation,
  penaltyValidation,
};
