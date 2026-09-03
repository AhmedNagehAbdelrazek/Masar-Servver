"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayListValidation = exports.reportDelayValidation = exports.delayParamValidation = exports.cancelBookingValidation = exports.passengerBookingListValidation = exports.createBookingValidation = exports.bookingParamValidation = exports.bookingListValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.bookingListValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.BOOKING_STATUS)).withMessage(validation_keys_1.default.STATUS_MUST_BE_ONE_OF_PENDING_CONFIRMED_CANCELLED_COMPLETED_NO_SHOW),
    (0, express_validator_1.query)('date_from')
        .optional()
        .isISO8601().withMessage(validation_keys_1.default.DATE_FROM_MUST_BE_A_VALID_ISO_8601_DATE),
    (0, express_validator_1.query)('date_to')
        .optional()
        .isISO8601().withMessage(validation_keys_1.default.DATE_TO_MUST_BE_A_VALID_ISO_8601_DATE),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.bookingParamValidation = [
    (0, express_validator_1.param)('booking_id')
        .isUUID().withMessage(validation_keys_1.default.BOOKING_ID_MUST_BE_A_VALID_UUID),
];
exports.createBookingValidation = [
    (0, express_validator_1.body)('trip_id')
        .isUUID().withMessage(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('seat_number')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.SEAT_NUMBER_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.body)('seats')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.SEATS_MUST_BE_POSITIVE_INTEGER),
    (0, express_validator_1.body)('drop_off_point')
        .optional()
        .isUUID().withMessage(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('agreed_fare')
        .notEmpty().withMessage(validation_keys_1.default.AGREED_FARE_IS_REQUIRED)
        .isFloat({ min: 0 }).withMessage(validation_keys_1.default.AGREED_FARE_MUST_BE_A_NON_NEGATIVE_NUMBER),
    (0, express_validator_1.body)('dropoff_place')
        .optional()
        .isString().trim().isLength({ max: 255 }).withMessage(validation_keys_1.default.DROPOFF_PLACE_MUST_BE_AT_MOST_255_CHARACTERS),
    (0, express_validator_1.body)('dropoff_deadline')
        .optional()
        .isISO8601().withMessage(validation_keys_1.default.DROPOFF_DEADLINE_MUST_BE_A_VALID_ISO_8601_DATETIME),
];
exports.passengerBookingListValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.BOOKING_STATUS)).withMessage(validation_keys_1.default.STATUS_MUST_BE_ONE_OF_PENDING_CONFIRMED_CANCELLED_COMPLETED_NO_SHOW),
    (0, express_validator_1.query)('trip_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID_2),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.cancelBookingValidation = [
    (0, express_validator_1.param)('booking_id')
        .isUUID().withMessage(validation_keys_1.default.BOOKING_ID_MUST_BE_A_VALID_UUID),
];
exports.delayParamValidation = [
    (0, express_validator_1.param)('booking_id')
        .isUUID().withMessage(validation_keys_1.default.BOOKING_ID_MUST_BE_A_VALID_UUID),
];
exports.reportDelayValidation = [
    ...exports.delayParamValidation,
    (0, express_validator_1.body)('party')
        .notEmpty().withMessage(validation_keys_1.default.PARTY_IS_REQUIRED)
        .isIn(['driver', 'passenger']).withMessage(validation_keys_1.default.PARTY_MUST_BE_DRIVER_OR_PASSENGER),
    (0, express_validator_1.body)('delay_minutes')
        .notEmpty().withMessage(validation_keys_1.default.DELAY_MINUTES_IS_REQUIRED)
        .isInt({ min: 1, max: 720 }).withMessage(validation_keys_1.default.DELAY_MINUTES_MUST_BE_AN_INTEGER_BETWEEN_1_AND_720),
    (0, express_validator_1.body)('reason')
        .optional()
        .isString().trim().isLength({ max: 1000 }).withMessage(validation_keys_1.default.REASON_MUST_BE_AT_MOST_1000_CHARACTERS),
];
exports.delayListValidation = [
    ...exports.delayParamValidation,
    (0, express_validator_1.query)('party')
        .optional()
        .isIn(['driver', 'passenger']).withMessage(validation_keys_1.default.PARTY_MUST_BE_DRIVER_OR_PASSENGER),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
const _exported = { bookingListValidation: exports.bookingListValidation, bookingParamValidation: exports.bookingParamValidation, createBookingValidation: exports.createBookingValidation, passengerBookingListValidation: exports.passengerBookingListValidation, cancelBookingValidation: exports.cancelBookingValidation, delayParamValidation: exports.delayParamValidation, reportDelayValidation: exports.reportDelayValidation, delayListValidation: exports.delayListValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { bookingListValidation: exports.bookingListValidation, bookingParamValidation: exports.bookingParamValidation, createBookingValidation: exports.createBookingValidation, passengerBookingListValidation: exports.passengerBookingListValidation, cancelBookingValidation: exports.cancelBookingValidation, delayParamValidation: exports.delayParamValidation, reportDelayValidation: exports.reportDelayValidation, delayListValidation: exports.delayListValidation };
    // @ts-ignore
    module.exports.bookingListValidation = exports.bookingListValidation;
    // @ts-ignore
    module.exports.bookingParamValidation = exports.bookingParamValidation;
    // @ts-ignore
    module.exports.createBookingValidation = exports.createBookingValidation;
    // @ts-ignore
    module.exports.passengerBookingListValidation = exports.passengerBookingListValidation;
    // @ts-ignore
    module.exports.cancelBookingValidation = exports.cancelBookingValidation;
    // @ts-ignore
    module.exports.delayParamValidation = exports.delayParamValidation;
    // @ts-ignore
    module.exports.reportDelayValidation = exports.reportDelayValidation;
    // @ts-ignore
    module.exports.delayListValidation = exports.delayListValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=bookingValidator.js.map