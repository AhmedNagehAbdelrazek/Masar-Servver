import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/driverVerificationController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { driverVerificationValidation } from '../utils/validators/driverVerificationValidator';

// Driver verification status
router.get('/verification-status', protect, roleGuard(['driver']), c.getStatus);

// Driver current submission (form prefill)
router.get('/verification', protect, roleGuard(['driver']), c.getSubmission);

// Driver submit / resubmit verification package
router.put('/verification', protect, roleGuard(['driver']), ...driverVerificationValidation, validate, c.submit);

export default router;
module.exports = router;
