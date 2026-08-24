const messageService = require('../Services/messageService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');

const getBookingMessages = catchAsync(async (req, res) => {
  const result = await messageService.listBookingMessages(req.user, {
    bookingId: req.params.bookingId,
    page: req.query.page,
    limit: req.query.limit,
    beforeId: req.query.before_id,
  });
  successResponse(res, result);
});

const getTicketMessages = catchAsync(async (req, res) => {
  const result = await messageService.listSupportMessages(req.user, {
    supportTicketId: req.params.ticketId,
    page: req.query.page,
    limit: req.query.limit,
    beforeId: req.query.before_id,
  });
  successResponse(res, result);
});

module.exports = { getBookingMessages, getTicketMessages };
