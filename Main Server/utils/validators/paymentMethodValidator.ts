import { body, param, ValidationChain } from 'express-validator';
import { PAYMENT_METHOD_TYPE } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const methodParamValidation: ValidationChain[] = [
  param('method_id')
    .isUUID().withMessage(V.METHOD_ID_MUST_BE_A_VALID_UUID),
];

export const createMethodValidation: ValidationChain[] = [
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

export const updateMethodValidation: ValidationChain[] = [
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




const _exported = { methodParamValidation, createMethodValidation, updateMethodValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { methodParamValidation, createMethodValidation, updateMethodValidation };
  // @ts-ignore
  module.exports.methodParamValidation = methodParamValidation;
  // @ts-ignore
  module.exports.createMethodValidation = createMethodValidation;
  // @ts-ignore
  module.exports.updateMethodValidation = updateMethodValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
