const { body } = require('express-validator');

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

module.exports = { updatePassengerProfileValidation };
