"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelTripValidation = exports.updateTripValidation = exports.releaseSeatLockValidation = exports.lockSeatValidation = exports.tripPassengersValidation = exports.tripParamValidation = exports.searchAvailableTripsValidation = exports.createTripValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
exports.createTripValidation = [
    (0, express_validator_1.body)('origin_city')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_CITY_IS_REQUIRED_2)
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_CITY_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('origin_area')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_AREA_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('origin_lat')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_LATITUDE_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const lat = parseFloat(String(value));
        if (lat < -90 || lat > 90)
            throw new Error(validation_keys_1.VALIDATION_KEYS.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90);
        return true;
    }),
    (0, express_validator_1.body)('origin_lng')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_LONGITUDE_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const lng = parseFloat(String(value));
        if (lng < -180 || lng > 180)
            throw new Error(validation_keys_1.VALIDATION_KEYS.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180);
        return true;
    }),
    (0, express_validator_1.body)('destination_city')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_CITY_IS_REQUIRED_2)
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_CITY_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('destination_area')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_AREA_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('destination_lat')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_LATITUDE_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const lat = parseFloat(String(value));
        if (lat < -90 || lat > 90)
            throw new Error(validation_keys_1.VALIDATION_KEYS.DESTINATION_LATITUDE_MUST_BE_BETWEEN_90_AND_90);
        return true;
    }),
    (0, express_validator_1.body)('destination_lng')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_LONGITUDE_MUST_BE_A_DECIMAL)
        .custom((value) => {
        const lng = parseFloat(String(value));
        if (lng < -180 || lng > 180)
            throw new Error(validation_keys_1.VALIDATION_KEYS.DESTINATION_LONGITUDE_MUST_BE_BETWEEN_180_AND_180);
        return true;
    }),
    (0, express_validator_1.body)('waypoints')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.WAYPOINTS_MUST_BE_AN_ARRAY),
    (0, express_validator_1.body)('waypoints.*.stop_name')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.VALIDATION_KEYS.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('waypoints.*.stop_lat')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.STOP_LATITUDE_MUST_BE_A_DECIMAL),
    (0, express_validator_1.body)('waypoints.*.stop_lng')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.STOP_LONGITUDE_MUST_BE_A_DECIMAL),
    (0, express_validator_1.body)('departure_date')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_DATE_IS_REQUIRED)
        .isDate().withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD)
        .custom((value) => {
        const date = new Date(`${String(value)}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today)
            throw new Error(validation_keys_1.VALIDATION_KEYS.DEPARTURE_DATE_MUST_BE_TODAY_OR_IN_THE_FUTURE);
        return true;
    }),
    (0, express_validator_1.body)('departure_time')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_TIME_IS_REQUIRED)
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_TIME_MUST_BE_IN_HH_MM_FORMAT),
    (0, express_validator_1.body)('type_of_trip')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_TYPE_IS_REQUIRED)
        .isIn(['once', 'repeated']).withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_TYPE_MUST_BE_ONCE_OR_REPEATED),
    (0, express_validator_1.body)('repeated_days')
        .if((0, express_validator_1.body)('type_of_trip').equals('repeated'))
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS)
        .isArray({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.AT_LEAST_ONE_DAY_MUST_BE_SELECTED)
        .custom((days) => {
        if (!Array.isArray(days) || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.REPEATED_DAYS_MUST_BE_INTEGERS_BETWEEN_0_SUNDAY_AND_6_SATURDAY);
        }
        return true;
    }),
    (0, express_validator_1.body)('repeated_end_date')
        .if((0, express_validator_1.body)('type_of_trip').equals('repeated'))
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS)
        .isDate().withMessage(validation_keys_1.VALIDATION_KEYS.END_DATE_MUST_BE_A_VALID_DATE)
        .custom((value, { req }) => {
        const endDate = new Date(`${String(value)}T00:00:00`);
        const startDate = new Date(`${req.body.departure_date}T00:00:00`);
        if (endDate <= startDate)
            throw new Error(validation_keys_1.VALIDATION_KEYS.END_DATE_MUST_BE_AFTER_DEPARTURE_DATE);
        return true;
    }),
    (0, express_validator_1.body)('allowed_type')
        .optional()
        .isIn(Object.values(constants_1.GENDER_PREFERENCE)).withMessage(validation_keys_1.VALIDATION_KEYS.ALLOWED_TYPE_MUST_BE_ONE_OF_ALL_WOMEN_ONLY_MEN_ONLY),
    (0, express_validator_1.body)('fare_per_seat')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.FARE_PER_SEAT_IS_REQUIRED)
        .isDecimal({ decimal_digits: '1,2' }).withMessage(validation_keys_1.VALIDATION_KEYS.FARE_MUST_BE_A_DECIMAL_WITH_UP_TO_2_DECIMAL_PLACES)
        .custom((value) => {
        if (parseFloat(String(value)) < 0)
            throw new Error(validation_keys_1.VALIDATION_KEYS.FARE_CANNOT_BE_NEGATIVE);
        return true;
    }),
    (0, express_validator_1.body)('seats')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.SEATS_CONFIGURATION_IS_REQUIRED)
        .isArray({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.AT_LEAST_ONE_SEAT_MUST_BE_CONFIGURED),
    (0, express_validator_1.body)('seats.*.seat_number')
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.body)('seats.*.type')
        .isIn(['driver', 'available', 'unavailable']).withMessage(validation_keys_1.VALIDATION_KEYS.SEAT_TYPE_MUST_BE_DRIVER_AVAILABLE_OR_UNAVAILABLE),
    (0, express_validator_1.body)('instructions')
        .optional()
        .isArray({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.INSTRUCTIONS_MUST_BE_A_NON_EMPTY_ARRAY)
        .custom((arr) => {
        if (!Array.isArray(arr) || !arr.every((item) => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= 1000)) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.EACH_INSTRUCTION_MUST_BE_A_NON_EMPTY_STRING_OF_AT_MOST_1000);
        }
        return true;
    })
        .customSanitizer((arr) => arr.map((s) => s.trim())),
    (0, express_validator_1.body)('additional_instructions')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage(validation_keys_1.VALIDATION_KEYS.ADDITIONAL_INSTRUCTIONS_MUST_BE_AT_MOST_1000_CHARACTERS),
];
exports.searchAvailableTripsValidation = [
    (0, express_validator_1.query)('origin_city')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.ORIGIN_CITY_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.query)('destination_city')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESTINATION_CITY_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.query)('date')
        .optional()
        .isDate().withMessage(validation_keys_1.VALIDATION_KEYS.DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD),
    (0, express_validator_1.query)('gender_preference')
        .optional()
        .isIn(Object.values(constants_1.GENDER_PREFERENCE)).withMessage(validation_keys_1.VALIDATION_KEYS.GENDER_PREFERENCE_MUST_BE_ONE_OF_ALL_WOMEN_ONLY_MEN_ONLY),
    (0, express_validator_1.query)('time_from')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_TIME_MUST_BE_IN_HH_MM_FORMAT),
    (0, express_validator_1.query)('time_to')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_TIME_MUST_BE_IN_HH_MM_FORMAT)
        .custom((value, { req }) => {
        if (req.query.time_from && String(value) < String(req.query.time_from)) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.TIME_FROM_AFTER_TIME_TO);
        }
        return true;
    }),
    (0, express_validator_1.query)('vehicle_type')
        .optional()
        .isIn(Object.values(constants_1.VEHICLE_TYPES)).withMessage(validation_keys_1.VALIDATION_KEYS.VEHICLE_TYPE_MUST_BE_ONE_OF_SEDAN_SUV_VAN_BUS_HATCHBACK),
    (0, express_validator_1.query)('seats')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEATS_MUST_BE_POSITIVE_INTEGER),
];
exports.tripParamValidation = [
    (0, express_validator_1.param)('trip_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID),
];
exports.tripPassengersValidation = [
    ...exports.tripParamValidation,
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.BOOKING_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_PENDING_CONFIRMED_CANCELLED_COMPLETED_NO_SHOW),
];
exports.lockSeatValidation = [
    (0, express_validator_1.param)('trip_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('seat_number')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.SEAT_NUMBER_IS_REQUIRED)
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
];
exports.releaseSeatLockValidation = [
    (0, express_validator_1.param)('trip_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.param)('seat_number')
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
];
const TRIP_ATTR_KEYS = ['smoking_allowed', 'women_only', 'ac', 'pets', 'luggage', 'music'];
exports.updateTripValidation = [
    (0, express_validator_1.param)('trip_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('fare_per_seat')
        .optional()
        .isDecimal({ decimal_digits: '1,2' }).withMessage(validation_keys_1.VALIDATION_KEYS.FARE_MUST_BE_A_DECIMAL_WITH_UP_TO_2_DECIMAL_PLACES)
        .custom((value) => {
        if (parseFloat(String(value)) < 0)
            throw new Error(validation_keys_1.VALIDATION_KEYS.FARE_CANNOT_BE_NEGATIVE);
        return true;
    }),
    (0, express_validator_1.body)('departure_time')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.DEPARTURE_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME)
        .custom((value) => {
        if (new Date(String(value)) <= new Date())
            throw new Error(validation_keys_1.VALIDATION_KEYS.DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE);
        return true;
    }),
    (0, express_validator_1.body)('arrival_time')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.ARRIVAL_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME),
    (0, express_validator_1.body)('gender_preference')
        .optional()
        .isIn(Object.values(constants_1.GENDER_PREFERENCE)).withMessage(validation_keys_1.VALIDATION_KEYS.GENDER_PREFERENCE_MUST_BE_ONE_OF_ALL_WOMEN_ONLY_MEN_ONLY),
    (0, express_validator_1.body)('driver_instructions')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.DRIVER_INSTRUCTIONS_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!Array.isArray(arr) || !arr.every((item) => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= 1000)) {
            throw new Error(validation_keys_1.VALIDATION_KEYS.EACH_INSTRUCTION_MUST_BE_A_NON_EMPTY_STRING_OF_AT_MOST_1000);
        }
        return true;
    })
        .customSanitizer((arr) => arr.map((s) => s.trim())),
    (0, express_validator_1.body)('additional_instructions')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage(validation_keys_1.VALIDATION_KEYS.ADDITIONAL_INSTRUCTIONS_MUST_BE_AT_MOST_1000_CHARACTERS),
    (0, express_validator_1.body)('attributes')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.ATTRIBUTES_MUST_BE_AN_ARRAY),
    (0, express_validator_1.body)('attributes.*.attr_key')
        .optional()
        .isIn(TRIP_ATTR_KEYS).withMessage(validation_keys_1.VALIDATION_KEYS.ATTRIBUTE_KEY_MUST_BE_ONE_OF_SMOKING_ALLOWED_WOMEN_ONLY_AC_PETS),
    (0, express_validator_1.body)('attributes.*.attr_value')
        .optional()
        .isIn(['true', 'false', 'yes', 'no']).withMessage(validation_keys_1.VALIDATION_KEYS.ATTRIBUTE_VALUE_MUST_BE_TRUE_FALSE_YES_NO),
    (0, express_validator_1.body)('stops')
        .optional()
        .isArray().withMessage(validation_keys_1.VALIDATION_KEYS.STOPS_MUST_BE_AN_ARRAY),
    (0, express_validator_1.body)('stops.*.city')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.STOP_CITY_MUST_BE_AT_MOST_100_CHARACTERS),
    (0, express_validator_1.body)('stops.*.address')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage(validation_keys_1.VALIDATION_KEYS.STOP_ADDRESS_MUST_BE_AT_MOST_255_CHARACTERS),
    (0, express_validator_1.body)('stops.*.lat')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.STOP_LATITUDE_MUST_BE_A_DECIMAL),
    (0, express_validator_1.body)('stops.*.lng')
        .optional()
        .isDecimal().withMessage(validation_keys_1.VALIDATION_KEYS.STOP_LONGITUDE_MUST_BE_A_DECIMAL),
    (0, express_validator_1.body)('stops.*.stop_type')
        .optional()
        .isIn(['pickup', 'dropoff', 'both']).withMessage(validation_keys_1.VALIDATION_KEYS.STOP_TYPE_MUST_BE_PICKUP_DROPOFF_OR_BOTH),
    (0, express_validator_1.body)('stops.*.stop_order')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.STOP_ORDER_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.body)('stops.*.estimated_arrival')
        .optional()
        .isISO8601().withMessage(validation_keys_1.VALIDATION_KEYS.ESTIMATED_ARRIVAL_MUST_BE_A_VALID_ISO_8601_DATETIME),
];
exports.cancelTripValidation = [
    (0, express_validator_1.param)('trip_id').isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('reason')
        .trim()
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.CANCELLATION_REASON_IS_REQUIRED)
        .isLength({ max: 500 }).withMessage(validation_keys_1.VALIDATION_KEYS.REASON_MUST_BE_AT_MOST_500_CHARACTERS),
    (0, express_validator_1.body)('note')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage(validation_keys_1.VALIDATION_KEYS.NOTE_MUST_BE_AT_MOST_500_CHARACTERS),
];
const _exported = { createTripValidation: exports.createTripValidation, searchAvailableTripsValidation: exports.searchAvailableTripsValidation, lockSeatValidation: exports.lockSeatValidation, releaseSeatLockValidation: exports.releaseSeatLockValidation, updateTripValidation: exports.updateTripValidation, tripParamValidation: exports.tripParamValidation, tripPassengersValidation: exports.tripPassengersValidation, cancelTripValidation: exports.cancelTripValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { createTripValidation: exports.createTripValidation, searchAvailableTripsValidation: exports.searchAvailableTripsValidation, lockSeatValidation: exports.lockSeatValidation, releaseSeatLockValidation: exports.releaseSeatLockValidation, updateTripValidation: exports.updateTripValidation, tripParamValidation: exports.tripParamValidation, tripPassengersValidation: exports.tripPassengersValidation, cancelTripValidation: exports.cancelTripValidation };
    // @ts-ignore
    module.exports.createTripValidation = exports.createTripValidation;
    // @ts-ignore
    module.exports.searchAvailableTripsValidation = exports.searchAvailableTripsValidation;
    // @ts-ignore
    module.exports.lockSeatValidation = exports.lockSeatValidation;
    // @ts-ignore
    module.exports.releaseSeatLockValidation = exports.releaseSeatLockValidation;
    // @ts-ignore
    module.exports.updateTripValidation = exports.updateTripValidation;
    // @ts-ignore
    module.exports.tripParamValidation = exports.tripParamValidation;
    // @ts-ignore
    module.exports.tripPassengersValidation = exports.tripPassengersValidation;
    // @ts-ignore
    module.exports.cancelTripValidation = exports.cancelTripValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=tripValidator.js.map