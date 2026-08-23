const messageService = require('../Services/messageService');
const { successResponse } = require('../utils/httpResponse');

const getBookingMessages = async (req, res, next) => {
  try {
    const result = await messageService.listBookingMessages(req.user, {
      bookingId: req.params.bookingId,
      page: req.query.page,
      limit: req.query.limit,
      beforeId: req.query.before_id,
    });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getTicketMessages = async (req, res, next) => {
  try {
    const result = await messageService.listSupportMessages(req.user, {
      supportTicketId: req.params.ticketId,
      page: req.query.page,
      limit: req.query.limit,
      beforeId: req.query.before_id,
    });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getBookingMessages, getTicketMessages };
