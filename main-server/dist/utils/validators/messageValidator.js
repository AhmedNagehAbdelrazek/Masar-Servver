"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketMessagesValidation = exports.bookingMessagesValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
const paginationQuery = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
    (0, express_validator_1.query)('before_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.default.BEFORE_ID_MUST_BE_A_VALID_UUID),
];
exports.bookingMessagesValidation = [
    (0, express_validator_1.param)('bookingId')
        .isUUID().withMessage(validation_keys_1.default.BOOKING_ID_MUST_BE_A_VALID_UUID),
    ...paginationQuery,
];
exports.ticketMessagesValidation = [
    (0, express_validator_1.param)('ticketId')
        .isUUID().withMessage(validation_keys_1.default.TICKET_ID_MUST_BE_A_VALID_UUID),
    ...paginationQuery,
];
const _exported = { bookingMessagesValidation: exports.bookingMessagesValidation, ticketMessagesValidation: exports.ticketMessagesValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { bookingMessagesValidation: exports.bookingMessagesValidation, ticketMessagesValidation: exports.ticketMessagesValidation };
    // @ts-ignore
    module.exports.bookingMessagesValidation = exports.bookingMessagesValidation;
    // @ts-ignore
    module.exports.ticketMessagesValidation = exports.ticketMessagesValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=messageValidator.js.map