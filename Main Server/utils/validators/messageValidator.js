const { param, query } = require('express-validator');

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100'),
  query('before_id')
    .optional()
    .isUUID().withMessage('before_id must be a valid UUID'),
];

const bookingMessagesValidation = [
  param('bookingId')
    .isUUID().withMessage('Booking ID must be a valid UUID'),
  ...paginationQuery,
];

const ticketMessagesValidation = [
  param('ticketId')
    .isUUID().withMessage('Ticket ID must be a valid UUID'),
  ...paginationQuery,
];

module.exports = { bookingMessagesValidation, ticketMessagesValidation };
