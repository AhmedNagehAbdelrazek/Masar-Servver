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
router.put('/:booking_id/cancel', roleGuard(['passenger']), ...v.cancelBookingValidation, c.cancelBooking);
router.post('/:booking_id/delay', ...v.reportDelayValidation, validate, c.reportDelay);
router.get('/:booking_id/delays', ...v.delayListValidation, validate, c.listDelays);

module.exports = router;
