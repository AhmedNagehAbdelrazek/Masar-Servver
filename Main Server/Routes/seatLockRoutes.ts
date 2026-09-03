import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/seatLockController';
import protect from '../middlewares/protect';
import validate from '../middlewares/validatorMiddleware';
import { lockSeatValidation, releaseSeatLockValidation } from '../utils/validators/tripValidator';

// Lock a seat (passenger only)
router.post('/:trip_id/seats/lock', protect, ...lockSeatValidation, validate, c.lockSeat);

// Release a seat lock (passenger only)
router.delete('/:trip_id/seats/lock/:seat_number', protect, ...releaseSeatLockValidation, validate, c.releaseSeat);

export default router;
module.exports = router;
