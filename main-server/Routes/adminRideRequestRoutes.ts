import { Router } from 'express';
import { param } from 'express-validator';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/adminRideRequestController';

const admin = [protect, roleGuard(['admin'])];
const requestId = [param('request_id').isUUID().withMessage('REQUEST_ID_MUST_BE_A_VALID_UUID')];

router.get('/ride-requests/stats', ...admin, c.getStats);
router.get('/ride-requests', ...admin, c.listRequests);
router.get('/ride-requests/:request_id', ...admin, ...requestId, validate, c.getDetail);

export default router;
module.exports = router;
