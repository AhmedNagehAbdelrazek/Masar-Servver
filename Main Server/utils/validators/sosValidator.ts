import { param, query, body, ValidationChain } from 'express-validator';
import { SOS_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const sosListValidation: ValidationChain[] = [
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

export const sosIdParamValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage(V.SOS_EVENT_ID_MUST_BE_A_VALID_UUID),
];

export const resolveSosValidation: ValidationChain[] = [
  param('id')
    .isUUID().withMessage(V.SOS_EVENT_ID_MUST_BE_A_VALID_UUID),
  body('resolution_note')
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage(V.RESOLUTION_NOTE_MUST_BE_AT_MOST_500_CHARACTERS),
];




const _exported = { sosListValidation, sosIdParamValidation, resolveSosValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { sosListValidation, sosIdParamValidation, resolveSosValidation };
  // @ts-ignore
  module.exports.sosListValidation = sosListValidation;
  // @ts-ignore
  module.exports.sosIdParamValidation = sosIdParamValidation;
  // @ts-ignore
  module.exports.resolveSosValidation = resolveSosValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
