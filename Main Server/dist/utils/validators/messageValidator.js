"use strict";
const { param, query } = require('express-validator');
const V = require('../../config/messages/validation-keys');
const paginationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
    query('before_id')
        .optional()
        .isUUID().withMessage(V.BEFORE_ID_MUST_BE_A_VALID_UUID),
];
const bookingMessagesValidation = [
    param('bookingId')
        .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
    ...paginationQuery,
];
const ticketMessagesValidation = [
    param('ticketId')
        .isUUID().withMessage(V.TICKET_ID_MUST_BE_A_VALID_UUID),
    ...paginationQuery,
];
module.exports = { bookingMessagesValidation, ticketMessagesValidation };
//# sourceMappingURL=messageValidator.js.map