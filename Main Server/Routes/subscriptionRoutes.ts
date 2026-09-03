import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/subscriptionController';
import { createSubscriptionValidation } from '../utils/validators/subscriptionValidator';

const driver = [protect, roleGuard(['driver'])];

router.post('/', ...driver, ...createSubscriptionValidation, validate, c.createSubscription);
router.get('/', ...driver, c.getMySubscriptions);
router.get('/current', ...driver, c.getCurrentSubscription);

export default router;
module.exports = router;
