const { body } = require('express-validator');

// Driver personal-data screen (spec 010). Identity/vehicle fields are only
 // accepted while verification is unverified/rejected; the service enforces
// the lock and this validator just checks shapes.
const updateDriverPersonalDataValidation = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 }).withMessage('Full name must be 3-120 characters'),
  body('display_name')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 }).withMessage('Display name must be at most 120 characters'),
  body('email')
    .optional({ nullable: true })
    .trim()
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .notEmpty().withMessage('Phone cannot be empty'),
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 18, max: 100 }).withMessage('Age must be an integer between 18 and 100'),
  body('avatar_url')
    .optional({ nullable: true })
    .isString().withMessage('Avatar URL must be a string'),
  body('national_id')
    .optional()
    .trim()
    .isLength({ min: 5, max: 30 }).withMessage('National ID must be 5-30 characters'),
  body('vehicle')
    .optional()
    .isObject().withMessage('Vehicle must be an object'),
  body('vehicle.manufacturer')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Manufacturer must be 2-60 characters'),
  body('vehicle.model')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 }).withMessage('Model must be 1-60 characters'),
  body('vehicle.model_year')
    .optional()
    .isInt({ min: 1990, max: 2100 }).withMessage('Model year must be a valid year'),
  body('vehicle.color')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 40 }).withMessage('Color must be at most 40 characters'),
  body('vehicle.plate_number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Plate number must be 3-20 characters'),
  body('vehicle.total_seats')
    .optional()
    .isInt({ min: 1, max: 15 }).withMessage('Total seats must be between 1 and 15'),
];

const updatePassengerProfileValidation = [
  body('preferred_gender')
    .optional()
    .isIn(['male', 'female', 'any']).withMessage('preferred_gender must be "male", "female" or "any"'),
  body('smoking_preference')
    .optional()
    .isIn(['no_preference', 'non_smoking', 'smoking_allowed']).withMessage('smoking_preference must be one of: no_preference, non_smoking, smoking_allowed'),
  body('saved_routes')
    .optional()
    .isArray().withMessage('saved_routes must be an array'),
  body('emergency_contacts')
    .optional()
    .isArray().withMessage('emergency_contacts must be an array'),
];

module.exports = { updatePassengerProfileValidation, updateDriverPersonalDataValidation };
