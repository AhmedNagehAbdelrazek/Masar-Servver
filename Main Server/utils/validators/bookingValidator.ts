import { body, query, param, ValidationChain } from 'express-validator';
import { BOOKING_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';
import { hasTimezoneOffset } from '../time';

export const bookingListValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(Object.values(BOOKING_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_CONFIRMED_CANCELLED_COMPLETED_NO_SHOW),
  query('date_from')
    .optional()
    .isISO8601().withMessage(V.DATE_FROM_MUST_BE_A_VALID_ISO_8601_DATE),
  query('date_to')
    .optional()
    .isISO8601().withMessage(V.DATE_TO_MUST_BE_A_VALID_ISO_8601_DATE),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const bookingParamValidation: ValidationChain[] = [
  param('booking_id')
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
];

export const createBookingValidation: ValidationChain[] = [
  body('trip_id')
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
  body('seat_number')
    .optional()
    .isInt({ min: 1 }).withMessage(V.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
  body('seat_numbers')
    .optional()
    .isArray({ min: 1 }).withMessage(V.SEAT_NUMBERS_MUST_BE_A_NON_EMPTY_ARRAY)
    .custom((value: unknown) => {
      if (!Array.isArray(value) || !(value as unknown[]).every((n) => Number.isInteger(Number(n)) && Number(n) >= 1)) {
        throw new Error(V.SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS);
      }
      return true;
    }),
  body('seats')
    .optional()
    .isInt({ min: 1 }).withMessage(V.SEATS_MUST_BE_POSITIVE_INTEGER),
  // pickup_point: allow UUID referencing TripStop OR object with name+lat/lng created at booking time
  body('pickup_point')
    .optional()
    .custom((value: unknown) => {
      if (value == null) return true;
      if (typeof value === 'string') {
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value))) throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
        return true;
      }
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const name = obj.name ?? obj.stop_name;
        if (name != null && String(name).trim().length > 120) throw new Error(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS);
        const lat = obj.lat ?? obj.stop_lat;
        if (lat != null && isNaN(parseFloat(String(lat)))) throw new Error(V.STOP_LATITUDE_MUST_BE_A_DECIMAL);
        const lng = obj.lng ?? obj.stop_lng;
        if (lng != null && isNaN(parseFloat(String(lng)))) throw new Error(V.STOP_LONGITUDE_MUST_BE_A_DECIMAL);
        if (lat != null) {
          const n = parseFloat(String(lat));
          if (n < -90 || n > 90) throw new Error(V.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90);
        }
        if (lng != null) {
          const n = parseFloat(String(lng));
          if (n < -180 || n > 180) throw new Error(V.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180);
        }
        return true;
      }
      throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
  body('pickup_point.name')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('pickup_point.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(V.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
  body('pickup_point.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(V.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
  body('pick_up_point')
    .optional()
    .custom((value: unknown) => {
      if (value == null) return true;
      if (typeof value === 'string') {
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value))) throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
        return true;
      }
      if (typeof value === 'object') return true;
      throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
  // drop_off_point: allow UUID or object with name+lat/lng
  body('drop_off_point')
    .optional()
    .custom((value: unknown) => {
      if (value == null) return true;
      if (typeof value === 'string') {
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value))) throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
        return true;
      }
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const lat = obj.lat ?? obj.stop_lat;
        const lng = obj.lng ?? obj.stop_lng;
        if (lat != null && isNaN(parseFloat(String(lat)))) throw new Error(V.STOP_LATITUDE_MUST_BE_A_DECIMAL);
        if (lng != null && isNaN(parseFloat(String(lng)))) throw new Error(V.STOP_LONGITUDE_MUST_BE_A_DECIMAL);
        return true;
      }
      throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
  body('drop_off_point.name')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('drop_off_point.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(V.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
  body('drop_off_point.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(V.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
  // alternative explicit objects: pickup {name, lat, lng} and dropoff/dropOff
  body('pickup')
    .optional()
    .isObject().withMessage(V.STOPS_MUST_BE_AN_ARRAY),
  body('pickup.name')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('pickup.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(V.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
  body('pickup.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(V.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
  body('dropoff')
    .optional()
    .isObject().withMessage(V.STOPS_MUST_BE_AN_ARRAY),
  body('dropoff.name')
    .optional()
    .trim()
    .isLength({ max: 120 }).withMessage(V.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
  body('dropoff.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage(V.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
  body('dropoff.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage(V.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
  body('dropoff_point')
    .optional()
    .custom((value: unknown) => {
      if (value == null) return true;
      if (typeof value === 'string') {
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value))) throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
        return true;
      }
      if (typeof value === 'object') return true;
      throw new Error(V.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
  body('agreed_fare')
    .notEmpty().withMessage(V.AGREED_FARE_IS_REQUIRED)
    .isFloat({ min: 0 }).withMessage(V.AGREED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
  body('dropoff_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage(V.DROPOFF_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
  body('dropoff_deadline')
    .optional()
    .isISO8601().withMessage(V.DROPOFF_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME)
    .custom((value: unknown) => {
      if (!hasTimezoneOffset(value)) throw new Error(V.DATETIME_MUST_INCLUDE_TIMEZONE);
      return true;
    }),
];

export const passengerBookingListValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(Object.values(BOOKING_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_PENDING_CONFIRMED_CANCELLED_COMPLETED_NO_SHOW),
  query('trip_id')
    .optional()
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID_2),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const cancelBookingValidation: ValidationChain[] = [
  param('booking_id')
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
];

export const delayParamValidation: ValidationChain[] = [
  param('booking_id')
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
];

export const reportDelayValidation: ValidationChain[] = [
  ...delayParamValidation,
  body('party')
    .notEmpty().withMessage(V.PARTY_IS_REQUIRED)
    .isIn(['driver', 'passenger']).withMessage(V.PARTY_MUST_BE_DRIVER_OR_PASSENGER),
  body('delay_minutes')
    .notEmpty().withMessage(V.DELAY_MINUTES_IS_REQUIRED)
    .isInt({ min: 1, max: 720 }).withMessage(V.DELAY_MINUTES_MUST_BE_AN_INTEGER_BETWEEN_1_AND_720),
  body('reason')
    .optional()
    .isString().trim().isLength({ max: 1000 }).withMessage(V.REASON_MUST_BE_AT_MOST_1000_CHARACTERS),
];

export const delayListValidation: ValidationChain[] = [
  ...delayParamValidation,
  query('party')
    .optional()
    .isIn(['driver', 'passenger']).withMessage(V.PARTY_MUST_BE_DRIVER_OR_PASSENGER),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];




const _exported = { bookingListValidation, bookingParamValidation, createBookingValidation, passengerBookingListValidation, cancelBookingValidation, delayParamValidation, reportDelayValidation, delayListValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { bookingListValidation, bookingParamValidation, createBookingValidation, passengerBookingListValidation, cancelBookingValidation, delayParamValidation, reportDelayValidation, delayListValidation };
  // @ts-ignore
  module.exports.bookingListValidation = bookingListValidation;
  // @ts-ignore
  module.exports.bookingParamValidation = bookingParamValidation;
  // @ts-ignore
  module.exports.createBookingValidation = createBookingValidation;
  // @ts-ignore
  module.exports.passengerBookingListValidation = passengerBookingListValidation;
  // @ts-ignore
  module.exports.cancelBookingValidation = cancelBookingValidation;
  // @ts-ignore
  module.exports.delayParamValidation = delayParamValidation;
  // @ts-ignore
  module.exports.reportDelayValidation = reportDelayValidation;
  // @ts-ignore
  module.exports.delayListValidation = delayListValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
