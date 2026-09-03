import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/sosController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { sosListValidation, sosIdParamValidation, resolveSosValidation, } from '../utils/validators/sosValidator';

// SOS management (admin only)
router.get('/sos', protect, roleGuard(['admin']), ...sosListValidation, validate, c.listSos);
router.post('/sos/:id/ack', protect, roleGuard(['admin']), ...sosIdParamValidation, validate, c.ackSos);
router.post('/sos/:id/resolve', protect, roleGuard(['admin']), ...resolveSosValidation, validate, c.resolveSos);

export default router;
module.exports = router;
