const router = require('express').Router();
const c = require('../Controllers/seatLockController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const { lockSeatValidation, releaseSeatLockValidation } = require('../utils/validators/tripValidator');

// Lock a seat (passenger only)
router.post('/:trip_id/seats/lock', protect, ...lockSeatValidation, validate, c.lockSeat);

// Release a seat lock (passenger only)
router.delete('/:trip_id/seats/lock/:seat_number', protect, ...releaseSeatLockValidation, validate, c.releaseSeat);

module.exports = router;
