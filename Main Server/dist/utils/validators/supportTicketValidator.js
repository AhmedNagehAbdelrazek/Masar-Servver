"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMessageValidation = exports.updateTicketStatusValidation = exports.updateTicketValidation = exports.listTicketsValidation = exports.createTicketValidation = exports.ticketParamValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = require("../../config/messages/validation-keys");
exports.ticketParamValidation = [
    (0, express_validator_1.param)('ticket_id')
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TICKET_ID_MUST_BE_A_VALID_UUID),
];
exports.createTicketValidation = [
    (0, express_validator_1.body)('category')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.CATEGORY_IS_REQUIRED_2)
        .isString().trim().isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.CATEGORY_MUST_BE_AT_MOST_50_CHARACTERS),
    (0, express_validator_1.body)('subject')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.SUBJECT_IS_REQUIRED)
        .isString().trim().isLength({ max: 150 }).withMessage(validation_keys_1.VALIDATION_KEYS.SUBJECT_MUST_BE_AT_MOST_150_CHARACTERS),
    (0, express_validator_1.body)('description')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.DESCRIPTION_IS_REQUIRED_2)
        .isString().trim().isLength({ max: 5000 }).withMessage(validation_keys_1.VALIDATION_KEYS.DESCRIPTION_MUST_BE_AT_MOST_5000_CHARACTERS),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(Object.values(constants_1.TICKET_PRIORITY)).withMessage(validation_keys_1.VALIDATION_KEYS.PRIORITY_MUST_BE_ONE_OF_LOW_MEDIUM_HIGH_URGENT),
    (0, express_validator_1.body)('booking_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.BOOKING_ID_MUST_BE_A_VALID_UUID_2),
    (0, express_validator_1.body)('trip_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.TRIP_ID_MUST_BE_A_VALID_UUID_2),
];
exports.listTicketsValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.TICKET_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_OPEN_IN_PROGRESS_RESOLVED_CLOSED),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(Object.values(constants_1.TICKET_PRIORITY)).withMessage(validation_keys_1.VALIDATION_KEYS.PRIORITY_MUST_BE_ONE_OF_LOW_MEDIUM_HIGH_URGENT),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.VALIDATION_KEYS.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.VALIDATION_KEYS.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.updateTicketValidation = [
    ...exports.ticketParamValidation,
    (0, express_validator_1.body)('assigned_to')
        .optional()
        .isUUID().withMessage(validation_keys_1.VALIDATION_KEYS.ASSIGNED_TO_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(Object.values(constants_1.TICKET_PRIORITY)).withMessage(validation_keys_1.VALIDATION_KEYS.PRIORITY_MUST_BE_ONE_OF_LOW_MEDIUM_HIGH_URGENT),
    (0, express_validator_1.body)('category')
        .optional()
        .isString().trim().isLength({ max: 50 }).withMessage(validation_keys_1.VALIDATION_KEYS.CATEGORY_MUST_BE_AT_MOST_50_CHARACTERS),
    (0, express_validator_1.body)('resolution_notes')
        .optional()
        .isString().trim().isLength({ max: 4000 }).withMessage(validation_keys_1.VALIDATION_KEYS.RESOLUTION_NOTES_MUST_BE_AT_MOST_4000_CHARACTERS),
];
exports.updateTicketStatusValidation = [
    ...exports.ticketParamValidation,
    (0, express_validator_1.body)('status')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_IS_REQUIRED_2)
        .isIn(Object.values(constants_1.TICKET_STATUS)).withMessage(validation_keys_1.VALIDATION_KEYS.STATUS_MUST_BE_ONE_OF_OPEN_IN_PROGRESS_RESOLVED_CLOSED),
];
exports.addMessageValidation = [
    ...exports.ticketParamValidation,
    (0, express_validator_1.body)('message')
        .notEmpty().withMessage(validation_keys_1.VALIDATION_KEYS.MESSAGE_IS_REQUIRED)
        .isString().trim().isLength({ max: 4000 }).withMessage(validation_keys_1.VALIDATION_KEYS.MESSAGE_MUST_BE_AT_MOST_4000_CHARACTERS),
];
const _exported = { ticketParamValidation: exports.ticketParamValidation, createTicketValidation: exports.createTicketValidation, listTicketsValidation: exports.listTicketsValidation, updateTicketValidation: exports.updateTicketValidation, updateTicketStatusValidation: exports.updateTicketStatusValidation, addMessageValidation: exports.addMessageValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { ticketParamValidation: exports.ticketParamValidation, createTicketValidation: exports.createTicketValidation, listTicketsValidation: exports.listTicketsValidation, updateTicketValidation: exports.updateTicketValidation, updateTicketStatusValidation: exports.updateTicketStatusValidation, addMessageValidation: exports.addMessageValidation };
    // @ts-ignore
    module.exports.ticketParamValidation = exports.ticketParamValidation;
    // @ts-ignore
    module.exports.createTicketValidation = exports.createTicketValidation;
    // @ts-ignore
    module.exports.listTicketsValidation = exports.listTicketsValidation;
    // @ts-ignore
    module.exports.updateTicketValidation = exports.updateTicketValidation;
    // @ts-ignore
    module.exports.updateTicketStatusValidation = exports.updateTicketStatusValidation;
    // @ts-ignore
    module.exports.addMessageValidation = exports.addMessageValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=supportTicketValidator.js.map