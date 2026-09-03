import { body, ValidationChain } from 'express-validator';
import { VEHICLE_TYPES } from '../../config/constants';
import V from '../../config/messages/validation-keys';

const documentId = (field: string, label: string): ValidationChain =>
  body(field)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${label} must be a valid uploaded image id (positive integer)`);

export const driverVerificationValidation: ValidationChain[] = [
  body('full_name')
    .optional()
    .isString().withMessage(V.FULL_NAME_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 120 }).withMessage(V.FULL_NAME_MUST_BE_AT_MOST_120_CHARACTERS_2),
  body('national_id')
    .optional()
    .isString().withMessage(V.NATIONAL_ID_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 30 }).withMessage(V.NATIONAL_ID_MUST_BE_AT_MOST_30_CHARACTERS),
  body('license_number')
    .optional()
    .isString().withMessage(V.LICENSE_NUMBER_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 50 }).withMessage(V.LICENSE_NUMBER_MUST_BE_AT_MOST_50_CHARACTERS),
  body('license_expiry')
    .optional()
    .isDate().withMessage(V.LICENSE_EXPIRY_MUST_BE_A_VALID_DATE),
  body('phone')
    .not().exists().withMessage(V.PHONE_CANNOT_BE_CHANGED_DURING_VERIFICATION),

  documentId('user_identification_front', 'user_identification_front'),
  documentId('user_identification_back', 'user_identification_back'),
  documentId('lincese_front', 'lincese_front'),
  documentId('lincese_back', 'lincese_back'),
  documentId('personal_image_with_id', 'personal_image_with_id'),

  body('vehicle')
    .exists().withMessage(V.VEHICLE_IS_REQUIRED)
    .isObject().withMessage(V.VEHICLE_MUST_BE_AN_OBJECT),
  body('vehicle.manufacturer')
    .exists().withMessage(V.VEHICLE_MANUFACTURER_IS_REQUIRED)
    .isString().withMessage(V.VEHICLE_MANUFACTURER_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 80 }).withMessage(V.VEHICLE_MANUFACTURER_MUST_BE_AT_MOST_80_CHARACTERS),
  body('vehicle.model')
    .exists().withMessage(V.VEHICLE_MODEL_IS_REQUIRED)
    .isString().withMessage(V.VEHICLE_MODEL_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 80 }).withMessage(V.VEHICLE_MODEL_MUST_BE_AT_MOST_80_CHARACTERS),
  body('vehicle.vehicle_type')
    .exists().withMessage(V.VEHICLE_VEHICLE_TYPE_IS_REQUIRED)
    .isIn(Object.values(VEHICLE_TYPES)).withMessage(V.VEHICLE_VEHICLE_TYPE_MUST_BE_ONE_OF_SEDAN_SUV_VAN_BUS_HATCHBACK),
  body('vehicle.model_year')
    .optional()
    .isInt().withMessage(V.VEHICLE_MODEL_YEAR_MUST_BE_A_VALID_YEAR)
    .custom((value: unknown) => {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 10;
      if (Number(value) < minYear || Number(value) > currentYear) {
        throw new Error(`vehicle.model_year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
      }
      return true;
    }),
  body('vehicle.plate_number')
    .exists().withMessage(V.VEHICLE_PLATE_NUMBER_IS_REQUIRED)
    .isString().withMessage(V.VEHICLE_PLATE_NUMBER_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 20 }).withMessage(V.VEHICLE_PLATE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
  body('vehicle.code_number')
    .optional()
    .isString().withMessage(V.VEHICLE_CODE_NUMBER_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 20 }).withMessage(V.VEHICLE_CODE_NUMBER_MUST_BE_AT_MOST_20_CHARACTERS),
  body('vehicle.color')
    .optional()
    .isString().withMessage(V.VEHICLE_COLOR_MUST_BE_A_STRING)
    .trim()
    .isLength({ max: 30 }).withMessage(V.VEHICLE_COLOR_MUST_BE_AT_MOST_30_CHARACTERS),
  body('vehicle.seats')
    .exists().withMessage(V.VEHICLE_SEATS_IS_REQUIRED)
    .isInt({ min: 1, max: 50 }).withMessage(V.VEHICLE_SEATS_MUST_BE_AN_INTEGER_BETWEEN_1_AND_50),

  documentId('vehicle.registration_doc_front', 'vehicle.registration_doc_front'),
  documentId('vehicle.registration_doc_back', 'vehicle.registration_doc_back'),
  documentId('vehicle.vehicle_photo_front', 'vehicle.vehicle_photo_front'),
  documentId('vehicle.vehicle_photo_back', 'vehicle.vehicle_photo_back'),
];




const _exported = { driverVerificationValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { driverVerificationValidation };
  // @ts-ignore
  module.exports.driverVerificationValidation = driverVerificationValidation;
  // @ts-ignore
  module.exports.default = _exported;
}

