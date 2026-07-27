const seatLockService = require('../Services/seatLockService');
const { successResponse } = require('../utils/httpResponse');

const lockSeat = async (req, res, next) => {
  try {
    const { trip_id } = req.params;
    const { seat_number } = req.body;
    const result = await seatLockService.lockSeat(trip_id, seat_number, req.user.id);
    successResponse(res, result, 200);
  } catch (err) {
    next(err);
  }
};

const releaseSeat = async (req, res, next) => {
  try {
    const { trip_id, seat_number } = req.params;
    const result = await seatLockService.releaseSeat(trip_id, parseInt(seat_number, 10), req.user.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  lockSeat,
  releaseSeat,
};
