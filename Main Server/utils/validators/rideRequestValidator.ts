import { body, query, param, ValidationChain } from 'express-validator';
import { RIDE_REQUEST_STATUS, REQUEST_OFFER_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const rideRequestParamValidation: ValidationChain[] = [
  param('request_id')
    .isUUID().withMessage(V.REQUEST_ID_MUST_BE_A_VALID_UUID),
];

export const offerParamValidation: ValidationChain[] = [
  param('offer_id')
    .isUUID().withMessage(V.OFFER_ID_MUST_BE_A_VALID_UUID),
];

export const createRideRequestValidation: ValidationChain[] = [
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

export const listRideRequestsValidation: ValidationChain[] = [
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

export const updateRideRequestValidation: ValidationChain[] = [
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

export const createOfferValidation: ValidationChain[] = [
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

export const listOffersValidation: ValidationChain[] = [
  ...rideRequestParamValidation,
];

export const decideOfferValidation: ValidationChain[] = [
  ...offerParamValidation,
  body('action')
    .isIn(['accept', 'decline']).withMessage(V.ACTION_MUST_BE_ACCEPT_OR_DECLINE),
];

export const agreePriceValidation: ValidationChain[] = [
  ...offerParamValidation,
  body('agreed_fare')
    .notEmpty().withMessage(V.AGREED_FARE_IS_REQUIRED)
    .isFloat({ min: 0 }).withMessage(V.AGREED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
];

export const driverOffersListValidation: ValidationChain[] = [
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




const _exported = { rideRequestParamValidation, offerParamValidation, createRideRequestValidation, listRideRequestsValidation, updateRideRequestValidation, createOfferValidation, listOffersValidation, decideOfferValidation, agreePriceValidation, driverOffersListValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { rideRequestParamValidation, offerParamValidation, createRideRequestValidation, listRideRequestsValidation, updateRideRequestValidation, createOfferValidation, listOffersValidation, decideOfferValidation, agreePriceValidation, driverOffersListValidation };
  // @ts-ignore
  module.exports.rideRequestParamValidation = rideRequestParamValidation;
  // @ts-ignore
  module.exports.offerParamValidation = offerParamValidation;
  // @ts-ignore
  module.exports.createRideRequestValidation = createRideRequestValidation;
  // @ts-ignore
  module.exports.listRideRequestsValidation = listRideRequestsValidation;
  // @ts-ignore
  module.exports.updateRideRequestValidation = updateRideRequestValidation;
  // @ts-ignore
  module.exports.createOfferValidation = createOfferValidation;
  // @ts-ignore
  module.exports.listOffersValidation = listOffersValidation;
  // @ts-ignore
  module.exports.decideOfferValidation = decideOfferValidation;
  // @ts-ignore
  module.exports.agreePriceValidation = agreePriceValidation;
  // @ts-ignore
  module.exports.driverOffersListValidation = driverOffersListValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
