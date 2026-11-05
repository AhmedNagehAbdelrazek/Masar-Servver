import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/supportTicketController';
import * as v from '../utils/validators/supportTicketValidator';

router.use(protect);

router.post('/', ...v.createTicketValidation, validate, c.createTicket);
router.get('/', ...v.listTicketsValidation, validate, c.listTickets);
router.get('/:ticket_id', ...v.ticketParamValidation, c.getTicket);
router.put('/:ticket_id', roleGuard(['admin', 'support', 'moderator']), ...v.updateTicketValidation, validate, c.updateTicket);
router.put('/:ticket_id/status', roleGuard(['admin', 'support', 'moderator']), ...v.updateTicketStatusValidation, validate, c.updateStatus);
router.post('/:ticket_id/messages', ...v.addMessageValidation, validate, c.addMessage);

export default router;
module.exports = router;
