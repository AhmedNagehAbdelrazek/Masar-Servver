const { body, param } = require('express-validator');
const { VEHICLE_TYPES } = require('../../config/constants');

const vehicleUpdateValidation = [
  param('vehicle_id').isUUID().withMessage('Vehicle ID must be a valid UUID'),
  body('manufacturer').optional().isString().trim().isLength({ max: 80 }).withMessage('manufacturer must be a string ≤ 80 characters'),
  body('model').optional().isString().trim().isLength({ max: 80 }).withMessage('model must be a string ≤ 80 characters'),
  body('vehicle_type').optional().isIn(Object.values(VEHICLE_TYPES)).withMessage('vehicle_type must be one of sedan, suv, van, bus, hatchback'),
  body('model_year').optional().isInt({ min: 1900, max: 2100 }).withMessage('model_year must be a valid year'),
  body('plate_number').optional().isString().trim().isLength({ max: 20 }).withMessage('plate_number must be a string ≤ 20 characters'),
  body('color').optional().isString().trim().isLength({ max: 30 }).withMessage('color must be a string ≤ 30 characters'),
  body('seats').optional().isInt({ min: 1, max: 50 }).withMessage('seats must be an integer between 1 and 50'),
];

module.exports = { vehicleUpdateValidation };
