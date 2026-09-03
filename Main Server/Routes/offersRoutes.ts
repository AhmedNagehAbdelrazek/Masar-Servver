import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/rideRequestController';
import { decideOfferValidation, agreePriceValidation } from '../utils/validators/rideRequestValidator';

router.use(protect);

router.put('/:offer_id', roleGuard(['passenger']), ...decideOfferValidation, validate, c.decideOffer);
router.put('/:offer_id/price', roleGuard(['passenger']), ...agreePriceValidation, validate, c.agreePrice);

export default router;
module.exports = router;
