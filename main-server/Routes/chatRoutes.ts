import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/messageController';
import protect from '../middlewares/protect';
import validate from '../middlewares/validatorMiddleware';
import { bookingMessagesValidation, ticketMessagesValidation, } from '../utils/validators/messageValidator';

// Chat history — REST fallback for offline/missed retrieval. Booking chat
// history stays readable (read-only) after its trip completes/cancels.
router.get('/bookings/:bookingId/messages', protect, ...bookingMessagesValidation, validate, c.getBookingMessages);
router.get('/tickets/:ticketId/messages', protect, ...ticketMessagesValidation, validate, c.getTicketMessages);

export default router;
module.exports = router;
