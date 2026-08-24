const { param, query, body } = require('express-validator');
const { SOS_STATUS } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');

const sosListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(SOS_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_ACKNOWLEDGED_RESOLVED_CANCELLED),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

const sosIdParamValidation = [
  param('id')
    .isUUID().withMessage(V.SOS_EVENT_ID_MUST_BE_A_VALID_UUID),
];

const resolveSosValidation = [
  param('id')
    .isUUID().withMessage(V.SOS_EVENT_ID_MUST_BE_A_VALID_UUID),
  body('resolution_note')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage(V.RESOLUTION_NOTE_MUST_BE_AT_MOST_500_CHARACTERS),
];

module.exports = { sosListValidation, sosIdParamValidation, resolveSosValidation };
