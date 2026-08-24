const { body, param, query } = require('express-validator');
const { TRIP_STATUS, GENDER_PREFERENCE, BOOKING_STATUS } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');

const createTripValidation = [
  body('origin_city')
    .trim()
    .notEmpty().withMessage(V.ORIGIN_CITY_IS_REQUIRED_2)
    .isLength({ max: 100 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_100_CHARACTERS),

  body('origin_area')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.ORIGIN_AREA_MUST_BE_AT_MOST_120_CHARACTERS),

  body('origin_lat')
    .optional()
    .isDecimal().withMessage(V.ORIGIN_LATITUDE_MUST_BE_A_DECIMAL)
    .custom((value) => {
      const lat = parseFloat(value);
      if (lat < -90 || lat > 90) throw new Error(V.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90);
      return true;
    }),

  body('origin_lng')
    .optional()
    .isDecimal().withMessage(V.ORIGIN_LONGITUDE_MUST_BE_A_DECIMAL)
    .custom((value) => {
      const lng = parseFloat(value);
      if (lng < -180 || lng > 180) throw new Error(V.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180);
      return true;
    }),

  body('destination_city')
    .trim()
    .notEmpty().withMessage(V.DESTINATION_CITY_IS_REQUIRED_2)
    .isLength({ max: 100 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_100_CHARACTERS),

  body('destination_area')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.DESTINATION_AREA_MUST_BE_AT_MOST_120_CHARACTERS),

  body('destination_lat')
    .optional()
    .isDecimal().withMessage(V.DESTINATION_LATITUDE_MUST_BE_A_DECIMAL)
    .custom((value) => {
      const lat = parseFloat(value);
      if (lat < -90 || lat > 90) throw new Error(V.DESTINATION_LATITUDE_MUST_BE_BETWEEN_90_AND_90);
      return true;
    }),

  body('destination_lng')
    .optional()
    .isDecimal().withMessage(V.DESTINATION_LONGITUDE_MUST_BE_A_DECIMAL)
    .custom((value) => {
      const lng = parseFloat(value);
      if (lng < -180 || lng > 180) throw new Error(V.DESTINATION_LONGITUDE_MUST_BE_BETWEEN_180_AND_180);
      return true;
    }),

  body('waypoints')
    .optional()
    .isArray().withMessage(V.WAYPOINTS_MUST_BE_AN_ARRAY),
  body('waypoints.*.stop_name')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('waypoints.*.stop_lat')
    .optional()
    .isDecimal().withMessage(V.STOP_LATITUDE_MUST_BE_A_DECIMAL),
  body('waypoints.*.stop_lng')
    .optional()
    .isDecimal().withMessage(V.STOP_LONGITUDE_MUST_BE_A_DECIMAL),

  body('departure_date')
    .notEmpty().withMessage(V.DEPARTURE_DATE_IS_REQUIRED)
    .isDate().withMessage(V.DEPARTURE_DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD)
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error(V.DEPARTURE_DATE_MUST_BE_TODAY_OR_IN_THE_FUTURE);
      return true;
    }),

  body('departure_time')
    .notEmpty().withMessage(V.DEPARTURE_TIME_IS_REQUIRED)
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage(V.DEPARTURE_TIME_MUST_BE_IN_HH_MM_FORMAT),

  body('type_of_trip')
    .notEmpty().withMessage(V.TRIP_TYPE_IS_REQUIRED)
    .isIn(['once', 'repeated']).withMessage(V.TRIP_TYPE_MUST_BE_ONCE_OR_REPEATED),

  body('repeated_days')
    .if(body('type_of_trip').equals('repeated'))
    .notEmpty().withMessage(V.REPEATED_DAYS_ARE_REQUIRED_FOR_RECURRING_TRIPS)
    .isArray({ min: 1 }).withMessage(V.AT_LEAST_ONE_DAY_MUST_BE_SELECTED)
    .custom((days) => {
      if (!days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
        throw new Error(V.REPEATED_DAYS_MUST_BE_INTEGERS_BETWEEN_0_SUNDAY_AND_6_SATURDAY);
      }
      return true;
    }),

  body('repeated_end_date')
    .if(body('type_of_trip').equals('repeated'))
    .notEmpty().withMessage(V.END_DATE_IS_REQUIRED_FOR_RECURRING_TRIPS)
    .isDate().withMessage(V.END_DATE_MUST_BE_A_VALID_DATE)
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.departure_date);
      if (endDate <= startDate) throw new Error(V.END_DATE_MUST_BE_AFTER_DEPARTURE_DATE);
      return true;
    }),

  body('allowed_type')
    .optional()
    .isIn(Object.values(GENDER_PREFERENCE)).withMessage(V.ALLOWED_TYPE_MUST_BE_ONE_OF_ALL_WOMEN_ONLY_MEN_ONLY),

  body('fare_per_seat')
    .notEmpty().withMessage(V.FARE_PER_SEAT_IS_REQUIRED)
    .isDecimal({ decimal_digits: '1,2' }).withMessage(V.FARE_MUST_BE_A_DECIMAL_WITH_UP_TO_2_DECIMAL_PLACES)
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error(V.FARE_CANNOT_BE_NEGATIVE);
      return true;
    }),

  body('seats')
    .notEmpty().withMessage(V.SEATS_CONFIGURATION_IS_REQUIRED)
    .isArray({ min: 1 }).withMessage(V.AT_LEAST_ONE_SEAT_MUST_BE_CONFIGURED),
  body('seats.*.seat_number')
    .isInt({ min: 1 }).withMessage(V.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
  body('seats.*.type')
    .isIn(['driver', 'available', 'unavailable']).withMessage(V.SEAT_TYPE_MUST_BE_DRIVER_AVAILABLE_OR_UNAVAILABLE),

  body('instructions')
    .optional()
    .isArray({ min: 1 }).withMessage(V.INSTRUCTIONS_MUST_BE_A_NON_EMPTY_ARRAY)
    .custom((arr) => {
      if (!arr.every((item) => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= 1000)) {
        throw new Error(V.EACH_INSTRUCTION_MUST_BE_A_NON_EMPTY_STRING_OF_AT_MOST_1000);
      }
      return true;
    })
    .customSanitizer((arr) => arr.map((s) => s.trim())),

  body('additional_instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage(V.ADDITIONAL_INSTRUCTIONS_MUST_BE_AT_MOST_1000_CHARACTERS),
];

const searchAvailableTripsValidation = [
  query('origin_city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage(V.ORIGIN_CITY_MUST_BE_AT_MOST_100_CHARACTERS),

  query('destination_city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage(V.DESTINATION_CITY_MUST_BE_AT_MOST_100_CHARACTERS),

  query('date')
    .optional()
    .isDate().withMessage(V.DATE_MUST_BE_A_VALID_DATE_YYYY_MM_DD),

  query('gender_preference')
    .optional()
    .isIn(Object.values(GENDER_PREFERENCE)).withMessage(V.GENDER_PREFERENCE_MUST_BE_ONE_OF_ALL_WOMEN_ONLY_MEN_ONLY),
];

const tripParamValidation = [
  param('trip_id')
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
];

const tripPassengersValidation = [
  ...tripParamValidation,
  query('status')
    .optional()
    .isIn(Object.values(BOOKING_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_CONFIRMED_CANCELLED_COMPLETED_NO_SHOW),
];

const lockSeatValidation = [
  param('trip_id')
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
  body('seat_number')
    .notEmpty().withMessage(V.SEAT_NUMBER_IS_REQUIRED)
    .isInt({ min: 1 }).withMessage(V.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
];

const releaseSeatLockValidation = [
  param('trip_id')
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
  param('seat_number')
    .isInt({ min: 1 }).withMessage(V.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
];

const TRIP_ATTR_KEYS = ['smoking_allowed', 'women_only', 'ac', 'pets', 'luggage', 'music'];

const updateTripValidation = [
  param('trip_id')
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),

  body('fare_per_seat')
    .optional()
    .isDecimal({ decimal_digits: '1,2' }).withMessage(V.FARE_MUST_BE_A_DECIMAL_WITH_UP_TO_2_DECIMAL_PLACES)
    .custom((value) => {
      if (parseFloat(value) < 0) throw new Error(V.FARE_CANNOT_BE_NEGATIVE);
      return true;
    }),

  body('departure_time')
    .optional()
    .isISO8601().withMessage(V.DEPARTURE_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME)
    .custom((value) => {
      if (new Date(value) <= new Date()) throw new Error(V.DEPARTURE_TIME_MUST_BE_IN_THE_FUTURE);
      return true;
    }),

  body('arrival_time')
    .optional()
    .isISO8601().withMessage(V.ARRIVAL_TIME_MUST_BE_A_VALID_ISO_8601_DATETIME),

  body('gender_preference')
    .optional()
    .isIn(Object.values(GENDER_PREFERENCE)).withMessage(V.GENDER_PREFERENCE_MUST_BE_ONE_OF_ALL_WOMEN_ONLY_MEN_ONLY),

  body('driver_instructions')
    .optional()
    .isArray().withMessage(V.DRIVER_INSTRUCTIONS_MUST_BE_AN_ARRAY)
    .custom((arr) => {
      if (!arr.every((item) => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= 1000)) {
        throw new Error(V.EACH_INSTRUCTION_MUST_BE_A_NON_EMPTY_STRING_OF_AT_MOST_1000);
      }
      return true;
    })
    .customSanitizer((arr) => arr.map((s) => s.trim())),

  body('additional_instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage(V.ADDITIONAL_INSTRUCTIONS_MUST_BE_AT_MOST_1000_CHARACTERS),

  body('attributes')
    .optional()
    .isArray().withMessage(V.ATTRIBUTES_MUST_BE_AN_ARRAY),
  body('attributes.*.attr_key')
    .optional()
    .isIn(TRIP_ATTR_KEYS).withMessage(V.ATTRIBUTE_KEY_MUST_BE_ONE_OF_SMOKING_ALLOWED_WOMEN_ONLY_AC_PETS),
  body('attributes.*.attr_value')
    .optional()
    .isIn(['true', 'false', 'yes', 'no']).withMessage(V.ATTRIBUTE_VALUE_MUST_BE_TRUE_FALSE_YES_NO),

  body('stops')
    .optional()
    .isArray().withMessage(V.STOPS_MUST_BE_AN_ARRAY),
  body('stops.*.city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage(V.STOP_CITY_MUST_BE_AT_MOST_100_CHARACTERS),
  body('stops.*.address')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage(V.STOP_ADDRESS_MUST_BE_AT_MOST_255_CHARACTERS),
  body('stops.*.lat')
    .optional()
    .isDecimal().withMessage(V.STOP_LATITUDE_MUST_BE_A_DECIMAL),
  body('stops.*.lng')
    .optional()
    .isDecimal().withMessage(V.STOP_LONGITUDE_MUST_BE_A_DECIMAL),
  body('stops.*.stop_type')
    .optional()
    .isIn(['pickup', 'dropoff', 'both']).withMessage(V.STOP_TYPE_MUST_BE_PICKUP_DROPOFF_OR_BOTH),
  body('stops.*.stop_order')
    .optional()
    .isInt({ min: 1 }).withMessage(V.STOP_ORDER_MUST_BE_A_POSITIVE_INTEGER),
  body('stops.*.estimated_arrival')
    .optional()
    .isISO8601().withMessage(V.ESTIMATED_ARRIVAL_MUST_BE_A_VALID_ISO_8601_DATETIME),
];

const cancelTripValidation = [
  param('trip_id').isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
  body('reason')
    .trim()
    .notEmpty().withMessage(V.CANCELLATION_REASON_IS_REQUIRED)
    .isLength({ max: 500 }).withMessage(V.REASON_MUST_BE_AT_MOST_500_CHARACTERS),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage(V.NOTE_MUST_BE_AT_MOST_500_CHARACTERS),
];

module.exports = {
  createTripValidation,
  searchAvailableTripsValidation,
  lockSeatValidation,
  releaseSeatLockValidation,
  updateTripValidation,
  tripParamValidation,
  tripPassengersValidation,
  cancelTripValidation,
};
