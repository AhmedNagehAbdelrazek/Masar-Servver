import { Router } from 'express';
import { param } from 'express-validator';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/adminBookingController';

const admin = [protect, roleGuard(['admin'])];
const bookingId = [param('booking_id').isUUID().withMessage('BOOKING_ID_MUST_BE_A_VALID_UUID')];

router.get('/bookings/stats', ...admin, c.getStats);
router.get('/bookings', ...admin, c.listBookings);
router.get('/bookings/:booking_id', ...admin, ...bookingId, validate, c.getDetail);
router.post('/bookings/:booking_id/cancel', ...admin, ...bookingId, validate, c.cancelBooking);

export default router;
module.exports = router;
