const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/rideRequestController');
const v = require('../utils/validators/rideRequestValidator');

router.use(protect);

router.post('/', roleGuard(['passenger']), ...v.createRideRequestValidation, validate, c.createRideRequest);
router.get('/', ...v.listRideRequestsValidation, validate, c.listRequests);
router.get('/:request_id', ...v.rideRequestParamValidation, c.getRequest);
router.put('/:request_id', roleGuard(['passenger']), ...v.updateRideRequestValidation, validate, c.updateRideRequest);

router.post('/:request_id/offers', roleGuard(['driver']), ...v.createOfferValidation, validate, c.submitOffer);
router.get('/:request_id/offers', ...v.listOffersValidation, c.listOffers);

module.exports = router;
