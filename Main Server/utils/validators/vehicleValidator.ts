import { body, param, ValidationChain } from 'express-validator';
import { VEHICLE_TYPES } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const vehicleUpdateValidation: ValidationChain[] = [
  param('vehicle_id').isUUID().withMessage(V.VEHICLE_ID_MUST_BE_A_VALID_UUID),
  body('manufacturer').optional().isString().trim().isLength({ max: 80 }).withMessage(V.MANUFACTURER_MUST_BE_A_STRING_80_CHARACTERS),
  body('model').optional().isString().trim().isLength({ max: 80 }).withMessage(V.MODEL_MUST_BE_A_STRING_80_CHARACTERS),
  body('vehicle_type').optional().isIn(Object.values(VEHICLE_TYPES)).withMessage(V.VEHICLE_TYPE_MUST_BE_ONE_OF_SEDAN_SUV_VAN_BUS_HATCHBACK),
  body('model_year')
    .optional()
    .isInt().withMessage(V.MODEL_YEAR_MUST_BE_A_VALID_YEAR_2)
    .custom((value: unknown) => {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 10;
      if (Number(value) < minYear || Number(value) > currentYear) {
        throw new Error(`model_year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
      }
      return true;
    }),
  body('plate_number').optional().isString().trim().isLength({ max: 20 }).withMessage(V.PLATE_NUMBER_MUST_BE_A_STRING_20_CHARACTERS),
  body('code_number').optional().isString().trim().isLength({ max: 20 }).withMessage(V.CODE_NUMBER_MUST_BE_A_STRING_20_CHARACTERS),
  body('color').optional().isString().trim().isLength({ max: 30 }).withMessage(V.COLOR_MUST_BE_A_STRING_30_CHARACTERS),
  body('seats').optional().isInt({ min: 1, max: 50 }).withMessage(V.SEATS_MUST_BE_AN_INTEGER_BETWEEN_1_AND_50),
];




const _exported = { vehicleUpdateValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { vehicleUpdateValidation };
  // @ts-ignore
  module.exports.vehicleUpdateValidation = vehicleUpdateValidation;
  // @ts-ignore
  module.exports.default = _exported;
}

