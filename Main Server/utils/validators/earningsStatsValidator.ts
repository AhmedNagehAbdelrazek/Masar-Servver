import { query, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

export const earningsQueryValidation: ValidationChain[] = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month']).withMessage(V.PERIOD_MUST_BE_DAY_WEEK_OR_MONTH),
  query('from')
    .optional()
    .isISO8601().withMessage(V.FROM_MUST_BE_A_VALID_ISO_8601_DATE),
  query('to')
    .optional()
    .isISO8601().withMessage(V.TO_MUST_BE_A_VALID_ISO_8601_DATE),
];




const _exported = { earningsQueryValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { earningsQueryValidation };
  // @ts-ignore
  module.exports.earningsQueryValidation = earningsQueryValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
