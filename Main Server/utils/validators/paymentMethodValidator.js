const { body, param } = require('express-validator');
const { PAYMENT_METHOD_TYPE } = require('../../config/constants');

const methodParamValidation = [
  param('method_id')
    .isUUID().withMessage('Method ID must be a valid UUID'),
];

const createMethodValidation = [
  body('name')
    .notEmpty().withMessage('name is required')
    .isString().trim().isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
  body('account_number')
    .notEmpty().withMessage('account_number is required')
    .isString().trim().isLength({ max: 50 }).withMessage('account_number must be at most 50 characters'),
  body('type')
    .notEmpty().withMessage('type is required')
    .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(`type must be one of: ${Object.values(PAYMENT_METHOD_TYPE).join(', ')}`),
  body('email')
    .optional()
    .isEmail().withMessage('email must be a valid email address'),
];

const updateMethodValidation = [
  ...methodParamValidation,
  body('name')
    .optional()
    .isString().trim().isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
  body('account_number')
    .optional()
    .isString().trim().isLength({ max: 50 }).withMessage('account_number must be at most 50 characters'),
  body('type')
    .optional()
    .isIn(Object.values(PAYMENT_METHOD_TYPE)).withMessage(`type must be one of: ${Object.values(PAYMENT_METHOD_TYPE).join(', ')}`),
  body('email')
    .optional()
    .isEmail().withMessage('email must be a valid email address'),
];

module.exports = {
  methodParamValidation,
  createMethodValidation,
  updateMethodValidation,
};
