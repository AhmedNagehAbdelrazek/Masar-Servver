import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/passengerProfileController';
import { updatePassengerProfileValidation } from '../utils/validators/profileValidator';

router.use(protect);

router.get('/', roleGuard(['passenger']), c.getMyProfile);
router.put('/', roleGuard(['passenger']), ...updatePassengerProfileValidation, validate, c.updateMyProfile);
router.get('/account-summary', roleGuard(['passenger']), c.getAccountSummary);
router.get('/home', roleGuard(['passenger']), c.getPassengerHome);

export default router;
module.exports = router;
