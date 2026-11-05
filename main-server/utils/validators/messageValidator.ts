import { param, query, ValidationChain } from 'express-validator';
import V from '../../config/messages/validation-keys';

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

export const bookingMessagesValidation: ValidationChain[] = [
  param('bookingId')
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID),
  ...paginationQuery,
];

export const ticketMessagesValidation: ValidationChain[] = [
  param('ticketId')
    .isUUID().withMessage(V.TICKET_ID_MUST_BE_A_VALID_UUID),
  ...paginationQuery,
];




const _exported = { bookingMessagesValidation, ticketMessagesValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { bookingMessagesValidation, ticketMessagesValidation };
  // @ts-ignore
  module.exports.bookingMessagesValidation = bookingMessagesValidation;
  // @ts-ignore
  module.exports.ticketMessagesValidation = ticketMessagesValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
