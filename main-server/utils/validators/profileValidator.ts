import { body, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

// Driver personal-data screen (spec 010). Identity/vehicle fields are only
 // accepted while verification is unverified/rejected; the service enforces
// the lock and this validator just checks shapes.
export const updateDriverPersonalDataValidation: ValidationChain[] = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 }).withMessage(V.FULL_NAME_MUST_BE_3_120_CHARACTERS),
  body('display_name')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 }).withMessage(V.DISPLAY_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail().withMessage(V.EMAIL_MUST_BE_A_VALID_EMAIL_ADDRESS_2)
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .notEmpty().withMessage(V.PHONE_CANNOT_BE_EMPTY),
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 18, max: 100 }).withMessage(V.AGE_MUST_BE_AN_INTEGER_BETWEEN_18_AND_100),
  body('avatar_url')
    .optional({ nullable: true })
    .isString().withMessage(V.AVATAR_URL_MUST_BE_A_STRING),
  body('national_id')
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
  body('vehicle')
    .optional()
    .isObject().withMessage(V.VEHICLE_MUST_BE_AN_OBJECT_2),
  body('vehicle.manufacturer')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage(V.MANUFACTURER_MUST_BE_2_60_CHARACTERS),
  body('vehicle.model')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 }).withMessage(V.MODEL_MUST_BE_1_60_CHARACTERS),
  body('vehicle.model_year')
    .optional()
    .isInt({ min: 1990, max: 2100 }).withMessage(V.MODEL_YEAR_MUST_BE_A_VALID_YEAR),
  body('vehicle.color')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 40 }).withMessage(V.COLOR_MUST_BE_AT_MOST_40_CHARACTERS),
  body('vehicle.plate_number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage(V.PLATE_NUMBER_MUST_BE_3_20_CHARACTERS),
  body('vehicle.total_seats')
    .optional()
    .isInt({ min: 1, max: 15 }).withMessage(V.TOTAL_SEATS_MUST_BE_BETWEEN_1_AND_15),
];

export const updatePassengerProfileValidation: ValidationChain[] = [
  body('preferred_gender')
    .optional()
    .isIn(['male', 'female', 'any']).withMessage(V.PREFERRED_GENDER_MUST_BE_MALE_FEMALE_OR_ANY),
  body('smoking_preference')
    .optional()
    .isIn(['no_preference', 'non_smoking', 'smoking_allowed']).withMessage(V.SMOKING_PREFERENCE_MUST_BE_ONE_OF_NO_PREFERENCE_NON_SMOKING_SMOKING_ALLOWED),
  body('national_id')
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_5_30_CHARACTERS),
  body('home_address')
    .optional()
    .trim()
    .isString().withMessage(V.HOME_ADDRESS_MUST_BE_A_STRING),
  body('saved_routes')
    .optional()
    .isArray().withMessage(V.SAVED_ROUTES_MUST_BE_AN_ARRAY),
  body('emergency_contacts')
    .optional()
    .isArray().withMessage(V.EMERGENCY_CONTACTS_MUST_BE_AN_ARRAY),
];




const _exported = { updatePassengerProfileValidation, updateDriverPersonalDataValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { updatePassengerProfileValidation, updateDriverPersonalDataValidation };
  // @ts-ignore
  module.exports.updatePassengerProfileValidation = updatePassengerProfileValidation;
  // @ts-ignore
  module.exports.updateDriverPersonalDataValidation = updateDriverPersonalDataValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
