"use strict";
const router = require('express').Router();
const c = require('../Controllers/messageController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const { bookingMessagesValidation, ticketMessagesValidation, } = require('../utils/validators/messageValidator');
// Chat history — REST fallback for offline/missed retrieval. Booking chat
// history stays readable (read-only) after its trip completes/cancels.
router.get('/bookings/:bookingId/messages', protect, ...bookingMessagesValidation, validate, c.getBookingMessages);
router.get('/tickets/:ticketId/messages', protect, ...ticketMessagesValidation, validate, c.getTicketMessages);
module.exports = router;
//# sourceMappingURL=chatRoutes.js.map