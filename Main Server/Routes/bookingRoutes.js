const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/bookingController');
const v = require('../utils/validators/bookingValidator');

router.use(protect);

router.get('/', roleGuard(['passenger']), ...v.passengerBookingListValidation, validate, c.listMyBookings);
router.post('/', roleGuard(['passenger']), ...v.createBookingValidation, validate, c.createBooking);
router.get('/:booking_id', roleGuard(['passenger']), ...v.cancelBookingValidation, c.getBooking);
// Driver reveal for a confirmed booking (passenger owner, trip driver, or admin)
router.get('/:booking_id/driver-profile', ...v.cancelBookingValidation, validate, c.getDriverProfile);
router.put('/:booking_id/cancel', roleGuard(['passenger']), ...v.cancelBookingValidation, c.cancelBooking);
router.post('/:booking_id/delay', ...v.reportDelayValidation, validate, c.reportDelay);
router.get('/:booking_id/delays', ...v.delayListValidation, validate, c.listDelays);

module.exports = router;
