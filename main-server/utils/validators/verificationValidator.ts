import { body, param, query, ValidationChain } from 'express-validator';
import { VERIFICATION_FIELD_KEYS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const verificationQueueValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'unverified']).withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED),
  query('search')
    .optional()
    .isString().withMessage(V.SEARCH_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 100 }).withMessage(V.SEARCH_MUST_BE_AT_MOST_100_CHARACTERS),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const driverParamValidation: ValidationChain[] = [
  param('driver_id')
    .isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID),
];

export const vehicleParamValidation: ValidationChain[] = [
  param('vehicle_id')
    .isUUID().withMessage(V.VEHICLE_ID_MUST_BE_A_VALID_UUID),
];

export const rejectValidation: ValidationChain[] = [
  body('reason')
    .notEmpty().withMessage(V.REASON_IS_REQUIRED)
    .isLength({ max: 2000 }).withMessage(V.REASON_MUST_BE_AT_MOST_2000_CHARACTERS),
  body('fields_to_fix')
    .isArray({ min: 1 }).withMessage(V.FIELDS_TO_FIX_MUST_BE_A_NON_EMPTY_ARRAY)
    .custom((value: unknown) => Array.isArray(value) && (value as unknown[]).every((field: unknown) => (VERIFICATION_FIELD_KEYS as readonly string[]).includes(field as string)))
    .withMessage(V.FIELDS_TO_FIX_MUST_ONLY_CONTAIN_ALLOWED_KEYS_NATIONAL_ID_LICENSE_PERSONAL),
];




const _exported = { verificationQueueValidation, driverParamValidation, vehicleParamValidation, rejectValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { verificationQueueValidation, driverParamValidation, vehicleParamValidation, rejectValidation };
  // @ts-ignore
  module.exports.verificationQueueValidation = verificationQueueValidation;
  // @ts-ignore
  module.exports.driverParamValidation = driverParamValidation;
  // @ts-ignore
  module.exports.vehicleParamValidation = vehicleParamValidation;
  // @ts-ignore
  module.exports.rejectValidation = rejectValidation;
  // @ts-ignore
  module.exports.default = _exported;
}

