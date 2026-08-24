const { body, param } = require('express-validator');
const { PAYMENT_METHOD_TYPE } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');

const methodParamValidation = [
  param('method_id')
    .isUUID().withMessage(V.METHOD_ID_MUST_BE_A_VALID_UUID),
];

const createMethodValidation = [
  body('name')
    .notEmpty().withMessage(V.NAME_IS_REQUIRED)
    .isString().trim().isLength({ max: 100 }).withMessage(V.NAME_MUST_BE_AT_MOST_100_CHARACTERS),
  body('account_number')
    .notEmpty().withMessage(V.ACCOUNT_NUMBER_IS_REQUIRED)
    .isString().trim().isLength({ max: 50 }).withMessage(V.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS),
  body('type')
    .notEmpty().withMessage(V.TYPE_IS_REQUIRED)
    .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(V.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY),
  body('email')
    .optional()
    .isEmail().withMessage(V.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS),
];

const updateMethodValidation = [
  ...methodParamValidation,
  body('name')
    .optional()
    .isString().trim().isLength({ max: 100 }).withMessage(V.NAME_MUST_BE_AT_MOST_100_CHARACTERS),
  body('account_number')
    .optional()
    .isString().trim().isLength({ max: 50 }).withMessage(V.ACCOUNT_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS),
  body('type')
    .optional()
    .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(V.TYPE_MUST_BE_ONE_OF_BANK_ACCOUNT_E_WALLET_MOBILE_MONEY),
  body('email')
    .optional()
    .isEmail().withMessage(V.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS),
];

module.exports = {
  methodParamValidation,
  createMethodValidation,
  updateMethodValidation,
};
