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

export const deleteUserValidation: ValidationChain[] = [
  param('user_id').isUUID().withMessage(V.USER_ID_MUST_BE_A_VALID_UUID),
];

export const adminUserIdValidation: ValidationChain[] = [
  param('user_id').isUUID().withMessage(V.USER_ID_MUST_BE_A_VALID_UUID),
];

export const updateAdminUserValidation: ValidationChain[] = [
  ...adminUserIdValidation,
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 }).withMessage(V.FULL_NAME_MUST_BE_3_120_CHARACTERS),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{8,15}$/).withMessage(V.PHONE_NUMBER_MUST_BE_A_VALID_INTERNATIONAL_NUMBER),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage(V.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS)
    .normalizeEmail(),
  body('age')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100),
  body('gender')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['male', 'female']).withMessage(V.GENDER_MUST_BE_MALE_OR_FEMALE),
  body('role')
    .optional()
    .isIn(['passenger', 'driver']).withMessage(V.ROLE_MUST_BE_PASSENGER_OR_DRIVER),
  body('status')
    .optional()
    .isIn(Object.values(USER_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_ACTIVE_WARNED_SUSPENDED_BANNED),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 500 }).withMessage(V.REASON_MUST_BE_A_STRING_500_CHARACTERS),
];

export const deleteAdminUserValidation: ValidationChain[] = [
  ...adminUserIdValidation,
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




const _exported = {
  adminUserListValidation,
  updateUserStatusValidation,
  deleteUserValidation,
  adminUserIdValidation,
  updateAdminUserValidation,
  deleteAdminUserValidation,
  moderateTripValidation,
};
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = {
    adminUserListValidation,
    updateUserStatusValidation,
    deleteUserValidation,
    adminUserIdValidation,
    updateAdminUserValidation,
    deleteAdminUserValidation,
    moderateTripValidation,
  };
  // @ts-ignore
  module.exports.adminUserListValidation = adminUserListValidation;
  // @ts-ignore
  module.exports.updateUserStatusValidation = updateUserStatusValidation;
  // @ts-ignore
  module.exports.deleteUserValidation = deleteUserValidation;
  // @ts-ignore
  module.exports.adminUserIdValidation = adminUserIdValidation;
  // @ts-ignore
  module.exports.updateAdminUserValidation = updateAdminUserValidation;
  // @ts-ignore
  module.exports.deleteAdminUserValidation = deleteAdminUserValidation;
  // @ts-ignore
  module.exports.moderateTripValidation = moderateTripValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
