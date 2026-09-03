import { body, param, query, ValidationChain } from 'express-validator';
import { TICKET_STATUS, TICKET_PRIORITY } from '../../config/constants';
import V from '../../config/messages/validation-keys';

export const ticketParamValidation: ValidationChain[] = [
  param('ticket_id')
    .isUUID().withMessage(V.TICKET_ID_MUST_BE_A_VALID_UUID),
];

export const createTicketValidation: ValidationChain[] = [
  body('category')
    .notEmpty().withMessage(V.CATEGORY_IS_REQUIRED_2)
    .isString().trim().isLength({ max: 50 }).withMessage(V.CATEGORY_MUST_BE_AT_MOST_50_CHARACTERS),
  body('subject')
    .notEmpty().withMessage(V.SUBJECT_IS_REQUIRED)
    .isString().trim().isLength({ max: 150 }).withMessage(V.SUBJECT_MUST_BE_AT_MOST_150_CHARACTERS),
  body('description')
    .notEmpty().withMessage(V.DESCRIPTION_IS_REQUIRED_2)
    .isString().trim().isLength({ max: 5000 }).withMessage(V.DESCRIPTION_MUST_BE_AT_MOST_5000_CHARACTERS),
  body('priority')
    .optional()
    .isIn(Object.values(TICKET_PRIORITY)).withMessage(V.PRIORITY_MUST_BE_ONE_OF_LOW_MEDIUM_HIGH_URGENT),
  body('booking_id')
    .optional()
    .isUUID().withMessage(V.BOOKING_ID_MUST_BE_A_VALID_UUID_2),
  body('trip_id')
    .optional()
    .isUUID().withMessage(V.TRIP_ID_MUST_BE_A_VALID_UUID_2),
];

export const listTicketsValidation: ValidationChain[] = [
  query('status')
    .optional()
    .isIn(Object.values(TICKET_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_OPEN_IN_PROGRESS_RESOLVED_CLOSED),
  query('priority')
    .optional()
    .isIn(Object.values(TICKET_PRIORITY)).withMessage(V.PRIORITY_MUST_BE_ONE_OF_LOW_MEDIUM_HIGH_URGENT),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage(V.PAGE_MUST_BE_A_POSITIVE_INTEGER),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage(V.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];

export const updateTicketValidation: ValidationChain[] = [
  ...ticketParamValidation,
  body('assigned_to')
    .optional()
    .isUUID().withMessage(V.ASSIGNED_TO_MUST_BE_A_VALID_UUID),
  body('priority')
    .optional()
    .isIn(Object.values(TICKET_PRIORITY)).withMessage(V.PRIORITY_MUST_BE_ONE_OF_LOW_MEDIUM_HIGH_URGENT),
  body('category')
    .optional()
    .isString().trim().isLength({ max: 50 }).withMessage(V.CATEGORY_MUST_BE_AT_MOST_50_CHARACTERS),
  body('resolution_notes')
    .optional()
    .isString().trim().isLength({ max: 4000 }).withMessage(V.RESOLUTION_NOTES_MUST_BE_AT_MOST_4000_CHARACTERS),
];

export const updateTicketStatusValidation: ValidationChain[] = [
  ...ticketParamValidation,
  body('status')
    .notEmpty().withMessage(V.STATUS_IS_REQUIRED_2)
    .isIn(Object.values(TICKET_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_OPEN_IN_PROGRESS_RESOLVED_CLOSED),
];

export const addMessageValidation: ValidationChain[] = [
  ...ticketParamValidation,
  body('message')
    .notEmpty().withMessage(V.MESSAGE_IS_REQUIRED)
    .isString().trim().isLength({ max: 4000 }).withMessage(V.MESSAGE_MUST_BE_AT_MOST_4000_CHARACTERS),
];




const _exported = { ticketParamValidation, createTicketValidation, listTicketsValidation, updateTicketValidation, updateTicketStatusValidation, addMessageValidation };
export default _exported;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { ticketParamValidation, createTicketValidation, listTicketsValidation, updateTicketValidation, updateTicketStatusValidation, addMessageValidation };
  // @ts-ignore
  module.exports.ticketParamValidation = ticketParamValidation;
  // @ts-ignore
  module.exports.createTicketValidation = createTicketValidation;
  // @ts-ignore
  module.exports.listTicketsValidation = listTicketsValidation;
  // @ts-ignore
  module.exports.updateTicketValidation = updateTicketValidation;
  // @ts-ignore
  module.exports.updateTicketStatusValidation = updateTicketStatusValidation;
  // @ts-ignore
  module.exports.addMessageValidation = addMessageValidation;
  // @ts-ignore
  module.exports.default = _exported;
}
