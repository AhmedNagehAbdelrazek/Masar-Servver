import { body, query, param, ValidationChain } from 'express-validator';
import { ROLES, USER_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const adminUserListValidation: ValidationChain[] = [
  query('role')
    .optional()
    .isIn(Object.values(ROLES)).withMessage(V.ROLE_MUST_BE_ONE_OF_PASSENGER_DRIVER_ADMIN_SUPPORT_MODERATOR),
  query('status')
    .optional()
    .isIn(Object.values(USER_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_ACTIVE_WARNED_SUSPENDED_BANNED),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const updateUserStatusValidation: ValidationChain[] = [
  param('user_id').isUUID().withMessage(V.USER_ID_MUST_BE_A_VALID_UUID),
  body('status')
    .notEmpty().withMessage(V.STATUS_IS_REQUIRED)
    .isIn(Object.values(USER_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_ACTIVE_WARNED_SUSPENDED_BANNED),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 500 }).withMessage(V.REASON_MUST_BE_A_STRING_500_CHARACTERS),
];

export const moderateTripValidation: ValidationChain[] = [
  param('trip_id').isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
  body('action')
    .notEmpty().withMessage(V.ACTION_IS_REQUIRED)
    .isIn(['unpublish', 'block', 'restore']).withMessage(V.ACTION_MUST_BE_ONE_OF_UNPUBLISH_BLOCK_RESTORE),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 500 }).withMessage(V.REASON_MUST_BE_A_STRING_500_CHARACTERS),
];




const _exported = { adminUserListValidation, updateUserStatusValidation, moderateTripValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { adminUserListValidation, updateUserStatusValidation, moderateTripValidation };
  // @ts-ignore
  module.exports.adminUserListValidation = adminUserListValidation;
  // @ts-ignore
  module.exports.updateUserStatusValidation = updateUserStatusValidation;
  // @ts-ignore
  module.exports.moderateTripValidation = moderateTripValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
