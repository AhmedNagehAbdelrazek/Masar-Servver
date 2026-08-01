const { body, query, param } = require('express-validator');
const { COMPLAINT_STATUS } = require('../../config/constants');

const COMPLAINT_CATEGORIES = [
  'no_show',
  'lateness',
  'misconduct',
  'fraud',
  'safety',
  'overcharging',
  'other',
];

const complaintValidation = [
  body('accused_id')
    .isUUID().withMessage('Accused user ID must be a valid UUID')
    .custom((value, { req }) => {
      if (req.user && req.user.id === value) {
        throw new Error('You cannot file a complaint against yourself');
      }
      return true;
    }),
  body('booking_id')
    .optional()
    .isUUID().withMessage('Booking ID must be a valid UUID'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(COMPLAINT_CATEGORIES).withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('evidence_urls')
    .optional()
    .isArray().withMessage('Evidence URLs must be an array')
    .custom((arr) => {
      if (!arr.every((u) => typeof u === 'string' && /^https?:\/\//.test(u))) {
        throw new Error('Each evidence URL must be a valid http(s) URL');
      }
      return true;
    }),
];

const driverComplaintListValidation = [
  query('direction')
    .optional()
    .isIn(['filed', 'against']).withMessage('Direction must be filed or against'),
  query('status')
    .optional()
    .isIn(Object.values(COMPLAINT_STATUS)).withMessage(`Status must be one of: ${Object.values(COMPLAINT_STATUS).join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const adminComplaintListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(COMPLAINT_STATUS)).withMessage(`Status must be one of: ${Object.values(COMPLAINT_STATUS).join(', ')}`),
  query('category')
    .optional()
    .isIn(COMPLAINT_CATEGORIES).withMessage(`Category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const resolveComplaintValidation = [
  param('complaint_id')
    .isUUID().withMessage('Complaint ID must be a valid UUID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn([COMPLAINT_STATUS.REVIEWING, COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.DISMISSED])
    .withMessage(`Status must be one of: reviewing, resolved, dismissed`),
  body('resolution')
    .custom((value, { req }) => {
      if (req.body.status === COMPLAINT_STATUS.RESOLVED && !value) {
        throw new Error('Resolution is required when resolving a complaint');
      }
      return true;
    })
    .isLength({ max: 2000 }).withMessage('Resolution must be at most 2000 characters'),
];

module.exports = {
  complaintValidation,
  driverComplaintListValidation,
  adminComplaintListValidation,
  resolveComplaintValidation,
};
