"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driverOffersListValidation = exports.agreePriceValidation = exports.decideOfferValidation = exports.listOffersValidation = exports.createOfferValidation = exports.updateRideRequestValidation = exports.listRideRequestsValidation = exports.createRideRequestValidation = exports.offerParamValidation = exports.rideRequestParamValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
exports.rideRequestParamValidation = [
    (0, express_validator_1.param)('request_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.REQUEST_ID_MUST_BE_A_VALID_UUID),
];
exports.offerParamValidation = [
    (0, express_validator_1.param)('offer_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.OFFER_ID_MUST_BE_A_VALID_UUID),
];
exports.createRideRequestValidation = [
    (0, express_validator_1.body)('origin_city')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_CITY_IS_REQUIRED)
        .isString().trim().isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('destination_city')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_CITY_IS_REQUIRED)
        .isString().trim().isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('origin_place')
        .optional()
        .isString().trim().isLength({ max: 255 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
    (0, express_validator_1.body)('destination_place')
        .optional()
        .isString().trim().isLength({ max: 255 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
    (0, express_validator_1.body)('origin_lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_LAT_MUST_BE_A_VALID_LATITUDE),
    (0, express_validator_1.body)('origin_lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_LNG_MUST_BE_A_VALID_LONGITUDE),
    (0, express_validator_1.body)('origin_time')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME),
    (0, express_validator_1.body)('arrival_deadline')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.ARRIVAL_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME),
    (0, express_validator_1.body)('seats_needed')
        .optional()
        .isInt({ min: 1, max: 8 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEATS_NEEDED_MUST_BE_BETWEEN_1_AND_8),
    (0, express_validator_1.body)('max_budget')
        .optional()
        .isFloat({ min: 0 }).withMessage(validation_keys_1.VALIDATION_KEYS.MAX_BUDGET_MUST_BE_A_NON_NEGATIVE_NUMBER),
    (0, express_validator_1.body)('attributes_preferred')
        .optional()
        .isObject().withMessage(validation_keys_1.VALIDATION_KEYS.ATTRIBUTES_PREFERRED_MUST_BE_AN_OBJECT),
];
exports.listRideRequestsValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.RIDE_REQUEST_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_OPEN_OFFERED_ACCEPTED_EXPIRED_CANCELLED),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.updateRideRequestValidation = [
    ...exports.rideRequestParamValidation,
    (0, express_validator_1.body)('action')
        .optional()
        .isIn(['cancel']).withMessage(validation_keys_1.VALIDATION_KEYS.ACTION_MUST_BE_CANCEL),
    (0, express_validator_1.body)('origin_city')
        .optional()
        .isString().trim().isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('destination_city')
        .optional()
        .isString().trim().isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('origin_time')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME),
    (0, express_validator_1.body)('arrival_deadline')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.ARRIVAL_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME),
    (0, express_validator_1.body)('seats_needed')
        .optional()
        .isInt({ min: 1, max: 8 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEATS_NEEDED_MUST_BE_BETWEEN_1_AND_8),
    (0, express_validator_1.body)('max_budget')
        .optional()
        .isFloat({ min: 0 }).withMessage(validation_keys_1.VALIDATION_KEYS.MAX_BUDGET_MUST_BE_A_NON_NEGATIVE_NUMBER),
];
exports.createOfferValidation = [
    ...exports.rideRequestParamValidation,
    (0, express_validator_1.body)('offered_fare')
        .optional()
        .isFloat({ min: 0 }).withMessage(validation_keys_1.VALIDATION_KEYS.OFFERED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
    (0, express_validator_1.body)('message')
        .optional()
        .isString().trim().isLength({ max: 1000 }).withMessage(validation_keys_1.VALIDATION_KEYS.MESSAGE_MUST_BE_AT_MOST_1000_CHARACTERS),
    (0, express_validator_1.body)('trip_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID_2),
];
exports.listOffersValidation = [
    ...exports.rideRequestParamValidation,
];
exports.decideOfferValidation = [
    ...exports.offerParamValidation,
    (0, express_validator_1.body)('action')
        .isIn(['accept', 'decline']).withMessage(validation_keys_1.VALIDATION_KEYS.ACTION_MUST_BE_ACCEPT_OR_DECLINE),
];
exports.agreePriceValidation = [
    ...exports.offerParamValidation,
    (0, express_validator_1.body)('agreed_fare')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.AGREED_FARE_IS_REQUIRED)
        .isFloat({ min: 0 }).withMessage(validation_keys_1.VALIDATION_KEYS.AGREED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
];
exports.driverOffersListValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.REQUEST_OFFER_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_SENT_ACCEPTED_DECLINED_EXPIRED),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
const _exported = { rideRequestParamValidation: exports.rideRequestParamValidation, offerParamValidation: exports.offerParamValidation, createRideRequestValidation: exports.createRideRequestValidation, listRideRequestsValidation: exports.listRideRequestsValidation, updateRideRequestValidation: exports.updateRideRequestValidation, createOfferValidation: exports.createOfferValidation, listOffersValidation: exports.listOffersValidation, decideOfferValidation: exports.decideOfferValidation, agreePriceValidation: exports.agreePriceValidation, driverOffersListValidation: exports.driverOffersListValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { rideRequestParamValidation: exports.rideRequestParamValidation, offerParamValidation: exports.offerParamValidation, createRideRequestValidation: exports.createRideRequestValidation, listRideRequestsValidation: exports.listRideRequestsValidation, updateRideRequestValidation: exports.updateRideRequestValidation, createOfferValidation: exports.createOfferValidation, listOffersValidation: exports.listOffersValidation, decideOfferValidation: exports.decideOfferValidation, agreePriceValidation: exports.agreePriceValidation, driverOffersListValidation: exports.driverOffersListValidation };
    // @ts-ignore
    module.exports.rideRequestParamValidation = exports.rideRequestParamValidation;
    // @ts-ignore
    module.exports.offerParamValidation = exports.offerParamValidation;
    // @ts-ignore
    module.exports.createRideRequestValidation = exports.createRideRequestValidation;
    // @ts-ignore
    module.exports.listRideRequestsValidation = exports.listRideRequestsValidation;
    // @ts-ignore
    module.exports.updateRideRequestValidation = exports.updateRideRequestValidation;
    // @ts-ignore
    module.exports.createOfferValidation = exports.createOfferValidation;
    // @ts-ignore
    module.exports.listOffersValidation = exports.listOffersValidation;
    // @ts-ignore
    module.exports.decideOfferValidation = exports.decideOfferValidation;
    // @ts-ignore
    module.exports.agreePriceValidation = exports.agreePriceValidation;
    // @ts-ignore
    module.exports.driverOffersListValidation = exports.driverOffersListValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=rideRequestValidator.js.map