const bookingService = require('../Services/bookingService');
const delayService = require('../Services/delayService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    markResource(res, {
      type: 'booking',
      id: booking.id,
      label: `booking ${booking.reference_code}`,
    });
    successResponse(res, { booking }, 201);
  } catch (err) {
    next(err);
  }
};

const listMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.listForPassenger(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const result = await bookingService.getForPassenger(req.user.id, req.params.booking_id);
    markResource(res, {
      type: 'booking',
      id: req.params.booking_id,
      label: `booking ${result.booking.reference_code}`,
    });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(req.user.id, req.params.booking_id);
    markResource(res, {
      type: 'booking',
      id: req.params.booking_id,
      label: `booking ${result.booking.id}`,
    });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const reportDelay = async (req, res, next) => {
  try {
    const delay_event = await delayService.reportDelay(req.user, req.params.booking_id, req.body);
    markResource(res, { type: 'delay_event', id: delay_event.id });
    successResponse(res, { delay_event }, 201);
  } catch (err) {
    next(err);
  }
};

const listDelays = async (req, res, next) => {
  try {
    const result = await delayService.listDelays(req.user, req.params.booking_id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  listMyBookings,
  getBooking,
  cancelBooking,
  reportDelay,
  listDelays,
};
