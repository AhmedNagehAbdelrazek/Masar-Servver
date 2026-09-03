"use strict";
const seatLockService = require('../Services/seatLockService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const { markResource } = require('../Services/auditService');
const lockSeat = catchAsync(async (req, res) => {
    const { trip_id } = req.params;
    const { seat_number } = req.body;
    const result = await seatLockService.lockSeat(trip_id, seat_number, req.user.id);
    markResource(res, {
        type: 'trip',
        id: trip_id,
        label: `seat ${seat_number}`,
    });
    successResponse(res, result, 200);
});
const releaseSeat = catchAsync(async (req, res) => {
    const { trip_id, seat_number } = req.params;
    const result = await seatLockService.releaseSeat(trip_id, parseInt(seat_number, 10), req.user.id);
    markResource(res, { type: 'trip', id: trip_id, label: `seat ${seat_number}` });
    successResponse(res, result);
});
module.exports = {
    lockSeat,
    releaseSeat,
};
//# sourceMappingURL=seatLockController.js.map