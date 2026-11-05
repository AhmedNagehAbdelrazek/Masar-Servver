import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/bookingController';
import * as v from '../utils/validators/bookingValidator';
import { pickupPreviewValidation } from '../utils/validators/mapsValidator';

router.use(protect);

router.get('/', roleGuard(['passenger']), ...v.passengerBookingListValidation, validate, c.listMyBookings);
router.post('/', roleGuard(['passenger']), ...v.createBookingValidation, validate, c.createBooking);
router.get('/:booking_id', roleGuard(['passenger']), ...v.cancelBookingValidation, c.getBooking);
// Driver reveal for a confirmed booking (passenger owner, trip driver, or admin)
router.get('/:booking_id/driver-profile', ...v.cancelBookingValidation, validate, c.getDriverProfile);
router.put('/:booking_id/cancel', roleGuard(['passenger']), ...v.cancelBookingValidation, c.cancelBooking);
// Planned route + own pickup (+ recorded path when available)
router.get('/:booking_id/route', roleGuard(['passenger', 'driver']), ...v.cancelBookingValidation, validate, c.getBookingRoute);
// Passenger changes pickup before the cutoff
router.patch('/:booking_id/pickup', roleGuard(['passenger']), ...v.cancelBookingValidation, ...pickupPreviewValidation, validate, c.editBookingPickup);
router.post('/:booking_id/delay', ...v.reportDelayValidation, validate, c.reportDelay);
router.get('/:booking_id/delays', ...v.delayListValidation, validate, c.listDelays);

export default router;
module.exports = router;
