import { Router } from 'express';
const router: Router = Router();
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import * as c from '../Controllers/rideRequestController';
import * as v from '../utils/validators/rideRequestValidator';

router.use(protect);

router.post('/', roleGuard(['passenger']), ...v.createRideRequestValidation, validate, c.createRideRequest);
router.get('/', ...v.listRideRequestsValidation, validate, c.listRequests);
router.get('/:request_id', ...v.rideRequestParamValidation, c.getRequest);
router.get('/:request_id/matches', roleGuard(['passenger']), ...v.rideRequestParamValidation, c.getMatches);
router.put('/:request_id', roleGuard(['passenger']), ...v.updateRideRequestValidation, validate, c.updateRideRequest);

router.post('/:request_id/offers', roleGuard(['driver']), ...v.createOfferValidation, validate, c.submitOffer);
router.get('/:request_id/offers', ...v.listOffersValidation, c.listOffers);

export default router;
module.exports = router;
