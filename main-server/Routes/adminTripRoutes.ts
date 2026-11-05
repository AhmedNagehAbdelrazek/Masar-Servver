import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/tripController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { tripParamValidation } from '../utils/validators/tripValidator';

// Read-only planned + recorded routes for support roles. Every view is
// audited in the service layer; recorded paths only on completed trips.
router.get('/trips/:trip_id/route', protect, roleGuard(['admin', 'support', 'moderator']), ...tripParamValidation, validate, c.getAdminTripRoute);
router.get('/trips/:trip_id/route/actual', protect, roleGuard(['admin', 'support', 'moderator']), ...tripParamValidation, validate, c.getAdminTripActual);

export default router;
module.exports = router;
