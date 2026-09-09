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
    (0, express_validator_1.body)('seat_numbers')
        .optional()
        .isArray({ min: 1 }).withMessage(validation_keys_1.default.SEAT_NUMBERS_MUST_BE_A_NON_EMPTY_ARRAY)
        .custom((value) => {
        if (!Array.isArray(value) || !value.every((n) => Number.isInteger(Number(n)) && Number(n) >= 1)) {
            throw new Error(validation_keys_1.default.SEAT_NUMBERS_MUST_BE_POSITIVE_INTEGERS);
        }
        return true;
    }),
    (0, express_validator_1.body)('seats')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.SEATS_MUST_BE_POSITIVE_INTEGER),
    // pickup_point: allow UUID referencing TripStop OR object with name+lat/lng created at booking time
    (0, express_validator_1.body)('pickup_point')
        .optional()
        .custom((value) => {
        if (value == null)
            return true;
        if (typeof value === 'string') {
            if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value)))
                throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
            return true;
        }
        if (typeof value === 'object') {
            const obj = value;
            const name = obj.name ?? obj.stop_name;
            if (name != null && String(name).trim().length > 120)
                throw new Error(validation_keys_1.default.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS);
            const lat = obj.lat ?? obj.stop_lat;
            if (lat != null && isNaN(parseFloat(String(lat))))
                throw new Error(validation_keys_1.default.STOP_LATITUDE_MUST_BE_A_DECIMAL);
            const lng = obj.lng ?? obj.stop_lng;
            if (lng != null && isNaN(parseFloat(String(lng))))
                throw new Error(validation_keys_1.default.STOP_LONGITUDE_MUST_BE_A_DECIMAL);
            if (lat != null) {
                const n = parseFloat(String(lat));
                if (n < -90 || n > 90)
                    throw new Error(validation_keys_1.default.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90);
            }
            if (lng != null) {
                const n = parseFloat(String(lng));
                if (n < -180 || n > 180)
                    throw new Error(validation_keys_1.default.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180);
            }
            return true;
        }
        throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
    (0, express_validator_1.body)('pickup_point.name')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.default.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('pickup_point.lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage(validation_keys_1.default.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
    (0, express_validator_1.body)('pickup_point.lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage(validation_keys_1.default.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
    (0, express_validator_1.body)('pick_up_point')
        .optional()
        .custom((value) => {
        if (value == null)
            return true;
        if (typeof value === 'string') {
            if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value)))
                throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
            return true;
        }
        if (typeof value === 'object')
            return true;
        throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
    // drop_off_point: allow UUID or object with name+lat/lng
    (0, express_validator_1.body)('drop_off_point')
        .optional()
        .custom((value) => {
        if (value == null)
            return true;
        if (typeof value === 'string') {
            if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value)))
                throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
            return true;
        }
        if (typeof value === 'object') {
            const obj = value;
            const lat = obj.lat ?? obj.stop_lat;
            const lng = obj.lng ?? obj.stop_lng;
            if (lat != null && isNaN(parseFloat(String(lat))))
                throw new Error(validation_keys_1.default.STOP_LATITUDE_MUST_BE_A_DECIMAL);
            if (lng != null && isNaN(parseFloat(String(lng))))
                throw new Error(validation_keys_1.default.STOP_LONGITUDE_MUST_BE_A_DECIMAL);
            return true;
        }
        throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
    (0, express_validator_1.body)('drop_off_point.name')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.default.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('drop_off_point.lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage(validation_keys_1.default.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
    (0, express_validator_1.body)('drop_off_point.lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage(validation_keys_1.default.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
    // alternative explicit objects: pickup {name, lat, lng} and dropoff/dropOff
    (0, express_validator_1.body)('pickup')
        .optional()
        .isObject().withMessage(validation_keys_1.default.STOPS_MUST_BE_AN_ARRAY),
    (0, express_validator_1.body)('pickup.name')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.default.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('pickup.lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage(validation_keys_1.default.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
    (0, express_validator_1.body)('pickup.lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage(validation_keys_1.default.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
    (0, express_validator_1.body)('dropoff')
        .optional()
        .isObject().withMessage(validation_keys_1.default.STOPS_MUST_BE_AN_ARRAY),
    (0, express_validator_1.body)('dropoff.name')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage(validation_keys_1.default.STOP_NAME_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('dropoff.lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage(validation_keys_1.default.ORIGIN_LATITUDE_MUST_BE_BETWEEN_90_AND_90),
    (0, express_validator_1.body)('dropoff.lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage(validation_keys_1.default.ORIGIN_LONGITUDE_MUST_BE_BETWEEN_180_AND_180),
    (0, express_validator_1.body)('dropoff_point')
        .optional()
        .custom((value) => {
        if (value == null)
            return true;
        if (typeof value === 'string') {
            if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value)))
                throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
            return true;
        }
        if (typeof value === 'object')
            return true;
        throw new Error(validation_keys_1.default.TRIP_ID_MUST_BE_A_VALID_UUID);
    }),
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