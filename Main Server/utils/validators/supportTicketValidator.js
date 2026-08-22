const { body, param, query } = require('express-validator');
const { TICKET_STATUS, TICKET_PRIORITY } = require('../../config/constants');

const ticketParamValidation = [
  param('ticket_id')
    .isUUID().withMessage('Ticket ID must be a valid UUID'),
];

const createTicketValidation = [
  body('category')
    .notEmpty().withMessage('category is required')
    .isString().trim().isLength({ max: 50 }).withMessage('category must be at most 50 characters'),
  body('subject')
    .notEmpty().withMessage('subject is required')
    .isString().trim().isLength({ max: 150 }).withMessage('subject must be at most 150 characters'),
  body('description')
    .notEmpty().withMessage('description is required')
    .isString().trim().isLength({ max: 5000 }).withMessage('description must be at most 5000 characters'),
  body('priority')
    .optional()
    .isIn(Object.values(TICKET_PRIORITY)).withMessage(`priority must be one of: ${Object.values(TICKET_PRIORITY).join(', ')}`),
  body('booking_id')
    .optional()
    .isUUID().withMessage('booking_id must be a valid UUID'),
  body('trip_id')
    .optional()
    .isUUID().withMessage('trip_id must be a valid UUID'),
];

const listTicketsValidation = [
  query('status')
    .optional()
    .isIn(Object.values(TICKET_STATUS)).withMessage(`status must be one of: ${Object.values(TICKET_STATUS).join(', ')}`),
  query('priority')
    .optional()
    .isIn(Object.values(TICKET_PRIORITY)).withMessage(`priority must be one of: ${Object.values(TICKET_PRIORITY).join(', ')}`),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
];

const updateTicketValidation = [
  ...ticketParamValidation,
  body('assigned_to')
    .optional()
    .isUUID().withMessage('assigned_to must be a valid UUID'),
  body('priority')
    .optional()
    .isIn(Object.values(TICKET_PRIORITY)).withMessage(`priority must be one of: ${Object.values(TICKET_PRIORITY).join(', ')}`),
  body('category')
    .optional()
    .isString().trim().isLength({ max: 50 }).withMessage('category must be at most 50 characters'),
  body('resolution_notes')
    .optional()
    .isString().trim().isLength({ max: 4000 }).withMessage('resolution_notes must be at most 4000 characters'),
];

const updateTicketStatusValidation = [
  ...ticketParamValidation,
  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(Object.values(TICKET_STATUS)).withMessage(`status must be one of: ${Object.values(TICKET_STATUS).join(', ')}`),
];

const addMessageValidation = [
  ...ticketParamValidation,
  body('message')
    .notEmpty().withMessage('message is required')
    .isString().trim().isLength({ max: 4000 }).withMessage('message must be at most 4000 characters'),
];

module.exports = {
  ticketParamValidation,
  createTicketValidation,
  listTicketsValidation,
  updateTicketValidation,
  updateTicketStatusValidation,
  addMessageValidation,
};
