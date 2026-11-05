import { body, param, query, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

export const driverParamValidation: ValidationChain[] = [
  param('driver_id')
    .isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID),
];

export const addFavoriteDriverValidation: ValidationChain[] = [
  body('driver_id')
    .notEmpty().withMessage(V.DRIVER_ID_IS_REQUIRED)
    .isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID_2),
];

export const favoriteDriversListValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const routeParamValidation: ValidationChain[] = [
  param('origin_city')
    .isString().trim().notEmpty().withMessage(V.ORIGIN_CITY_IS_REQUIRED)
    .isLength({ max: 120 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  param('destination_city')
    .isString().trim().notEmpty().withMessage(V.DESTINATION_CITY_IS_REQUIRED)
    .isLength({ max: 120 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
];

export const addFavoriteRouteValidation: ValidationChain[] = [
  body('origin_city')
    .notEmpty().withMessage(V.ORIGIN_CITY_IS_REQUIRED)
    .isString().trim().isLength({ max: 120 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  body('destination_city')
    .notEmpty().withMessage(V.DESTINATION_CITY_IS_REQUIRED)
    .isString().trim().isLength({ max: 120 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  body('label')
    .optional()
    .isString().trim().isLength({ max: 100 }).withMessage(V.LABEL_MUST_BE_AT_MOST_100_CHARACTERS),
];




const _exported = { driverParamValidation, addFavoriteDriverValidation, favoriteDriversListValidation, routeParamValidation, addFavoriteRouteValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { driverParamValidation, addFavoriteDriverValidation, favoriteDriversListValidation, routeParamValidation, addFavoriteRouteValidation };
  // @ts-ignore
  module.exports.driverParamValidation = driverParamValidation;
  // @ts-ignore
  module.exports.addFavoriteDriverValidation = addFavoriteDriverValidation;
  // @ts-ignore
  module.exports.favoriteDriversListValidation = favoriteDriversListValidation;
  // @ts-ignore
  module.exports.routeParamValidation = routeParamValidation;
  // @ts-ignore
  module.exports.addFavoriteRouteValidation = addFavoriteRouteValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
