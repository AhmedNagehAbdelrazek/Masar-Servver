const { body, param, query } = require('express-validator');

const driverParamValidation = [
  param('driver_id')
    .isUUID().withMessage('Driver ID must be a valid UUID'),
];

const addFavoriteDriverValidation = [
  body('driver_id')
    .notEmpty().withMessage('driver_id is required')
    .isUUID().withMessage('driver_id must be a valid UUID'),
];

const favoriteDriversListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const routeParamValidation = [
  param('origin_city')
    .isString().trim().notEmpty().withMessage('origin_city is required')
    .isLength({ max: 120 }).withMessage('origin_city must be at most 120 characters'),
  param('destination_city')
    .isString().trim().notEmpty().withMessage('destination_city is required')
    .isLength({ max: 120 }).withMessage('destination_city must be at most 120 characters'),
];

const addFavoriteRouteValidation = [
  body('origin_city')
    .notEmpty().withMessage('origin_city is required')
    .isString().trim().isLength({ max: 120 }).withMessage('origin_city must be at most 120 characters'),
  body('destination_city')
    .notEmpty().withMessage('destination_city is required')
    .isString().trim().isLength({ max: 120 }).withMessage('destination_city must be at most 120 characters'),
  body('label')
    .optional()
    .isString().trim().isLength({ max: 100 }).withMessage('label must be at most 100 characters'),
];

module.exports = {
  driverParamValidation,
  addFavoriteDriverValidation,
  favoriteDriversListValidation,
  routeParamValidation,
  addFavoriteRouteValidation,
};
