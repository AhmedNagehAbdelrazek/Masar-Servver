const { body, param, query } = require('express-validator');
const { TICKET_STATUS, TICKET_PRIORITY } = require('../../config/constants');
const V = require('../../config/messages/validation-keys');

const ticketParamValidation = [
  param('ticket_id')
    .isUUID().withMessage(V.TICKET_ID_MUST_BE_A_VALID_UUID),
];

const createTicketValidation = [
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

const listTicketsValidation = [
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

const updateTicketValidation = [
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

const updateTicketStatusValidation = [
  ...ticketParamValidation,
  body('status')
    .notEmpty().withMessage(V.STATUS_IS_REQUIRED_2)
    .isIn(Object.values(TICKET_STATUS)).withMessage(V.STATUS_MUST_BE_ONE_OF_OPEN_IN_PROGRESS_RESOLVED_CLOSED),
];

const addMessageValidation = [
  ...ticketParamValidation,
  body('message')
    .notEmpty().withMessage(V.MESSAGE_IS_REQUIRED)
    .isString().trim().isLength({ max: 4000 }).withMessage(V.MESSAGE_MUST_BE_AT_MOST_4000_CHARACTERS),
];

module.exports = {
  ticketParamValidation,
  createTicketValidation,
  listTicketsValidation,
  updateTicketValidation,
  updateTicketStatusValidation,
  addMessageValidation,
};
