import { body, query, param, ValidationChain, Meta } from 'express-validator';
import { COMPLAINT_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

const COMPLAINT_CATEGORIES = [
  'no_show',
  'lateness',
  'misconduct',
  'fraud',
  'safety',
  'overcharging',
  'other',
];

export const complaintValidation: ValidationChain[] = [
  body('accused_id')
    .isUUID().withMessage(V.ACCUSED_USER_ID_MUST_BE_A_VALID_UUID)
    .custom((value: unknown, { req }: Meta) => {
      if ((req as unknown as { user?: { id?: string } }).user && (req as unknown as { user?: { id?: string } }).user!.id === value) {
        throw new Error(V.YOU_CANNOT_FILE_A_COMPLAINT_AGAINST_YOURSELF);
      }
      return true;
    }),
  body('booking_id')
    .optional()
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
  body('category')
    .notEmpty().withMessage(V.CATEGORY_IS_REQUIRED)
    .isIn(COMPLAINT_CATEGORIES).withMessage(V.CATEGORY_MUST_BE_ONE_OF_NO_SHOW_LATENESS_MISCONDUCT_FRAUD_SAFETY_OVERCHARGING),
  body('description')
    .notEmpty().withMessage(V.DESCRIPTION_IS_REQUIRED)
    .isLength({ max: 2000 }).withMessage(V.DESCRIPTION_MUST_BE_AT_MOST_2000_CHARACTERS),
  body('evidence_urls')
    .optional()
    .isArray().withMessage(V.EVIDENCE_URLS_MUST_BE_AN_ARRAY)
    .custom((arr: unknown) => {
      if (!Array.isArray(arr) || !(arr as unknown[]).every((u) => typeof u === 'string' && /^https?:\/\//.test(u))) {
        throw new Error(V.EACH_EVIDENCE_URL_MUST_BE_A_VALID_HTTP_S_URL);
      }
      return true;
    }),
];

export const driverComplaintListValidation: ValidationChain[] = [
  query('direction')
    .optional()
    .isIn(['filed', 'against']).withMessage(V.DIRECTION_MUST_BE_FILED_OR_AGAINST),
  query('status')
    .optional()
    .isIn(Object.values(COMPLAINT_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_OPEN_REVIEWING_RESOLVED_DISMISSED),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const adminComplaintListValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(Object.values(COMPLAINT_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_OPEN_REVIEWING_RESOLVED_DISMISSED),
  query('category')
    .optional()
    .isIn(COMPLAINT_CATEGORIES).withMessage(V.CATEGORY_MUST_BE_ONE_OF_NO_SHOW_LATENESS_MISCONDUCT_FRAUD_SAFETY_OVERCHARGING),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const resolveComplaintValidation: ValidationChain[] = [
  param('complaint_id')
    .isUUID().withMessage(V.COMPLAINT_ID_MUST_BE_A_VALID_UUID),
  body('status')
    .notEmpty().withMessage(V.STATUS_IS_REQUIRED)
    .isIn([COMPLAINT_STATUS.REVIEWING, COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.DISMISSED])
    .withMessage(V.STATUS_MUST_BE_ONE_OF_REVIEWING_RESOLVED_DISMISSED),
  body('resolution')
    .custom((value: unknown, { req }: Meta) => {
      if ((req as unknown as { body: Record<string, unknown> }).body.status === COMPLAINT_STATUS.RESOLVED && !value) {
        throw new Error(V.RESOLUTION_IS_REQUIRED_WHEN_RESOLVING_A_COMPLAINT);
      }
      return true;
    })
    .isLength({ max: 2000 }).withMessage(V.RESOLUTION_MUST_BE_AT_MOST_2000_CHARACTERS),
];




const _exported = { complaintValidation, driverComplaintListValidation, adminComplaintListValidation, resolveComplaintValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { complaintValidation, driverComplaintListValidation, adminComplaintListValidation, resolveComplaintValidation };
  // @ts-ignore
  module.exports.complaintValidation = complaintValidation;
  // @ts-ignore
  module.exports.driverComplaintListValidation = driverComplaintListValidation;
  // @ts-ignore
  module.exports.adminComplaintListValidation = adminComplaintListValidation;
  // @ts-ignore
  module.exports.resolveComplaintValidation = resolveComplaintValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
