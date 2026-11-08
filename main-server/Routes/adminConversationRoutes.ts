import { Router } from 'express';
import { param } from 'express-validator';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/adminConversationController';

const admin = [protect, roleGuard(['admin'])];
const bookingId = [param('booking_id').isUUID().withMessage('BOOKING_ID_MUST_BE_A_VALID_UUID')];

router.get('/conversations/stats', ...admin, c.getStats);
router.get('/conversations', ...admin, c.listConversations);
router.get('/conversations/trip/:booking_id', ...admin, ...bookingId, validate, c.getTripThread);
router.post('/conversations/trip/:booking_id/penalties', ...admin, ...bookingId, validate, c.penalize);

export default router;
module.exports = router;
