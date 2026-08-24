const bookingService = require('../Services/bookingService');
const delayService = require('../Services/delayService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const { markResource } = require('../Services/auditService');

const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);
  markResource(res, {
    type: 'booking',
    id: booking.id,
    label: `booking ${booking.reference_code}`,
  });
  successResponse(res, { booking }, 201);
});

const listMyBookings = catchAsync(async (req, res) => {
  const result = await bookingService.listForPassenger(req.user.id, req.query);
  successResponse(res, result);
});

const getBooking = catchAsync(async (req, res) => {
  const result = await bookingService.getForPassenger(req.user.id, req.params.booking_id);
  markResource(res, {
    type: 'booking',
    id: req.params.booking_id,
    label: `booking ${result.booking.reference_code}`,
  });
  successResponse(res, result);
});

const cancelBooking = catchAsync(async (req, res) => {
  const result = await bookingService.cancelBooking(req.user.id, req.params.booking_id);
  markResource(res, {
    type: 'booking',
    id: req.params.booking_id,
    label: `booking ${result.booking.id}`,
  });
  successResponse(res, result);
});

const reportDelay = catchAsync(async (req, res) => {
  const delay_event = await delayService.reportDelay(req.user, req.params.booking_id, req.body);
  markResource(res, { type: 'delay_event', id: delay_event.id });
  successResponse(res, { delay_event }, 201);
});

const listDelays = catchAsync(async (req, res) => {
  const result = await delayService.listDelays(req.user, req.params.booking_id, req.query);
  successResponse(res, result);
});

module.exports = {
  createBooking,
  listMyBookings,
  getBooking,
  cancelBooking,
  reportDelay,
  listDelays,
};
