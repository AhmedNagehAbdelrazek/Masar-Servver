const { body, query, param } = require('express-validator');
const { RIDE_REQUEST_STATUS, REQUEST_OFFER_STATUS } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');

const rideRequestParamValidation = [
  param('request_id')
    .isUUID().withMessage(V.REQUEST_ID_MUST_BE_A_VALID_UUID),
];

const offerParamValidation = [
  param('offer_id')
    .isUUID().withMessage(V.OFFER_ID_MUST_BE_A_VALID_UUID),
];

const createRideRequestValidation = [
  body('origin_city')
    .notEmpty().withMessage(V.ORIGIN_CITY_IS_REQUIRED)
    .isString().trim().isLength({ max: 120 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  body('destination_city')
    .notEmpty().withMessage(V.DESTINATION_CITY_IS_REQUIRED)
    .isString().trim().isLength({ max: 120 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  body('origin_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage(V.ORIGIN_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
  body('destination_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage(V.DESTINATION_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
  body('origin_lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(V.ORIGIN_LAT_MUST_BE_A_VALID_LATITUDE),
  body('origin_lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(V.ORIGIN_LNG_MUST_BE_A_VALID_LONGITUDE),
  body('origin_time')
    .optional()
    .isISO8601().withMessage(V.ORIGIN_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME),
  body('arrival_deadline')
    .optional()
    .isISO8601().withMessage(V.ARRIVAL_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME),
  body('seats_needed')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage(V.SEATS_NEEDED_MUST_BE_BETWEEN_1_AND_8),
  body('max_budget')
    .optional()
    .isFloat({ min: 0 }).withMessage(V.MAX_BUDGET_MUST_BE_A_NON_NEGATIVE_NUMBER),
  body('attributes_preferred')
    .optional()
    .isObject().withMessage(V.ATTRIBUTES_PREFERRED_MUST_BE_AN_OBJECT),
];

const listRideRequestsValidation = [
  query('status')
    .optional()
    .isIn(Object.values(RIDE_REQUEST_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_OPEN_OFFERED_ACCEPTED_EXPIRED_CANCELLED),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

const updateRideRequestValidation = [
  ...rideRequestParamValidation,
  body('action')
    .optional()
    .isIn(['cancel']).withMessage(V.ACTION_MUST_BE_CANCEL),
  body('origin_city')
    .optional()
    .isString().trim().isLength({ max: 120 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  body('destination_city')
    .optional()
    .isString().trim().isLength({ max: 120 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
  body('origin_time')
    .optional()
    .isISO8601().withMessage(V.ORIGIN_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME),
  body('arrival_deadline')
    .optional()
    .isISO8601().withMessage(V.ARRIVAL_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME),
  body('seats_needed')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage(V.SEATS_NEEDED_MUST_BE_BETWEEN_1_AND_8),
  body('max_budget')
    .optional()
    .isFloat({ min: 0 }).withMessage(V.MAX_BUDGET_MUST_BE_A_NON_NEGATIVE_NUMBER),
];

const createOfferValidation = [
  ...rideRequestParamValidation,
  body('offered_fare')
    .optional()
    .isFloat({ min: 0 }).withMessage(V.OFFERED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
  body('message')
    .optional()
    .isString().trim().isLength({ max: 1000 }).withMessage(V.MESSAGE_MUST_BE_AT_MOST_1000_CHARACTERS),
  body('trip_id')
    .optional()
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID_2),
];

const listOffersValidation = [
  ...rideRequestParamValidation,
];

const decideOfferValidation = [
  ...offerParamValidation,
  body('action')
    .isIn(['accept', 'decline']).withMessage(V.ACTION_MUST_BE_ACCEPT_OR_DECLINE),
];

const agreePriceValidation = [
  ...offerParamValidation,
  body('agreed_fare')
    .notEmpty().withMessage(V.AGREED_FARE_IS_REQUIRED)
    .isFloat({ min: 0 }).withMessage(V.AGREED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
];

const driverOffersListValidation = [
  query('status')
    .optional()
    .isIn(Object.values(REQUEST_OFFER_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_SENT_ACCEPTED_DECLINED_EXPIRED),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
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
