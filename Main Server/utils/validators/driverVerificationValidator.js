const { body } = require('express-validator');
const { VEHICLE_TYPES } = require('../../config/constants');

const documentId = (field, label) =>
  body(field)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${label} must be a valid uploaded image id (positive integer)`);

const driverVerificationValidation = [
  body('full_name')
    .optional()
    .isString().withMessage('full_name must be a string')
    .trim()
    .isLength({ max: 120 }).withMessage('full_name must be at most 120 characters'),
  body('national_id')
    .optional()
    .isString().withMessage('national_id must be a string')
    .trim()
    .isLength({ max: 30 }).withMessage('national_id must be at most 30 characters'),
  body('license_number')
    .optional()
    .isString().withMessage('license_number must be a string')
    .trim()
    .isLength({ max: 50 }).withMessage('license_number must be at most 50 characters'),
  body('license_expiry')
    .optional()
    .isDate().withMessage('license_expiry must be a valid date'),
  body('phone')
    .not().exists().withMessage('phone cannot be changed during verification'),

  documentId('user_identification_front', 'user_identification_front'),
  documentId('user_identification_back', 'user_identification_back'),
  documentId('lincese_front', 'lincese_front'),
  documentId('lincese_back', 'lincese_back'),
  documentId('personal_image_with_id', 'personal_image_with_id'),

  body('vehicle')
    .exists().withMessage('vehicle is required')
    .isObject().withMessage('vehicle must be an object'),
  body('vehicle.manufacturer')
    .exists().withMessage('vehicle.manufacturer is required')
    .isString().withMessage('vehicle.manufacturer must be a string')
    .trim()
    .isLength({ max: 80 }).withMessage('vehicle.manufacturer must be at most 80 characters'),
  body('vehicle.model')
    .exists().withMessage('vehicle.model is required')
    .isString().withMessage('vehicle.model must be a string')
    .trim()
    .isLength({ max: 80 }).withMessage('vehicle.model must be at most 80 characters'),
  body('vehicle.vehicle_type')
    .exists().withMessage('vehicle.vehicle_type is required')
    .isIn(Object.values(VEHICLE_TYPES)).withMessage(`vehicle.vehicle_type must be one of ${Object.values(VEHICLE_TYPES).join(', ')}`),
  body('vehicle.model_year')
    .optional()
    .isInt().withMessage('vehicle.model_year must be a valid year')
    .custom((value) => {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 10;
      if (value < minYear || value > currentYear) {
        throw new Error(`vehicle.model_year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
      }
      return true;
    }),
  body('vehicle.plate_number')
    .exists().withMessage('vehicle.plate_number is required')
    .isString().withMessage('vehicle.plate_number must be a string')
    .trim()
    .isLength({ max: 20 }).withMessage('vehicle.plate_number must be at most 20 characters'),
  body('vehicle.code_number')
    .optional()
    .isString().withMessage('vehicle.code_number must be a string')
    .trim()
    .isLength({ max: 20 }).withMessage('vehicle.code_number must be at most 20 characters'),
  body('vehicle.color')
    .optional()
    .isString().withMessage('vehicle.color must be a string')
    .trim()
    .isLength({ max: 30 }).withMessage('vehicle.color must be at most 30 characters'),
  body('vehicle.seats')
    .exists().withMessage('vehicle.seats is required')
    .isInt({ min: 1, max: 50 }).withMessage('vehicle.seats must be an integer between 1 and 50'),

  documentId('vehicle.registration_doc_front', 'vehicle.registration_doc_front'),
  documentId('vehicle.registration_doc_back', 'vehicle.registration_doc_back'),
  documentId('vehicle.vehicle_photo_front', 'vehicle.vehicle_photo_front'),
  documentId('vehicle.vehicle_photo_back', 'vehicle.vehicle_photo_back'),
];

module.exports = { driverVerificationValidation };
