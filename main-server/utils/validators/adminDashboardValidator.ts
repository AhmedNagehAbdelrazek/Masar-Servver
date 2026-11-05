import { body, param, query, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

export const driverIdParamValidation: ValidationChain[] = [
  param('driver_id').isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID),
];

export const documentKeyParamValidation: ValidationChain[] = [
  param('document_key')
    .isString()
    .trim()
    .isLength({ min: 2, max: 40 })
    .withMessage((V as unknown as Record<string, string>)['DOCUMENT_KEY_MUST_BE_VALID'] as string || 'DOCUMENT_KEY_NOT_RECOGNIZED'),
];

export const statusBodyValidation: ValidationChain[] = [
  body('status')
    .isIn(['active', 'suspended', 'pending', 'blocked'])
    .withMessage((V as unknown as Record<string, string>)['STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED'] as string || 'INVALID_DRIVER_STATUS_VALUE'),
];

export const accountActionBodyValidation: ValidationChain[] = [
  body('action')
    .isIn(['suspend', 'reactivate', 'unblock'])
    .withMessage('INVALID_ACCOUNT_ACTION'),
  body('reason')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('REASON_MUST_BE_AT_MOST_2000_CHARACTERS'),
];

export const rejectReasonBodyValidation: ValidationChain[] = [
  body('reason')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage(V.REASON_MUST_BE_AT_MOST_2000_CHARACTERS || 'REASON_MUST_BE_AT_MOST_2000_CHARACTERS'),
];

export const paginationQueryValidation: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const recentTripsQueryValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  query('status')
    .optional()
    .isIn(['published', 'full', 'in_progress', 'ongoing', 'completed', 'cancelled', 'canceled'])
    .withMessage('STATUS_MUST_BE_ONE_OF_PENDING_APPROVED_REJECTED_UNVERIFIED'),
];

export const driversListValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  query('search')
    .optional()
    .isString().trim()
    .isLength({ max: 120 }).withMessage(V.SEARCH_MUST_BE_AT_MOST_100_CHARACTERS),
  query('status')
    .optional()
    .isIn(['active', 'suspended', 'pending', 'blocked'])
    .withMessage('INVALID_DRIVER_STATUS_VALUE'),
  query('registration_from')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('INVALID_MONTH_FILTER'),
  query('registration_to')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('INVALID_MONTH_FILTER'),
  query('sort_by')
    .optional()
    .isIn(['created_at', 'full_name', 'avg_rating']).withMessage('VALIDATION_FAILED'),
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc']).withMessage('VALIDATION_FAILED'),
];

export const driverTripsQueryValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  query('status')
    .optional()
    .isIn(['all', 'pending', 'completed', 'canceled', 'cancelled', 'active'])
    .withMessage('VALIDATION_FAILED'),
  query('month')
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('INVALID_MONTH_FILTER'),
];

export const reservationsQueryValidation: ValidationChain[] = [
  ...paginationQueryValidation,
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'canceled', 'completed', 'no_show'])
    .withMessage('VALIDATION_FAILED'),
];




const _exported = { driverIdParamValidation, documentKeyParamValidation, statusBodyValidation, accountActionBodyValidation, rejectReasonBodyValidation, paginationQueryValidation, recentTripsQueryValidation, driversListValidation, driverTripsQueryValidation, reservationsQueryValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { driverIdParamValidation, documentKeyParamValidation, statusBodyValidation, accountActionBodyValidation, rejectReasonBodyValidation, paginationQueryValidation, recentTripsQueryValidation, driversListValidation, driverTripsQueryValidation, reservationsQueryValidation };
  // @ts-ignore
  module.exports.driverIdParamValidation = driverIdParamValidation;
  // @ts-ignore
  module.exports.documentKeyParamValidation = documentKeyParamValidation;
  // @ts-ignore
  module.exports.statusBodyValidation = statusBodyValidation;
  // @ts-ignore
  module.exports.accountActionBodyValidation = accountActionBodyValidation;
  // @ts-ignore
  module.exports.rejectReasonBodyValidation = rejectReasonBodyValidation;
  // @ts-ignore
  module.exports.paginationQueryValidation = paginationQueryValidation;
  // @ts-ignore
  module.exports.recentTripsQueryValidation = recentTripsQueryValidation;
  // @ts-ignore
  module.exports.driversListValidation = driversListValidation;
  // @ts-ignore
  module.exports.driverTripsQueryValidation = driverTripsQueryValidation;
  // @ts-ignore
  module.exports.reservationsQueryValidation = reservationsQueryValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
