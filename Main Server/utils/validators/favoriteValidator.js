const { body, param, query } = require('express-validator');
const V = require('../../config/messages/validation-keys');

const driverParamValidation = [
  param('driver_id')
    .isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID),
];

const addFavoriteDriverValidation = [
  body('driver_id')
    .notEmpty().withMessage(V.DRIVER_ID_IS_REQUIRED)
    .isUUID().withMessage(V.DRIVER_ID_MUST_BE_A_VALID_UUID_2),
];

const favoriteDriversListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

const routeParamValidation = [
  param('origin_city')
    .isString().trim().notEmpty().withMessage(V.ORIGIN_CITY_IS_REQUIRED)
    .isLength({ max: 120 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  param('destination_city')
    .isString().trim().notEmpty().withMessage(V.DESTINATION_CITY_IS_REQUIRED)
    .isLength({ max: 120 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
];

const addFavoriteRouteValidation = [
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

module.exports = {
  driverParamValidation,
  addFavoriteDriverValidation,
  favoriteDriversListValidation,
  routeParamValidation,
  addFavoriteRouteValidation,
};
