const { body, query, param } = require('express-validator');
const { RIDE_REQUEST_STATUS, REQUEST_OFFER_STATUS } = require('../../config/constants');

const rideRequestParamValidation = [
  param('request_id')
    .isUUID().withMessage('Request ID must be a valid UUID'),
];

const offerParamValidation = [
  param('offer_id')
    .isUUID().withMessage('Offer ID must be a valid UUID'),
];

const createRideRequestValidation = [
  body('origin_city')
    .notEmpty().withMessage('origin_city is required')
    .isString().trim().isLength({ max: 120 }).withMessage('origin_city must be at most 120 characters'),
  body('destination_city')
    .notEmpty().withMessage('destination_city is required')
    .isString().trim().isLength({ max: 120 }).withMessage('destination_city must be at most 120 characters'),
  body('origin_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage('origin_place must be at most 255 characters'),
  body('destination_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage('destination_place must be at most 255 characters'),
  body('origin_lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('origin_lat must be a valid latitude'),
  body('origin_lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('origin_lng must be a valid longitude'),
  body('origin_time')
    .optional()
    .isISO8601().withMessage('origin_time must be a valid ISO-8601 datetime'),
  body('arrival_deadline')
    .optional()
    .isISO8601().withMessage('arrival_deadline must be a valid ISO-8601 datetime'),
  body('seats_needed')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('seats_needed must be between 1 and 8'),
  body('max_budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('max_budget must be a non-negative number'),
  body('attributes_preferred')
    .optional()
    .isObject().withMessage('attributes_preferred must be an object'),
];

const listRideRequestsValidation = [
  query('status')
    .optional()
    .isIn(Object.values(RIDE_REQUEST_STATUS)).withMessage(`Status must be one of: ${Object.values(RIDE_REQUEST_STATUS).join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const updateRideRequestValidation = [
  ...rideRequestParamValidation,
  body('action')
    .optional()
    .isIn(['cancel']).withMessage('action must be "cancel"'),
  body('origin_city')
    .optional()
    .isString().trim().isLength({ max: 120 }).withMessage('origin_city must be at most 120 characters'),
  body('destination_city')
    .optional()
    .isString().trim().isLength({ max: 120 }).withMessage('destination_city must be at most 120 characters'),
  body('origin_time')
    .optional()
    .isISO8601().withMessage('origin_time must be a valid ISO-8601 datetime'),
  body('arrival_deadline')
    .optional()
    .isISO8601().withMessage('arrival_deadline must be a valid ISO-8601 datetime'),
  body('seats_needed')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('seats_needed must be between 1 and 8'),
  body('max_budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('max_budget must be a non-negative number'),
];

const createOfferValidation = [
  ...rideRequestParamValidation,
  body('offered_fare')
    .optional()
    .isFloat({ min: 0 }).withMessage('offered_fare must be a non-negative number'),
  body('message')
    .optional()
    .isString().trim().isLength({ max: 1000 }).withMessage('message must be at most 1000 characters'),
  body('trip_id')
    .optional()
    .isUUID().withMessage('trip_id must be a valid UUID'),
];

const listOffersValidation = [
  ...rideRequestParamValidation,
];

const decideOfferValidation = [
  ...offerParamValidation,
  body('action')
    .isIn(['accept', 'decline']).withMessage('action must be "accept" or "decline"'),
];

const agreePriceValidation = [
  ...offerParamValidation,
  body('agreed_fare')
    .notEmpty().withMessage('agreed_fare is required')
    .isFloat({ min: 0 }).withMessage('agreed_fare must be a non-negative number'),
];

const driverOffersListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(REQUEST_OFFER_STATUS)).withMessage(`Status must be one of: ${Object.values(REQUEST_OFFER_STATUS).join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

module.exports = {
  rideRequestParamValidation,
  offerParamValidation,
  createRideRequestValidation,
  listRideRequestsValidation,
  updateRideRequestValidation,
  createOfferValidation,
  listOffersValidation,
  decideOfferValidation,
  agreePriceValidation,
  driverOffersListValidation,
};
