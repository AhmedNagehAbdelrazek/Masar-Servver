import { body, query, param, ValidationChain } from 'express-validator';
import { BOOKING_STATUS } from '../../config/constants';
import V from '../../config/messages/validation-keys';

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
  body('seats')
    .optional()
    .isInt({ min: 1 }).withMessage(V.SEATS_MUST_BE_POSITIVE_INTEGER),
  body('drop_off_point')
    .optional()
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID),
  body('agreed_fare')
    .notEmpty().withMessage(V.AGREED_FARE_IS_REQUIRED)
    .isFloat({ min: 0 }).withMessage(V.AGREED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
  body('dropoff_place')
    .optional()
    .isString().trim().isLength({ max: 255 }).withMessage(V.DROPOFF_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
  body('dropoff_deadline')
    .optional()
    .isISO8601().withMessage(V.DROPOFF_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME),
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
