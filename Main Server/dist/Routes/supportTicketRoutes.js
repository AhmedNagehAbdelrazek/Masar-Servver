"use strict";
const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/supportTicketController');
const v = require('../utils/validators/supportTicketValidator');
router.use(protect);
router.post('/', ...v.createTicketValidation, validate, c.createTicket);
router.get('/', ...v.listTicketsValidation, validate, c.listTickets);
router.get('/:ticket_id', ...v.ticketParamValidation, c.getTicket);
router.put('/:ticket_id', roleGuard(['admin', 'support', 'moderator']), ...v.updateTicketValidation, validate, c.updateTicket);
router.put('/:ticket_id/status', roleGuard(['admin', 'support', 'moderator']), ...v.updateTicketStatusValidation, validate, c.updateStatus);
router.post('/:ticket_id/messages', ...v.addMessageValidation, validate, c.addMessage);
module.exports = router;
//# sourceMappingURL=supportTicketRoutes.js.map