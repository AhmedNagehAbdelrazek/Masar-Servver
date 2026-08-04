const router = require('express').Router();
const c = require('../Controllers/messageController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const {
  tripMessagesValidation,
  ticketMessagesValidation,
} = require('../utils/validators/messageValidator');

// Chat history — REST fallback for offline/missed retrieval.
router.get('/trips/:tripId/messages', protect, ...tripMessagesValidation, validate, c.getTripMessages);
router.get('/tickets/:ticketId/messages', protect, ...ticketMessagesValidation, validate, c.getTicketMessages);

module.exports = router;
