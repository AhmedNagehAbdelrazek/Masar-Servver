import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/paymentMethodController';
import * as v from '../utils/validators/paymentMethodValidator';

// Authenticated catalog of active payment methods (US4: was public before spec 009)
router.get('/', protect, c.listActiveMethods);

// Admin CRUD
router.get('/all', protect, roleGuard(['admin']), c.listAllMethods);
router.post('/', protect, roleGuard(['admin']), ...v.createMethodValidation, validate, c.createMethod);
router.put('/:method_id', protect, roleGuard(['admin']), ...v.updateMethodValidation, validate, c.updateMethod);
router.delete('/:method_id', protect, roleGuard(['admin']), ...v.methodParamValidation, c.deactivateMethod);

export default router;
module.exports = router;
